'use strict'

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType
} = require('@whiskeysockets/baileys')

const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs-extra')
const path = require('path')
const config = require('../config')
const logger = require('./logger')
const utils = require('./utils')

// ===========================
// In Memory Store
// Keeps track of messages/chats
// ===========================
const store = makeInMemoryStore({
  logger: pino({ level: 'silent' })
})

// ===========================
// Auto Restart Scheduler
// Restarts bot at set time daily
// ===========================
const scheduleAutoRestart = () => {
  if (!config.autoRestart) return
  const [hour, minute] = config.autoRestartTime.split(':').map(Number)
  const now = new Date()
  const restart = new Date()
  restart.setHours(hour, minute, 0, 0)
  if (restart <= now) restart.setDate(restart.getDate() + 1)
  const msUntilRestart = restart - now
  logger.info(`Auto restart scheduled at ${config.autoRestartTime} (in ${utils.secondsToTime(msUntilRestart / 1000)})`)
  setTimeout(() => {
    logger.warn('Auto restarting bot now...')
    process.exit(0)
  }, msUntilRestart)
}

// ===========================
// Main Connection Function
// ===========================
const connectToWhatsApp = async () => {

  // Ensure session directory exists
  utils.ensureDir(config.sessionDir)

  // Load auth state from session folder
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir)

  // Fetch latest Baileys version
  const { version, isLatest } = await fetchLatestBaileysVersion()
  logger.info(`Using Baileys v${version.join('.')} | Latest: ${isLatest}`)

  // ===========================
  // Create WhatsApp Socket
  // ===========================
  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: config.sessionMethod === 'qr',
    browser: ['NelsonFxBot', 'Chrome', '1.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id)
        return msg?.message || undefined
      }
      return { conversation: 'NelsonFxBot' }
    }
  })

  // Bind store to socket events
  store.bind(sock.ev)

  // ===========================
  // Pairing Code Method
  // ===========================
  if (
    config.sessionMethod === 'pairing' &&
    !sock.authState.creds.registered &&
    config.botNumber
  ) {
    const number = config.botNumber.replace(/[^0-9]/g, '')
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(number)
        logger.info(`Your Pairing Code: ${code}`)
        logger.info('Enter this code in WhatsApp > Linked Devices > Link with phone number')
      } catch (err) {
        logger.error('Failed to get pairing code: ' + err.message)
      }
    }, 3000)
  }

  // ===========================
  // Connection Update Handler
  // ===========================
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // QR Code shown
    if (qr) {
      logger.info('QR Code received — scan it with your WhatsApp!')
    }

    // Connected
    if (connection === 'open') {
      logger.banner(config.botName, config.version, config.ownerNumber)
      logger.success(`${config.botName} is now connected!`)
      logger.info(`Logged in as: ${sock.user?.name || 'Unknown'}`)
      logger.info(`Bot Number: ${utils.formatNumber(sock.user?.id || '')}`)
      scheduleAutoRestart()

      // Notify owner on connect
      try {
        await sock.sendMessage(utils.toJid(config.ownerNumber), {
          text: `✅ *${config.botName} is now online!*\n\n` +
                `🕐 Time: ${utils.getTime()}\n` +
                `📅 Date: ${utils.getDate()}\n` +
                `⚡ Version: ${config.version}\n` +
                `🟢 Status: Connected`
        })
      } catch {
        // owner notification failed silently
      }
    }

    // Disconnected
    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      logger.warn(`Connection closed — Status: ${statusCode}`)

      if (shouldReconnect) {
        logger.info('Reconnecting...')
        setTimeout(() => connectToWhatsApp(), 5000)
      } else {
        logger.error('Bot logged out! Delete session folder and restart.')
        // Clear session on logout
        try {
          await fs.remove(config.sessionDir)
          logger.info('Session cleared. Restart the bot to scan QR again.')
        } catch {
          // silently fail
        }
        process.exit(1)
      }
    }
  })

  // ===========================
  // Save Credentials
  // ===========================
  sock.ev.on('creds.update', saveCreds)

  // ===========================
  // Messages Handler
  // Passes messages to main handler
  // ===========================
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (!msg.message) continue
      if (msg.key.fromMe && !config.isOwner) continue

      try {
        // Dynamically load handler to allow hot reload
        const handler = require('../handler')
        await handler(sock, msg, store)
      } catch (err) {
        logger.error('Handler error: ' + err.message)
      }
    }
  })

  // ===========================
  // Group Participants Update
  // For welcome/goodbye messages
  // ===========================
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const groupHandler = require('../commands/antis')
      await groupHandler.handleParticipantUpdate(sock, update)
    } catch (err) {
      logger.error('Group participant update error: ' + err.message)
    }
  })

  // ===========================
  // Call Handler
  // Auto reject calls to bot number
  // ===========================
  sock.ev.on('call', async (calls) => {
    for (const call of calls) {
      if (call.status === 'offer') {
        await sock.rejectCall(call.id, call.from)
        logger.info(`Rejected call from ${call.from}`)
        try {
          await sock.sendMessage(call.from, {
            text: `❌ Sorry, I don't accept calls!\n\nI'm a bot. Contact my owner for support:\nwa.me/${config.ownerNumber}`
          })
        } catch {
          // silently fail
        }
      }
    }
  })

  // ===========================
  // Anti Crash Handler
  // Bot never fully dies
  // ===========================
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception: ' + err.message)
  })

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection: ' + err.message)
  })

  return sock
}

module.exports = { connectToWhatsApp, store }

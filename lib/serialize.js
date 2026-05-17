'use strict'

const { downloadContentFromMessage, jidDecode } = require('@whiskeysockets/baileys')
const config = require('../config')
const utils = require('./utils')

// ===========================
// NelsonFxBot Message Serializer
// Normalizes every incoming message
// into a clean easy-to-use object
// ===========================

const serialize = async (msg, sock) => {
  if (!msg) return null
  if (!msg.message) return null

  // ===========================
  // Basic Message Info
  // ===========================
  const from = msg.key.remoteJid
  const isGroup = from.endsWith('@g.us')
  const sender = isGroup
    ? msg.key.participant || msg.participant
    : msg.key.remoteJid
  const senderNumber = utils.formatNumber(sender)
  const fromNumber = utils.formatNumber(from)
  const pushName = msg.pushName || 'User'
  const botNumber = sock.user?.id ? utils.formatNumber(sock.user.id) : ''
  const isOwner = senderNumber === config.ownerNumber
  const isBot = senderNumber === botNumber
  const timestamp = msg.messageTimestamp

  // ===========================
  // Message Type Detection
  // ===========================
  const messageType = Object.keys(msg.message)[0]
  const content = msg.message

  // Handle view once messages
  const viewOnce =
    content?.viewOnceMessage?.message ||
    content?.viewOnceMessageV2?.message ||
    content?.viewOnceMessageV2Extension?.message

  // Get actual message object
  const actualMessage = viewOnce || content

  // Get actual message type
  const actualType = viewOnce
    ? Object.keys(viewOnce)[0]
    : messageType

  // ===========================
  // Text Extraction
  // ===========================
  const textContent =
    actualMessage?.conversation ||
    actualMessage?.extendedTextMessage?.text ||
    actualMessage?.imageMessage?.caption ||
    actualMessage?.videoMessage?.caption ||
    actualMessage?.documentMessage?.caption ||
    actualMessage?.buttonsResponseMessage?.selectedButtonId ||
    actualMessage?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    actualMessage?.templateButtonReplyMessage?.selectedId ||
    ''

  const body = textContent || ''

  // ===========================
  // Command Parsing
  // ===========================
  const prefix = config.prefix
  const isCmd = body.startsWith(prefix)
  const command = isCmd
    ? body.slice(prefix.length).trim().split(/\s+/).shift().toLowerCase()
    : ''
  const args = isCmd
    ? body.trim().split(/\s+/).slice(1)
    : []
  const text = args.join(' ')
  const query = text

  // ===========================
  // Group Info
  // ===========================
  let groupMetadata = null
  let groupName = ''
  let groupDesc = ''
  let groupMembers = []
  let groupAdmins = []
  let isBotAdmin = false
  let isSenderAdmin = false

  if (isGroup) {
    try {
      groupMetadata = await sock.groupMetadata(from)
      groupName = groupMetadata.subject || ''
      groupDesc = groupMetadata.desc || ''
      groupMembers = groupMetadata.participants || []
      groupAdmins = groupMembers
        .filter(m => m.admin === 'admin' || m.admin === 'superadmin')
        .map(m => m.id)
      isBotAdmin = groupAdmins.includes(sock.user?.id)
      isSenderAdmin = groupAdmins.includes(sender) || isOwner
    } catch {
      // group metadata fetch failed
    }
  }

  // ===========================
  // Quoted Message
  // ===========================
  const quoted = actualMessage?.extendedTextMessage?.contextInfo?.quotedMessage
    ? {
        type: Object.keys(
          actualMessage.extendedTextMessage.contextInfo.quotedMessage
        )[0],
        message:
          actualMessage.extendedTextMessage.contextInfo.quotedMessage,
        sender:
          actualMessage.extendedTextMessage.contextInfo.participant,
        stanzaId:
          actualMessage.extendedTextMessage.contextInfo.stanzaId,

        // Download quoted media
        download: async () => {
          const quotedMsg =
            actualMessage.extendedTextMessage.contextInfo.quotedMessage
          const quotedType = Object.keys(quotedMsg)[0]
          const stream = await downloadContentFromMessage(
            quotedMsg[quotedType],
            quotedType.replace('Message', '')
          )
          let buffer = Buffer.from([])
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
          }
          return buffer
        }
      }
    : null

  // ===========================
  // Media Download Helper
  // ===========================
  const download = async () => {
    const mediaType = actualType.replace('Message', '')
    const stream = await downloadContentFromMessage(
      actualMessage[actualType],
      mediaType
    )
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
  }

  // ===========================
  // Reply Helper
  // ===========================
  const reply = async (text) => {
    return await sock.sendMessage(from, { text: String(text) }, { quoted: msg })
  }

  // ===========================
  // React Helper
  // ===========================
  const react = async (emoji) => {
    return await sock.sendMessage(from, {
      react: { text: emoji, key: msg.key }
    })
  }

  // ===========================
  // Final Serialized Object
  // ===========================
  return {
    // Raw
    raw: msg,
    sock,

    // Identity
    from,
    sender,
    senderNumber,
    fromNumber,
    pushName,
    botNumber,
    isOwner,
    isBot,
    timestamp,

    // Message
    messageType,
    actualType,
    body,
    isCmd,
    command,
    args,
    text,
    query,
    prefix,

    // Media
    isImage: actualType === 'imageMessage',
    isVideo: actualType === 'videoMessage',
    isAudio: actualType === 'audioMessage',
    isSticker: actualType === 'stickerMessage',
    isDocument: actualType === 'documentMessage',
    isText: actualType === 'conversation' || actualType === 'extendedTextMessage',
    isViewOnce: !!viewOnce,

    // Group
    isGroup,
    groupMetadata,
    groupName,
    groupDesc,
    groupMembers,
    groupAdmins,
    isBotAdmin,
    isSenderAdmin,

    // Quoted
    quoted,

    // Helpers
    download,
    reply,
    react,

    // Key
    key: msg.key
  }
}

module.exports = serialize

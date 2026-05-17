'use strict'

const config = require('./config')
const logger = require('./lib/logger')
const serialize = require('./lib/serialize')
const utils = require('./lib/utils')
const db = require('./database/db')

// ===========================
// Command Registry
// Auto loads all command files
// ===========================
const commands = new Map()
const cooldowns = new Map()

const loadCommands = () => {
  const fs = require('fs-extra')
  const path = require('path')
  const cmdDir = path.join(__dirname, 'commands')

  try {
    const files = fs.readdirSync(cmdDir).filter(f => f.endsWith('.js'))
    for (const file of files) {
      // Clear cache for hot reload
      delete require.cache[require.resolve(`./commands/${file}`)]
      const cmds = require(`./commands/${file}`)
      for (const cmd of cmds) {
        if (cmd.command) {
          const cmdNames = Array.isArray(cmd.command) ? cmd.command : [cmd.command]
          for (const name of cmdNames) {
            commands.set(name.toLowerCase(), cmd)
          }
        }
      }
    }
    logger.info(`Loaded ${commands.size} commands successfully`)
  } catch (err) {
    logger.error('Failed to load commands: ' + err.message)
  }
}

// Load commands on startup
loadCommands()

// ===========================
// Main Handler
// ===========================
const handler = async (sock, rawMsg, store) => {
  try {
    // Serialize message into clean object
    const msg = await serialize(rawMsg, sock)
    if (!msg) return
    if (msg.isBot) return

    // Increment message stats
    db.incrementMessages()

    // ===========================
    // Auto Features
    // ===========================

    // Auto read
    if (config.autoRead) {
      await sock.readMessages([msg.key])
    }

    // Auto typing indicator
    if (config.autoTyping && msg.isCmd) {
      await sock.sendPresenceUpdate('composing', msg.from)
    }

    // ===========================
    // Anti Mod Checks (Groups)
    // ===========================
    if (msg.isGroup && !msg.isOwner && !msg.isSenderAdmin) {
      const groupSettings = db.getGroup(msg.from)

      // Antilink
      if (groupSettings.antilink && msg.body) {
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(chat\.whatsapp\.com\/[^\s]+)/gi
        if (urlRegex.test(msg.body)) {
          try {
            await sock.sendMessage(msg.from, {
              delete: msg.key
            })
            const warns = db.warnUser(msg.senderNumber)
            if (warns >= 3) {
              await sock.groupParticipantsUpdate(msg.from, [msg.sender], 'remove')
              await msg.reply(`⚠️ @${msg.senderNumber} has been kicked for repeatedly sending links!`)
              db.resetWarnings(msg.senderNumber)
            } else {
              await msg.reply(`⚠️ @${msg.senderNumber} links are not allowed here!\nWarning ${warns}/3`)
            }
          } catch {
            // silently fail
          }
          return
        }
      }

      // Antispam
      if (groupSettings.antispam) {
        const key = `${msg.from}:${msg.senderNumber}`
        const now = Date.now()
        const spamData = cooldowns.get(key) || { count: 0, time: now }
        if (now - spamData.time < 3000) {
          spamData.count++
          if (spamData.count >= 5) {
            try {
              await sock.groupParticipantsUpdate(msg.from, [msg.sender], 'remove')
              await msg.reply(`🚫 @${msg.senderNumber} has been kicked for spamming!`)
              cooldowns.delete(key)
            } catch {
              // silently fail
            }
            return
          }
        } else {
          spamData.count = 1
          spamData.time = now
        }
        cooldowns.set(key, spamData)
      }

      // Antiword
      if (groupSettings.antiword && msg.body) {
        const bannedWords = groupSettings.bannedWords || []
        const msgLower = msg.body.toLowerCase()
        const foundWord = bannedWords.find(w => msgLower.includes(w))
        if (foundWord) {
          try {
            await sock.sendMessage(msg.from, { delete: msg.key })
            await msg.reply(`⚠️ @${msg.senderNumber} that word is not allowed here!`)
          } catch {
            // silently fail
          }
          return
        }
      }

      // Antibot
      if (groupSettings.antibot) {
        const isKnownBot = msg.pushName?.toLowerCase().includes('bot') ||
          msg.senderNumber.startsWith('1800') ||
          msg.senderNumber.startsWith('1888')
        if (isKnownBot && !msg.isOwner) {
          try {
            await sock.groupParticipantsUpdate(msg.from, [msg.sender], 'remove')
            await msg.reply(`🤖 Bot detected and removed: @${msg.senderNumber}`)
          } catch {
            // silently fail
          }
          return
        }
      }
    }

    // ===========================
    // Chatbot Auto Reply
    // ===========================
    if (msg.isGroup && !msg.isCmd && msg.body) {
      const groupSettings = db.getGroup(msg.from)
      if (groupSettings.chatbot) {
        try {
          const aiCmd = commands.get('ai')
          if (aiCmd) {
            await aiCmd.execute(sock, msg, { query: msg.body })
          }
        } catch {
          // silently fail
        }
      }
    }

    // ===========================
    // Command Handler
    // ===========================
    if (!msg.isCmd) return

    const cmd = commands.get(msg.command)
    if (!cmd) {
      await msg.react('❓')
      return
    }

    // ===========================
    // Permission Checks
    // ===========================

    // Check banned user
    if (db.isBanned(msg.senderNumber) && !msg.isOwner) {
      await msg.reply(`🚫 You are banned from using ${config.botName}!\nContact support: wa.me/${config.ownerNumber}`)
      return
    }

    // Check bot mode
    const botMode = db.getSettings().botMode || config.mode
    if (botMode === 'private' && !msg.isOwner) {
      await msg.reply(`🔒 ${config.botName} is currently in private mode.\nOnly the owner can use commands.`)
      return
    }
    if (botMode === 'group' && !msg.isGroup && !msg.isOwner) {
      await msg.reply(`👥 ${config.botName} only works in groups!\nJoin a group to use commands.`)
      return
    }

    // Check owner only commands
    if (cmd.ownerOnly && !msg.isOwner) {
      await msg.react('👑')
      await msg.reply(`👑 This command is for the owner only!\nContact: wa.me/${config.ownerNumber}`)
      return
    }

    // Check group only commands
    if (cmd.groupOnly && !msg.isGroup) {
      await msg.react('❌')
      await msg.reply(`👥 This command can only be used in groups!`)
      return
    }

    // Check admin only commands
    if (cmd.adminOnly && !msg.isSenderAdmin && !msg.isOwner) {
      await msg.react('❌')
      await msg.reply(`🛡️ This command is for group admins only!`)
      return
    }

    // Check bot needs admin
    if (cmd.botAdmin && !msg.isBotAdmin) {
      await msg.react('❌')
      await msg.reply(`⚠️ Please make ${config.botName} an admin first!`)
      return
    }

    // ===========================
    // Cooldown Check
    // ===========================
    const cooldownKey = `cmd:${msg.senderNumber}:${msg.command}`
    const now = Date.now()
    const cooldownTime = (cmd.cooldown || config.cooldown) * 1000
    if (cooldowns.has(cooldownKey)) {
      const expiry = cooldowns.get(cooldownKey)
      if (now < expiry) {
        const remaining = ((expiry - now) / 1000).toFixed(1)
        await msg.reply(`⏳ Please wait ${remaining}s before using this command again!`)
        return
      }
    }
    cooldowns.set(cooldownKey, now + cooldownTime)
    setTimeout(() => cooldowns.delete(cooldownKey), cooldownTime)

    // ===========================
    // Execute Command
    // ===========================
    logger.cmd(msg.senderNumber, msg.command, msg.isGroup ? msg.groupName : 'DM')

    // Auto react on command start
    if (config.autoReact) {
      await msg.react('⏳')
    }

    // Update user stats
    db.incrementUserCommands(msg.senderNumber)
    db.incrementCommands()

    // Run the command
    await cmd.execute(sock, msg, {
      args: msg.args,
      text: msg.text,
      query: msg.query,
      prefix: msg.prefix,
      command: msg.command,
      store
    })

    // React success after command runs
    if (config.autoReact) {
      await msg.react('✅')
    }

  } catch (err) {
    logger.error(`Handler error: ${err.message}`)
    try {
      const msg = await serialize(rawMsg, sock)
      if (msg) {
        await msg.react('❌')
        await msg.reply(
          `❌ An error occurred while running this command!\n\n` +
          `Error: ${err.message}\n\n` +
          `Contact support: wa.me/${config.ownerNumber}`
        )
      }
    } catch {
      // silently fail
    }
  }
}

module.exports = handler

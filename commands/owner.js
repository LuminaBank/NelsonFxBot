'use strict'

const config = require('../config')
const utils = require('../lib/utils')
const db = require('../database/db')
const logger = require('../lib/logger')
const fs = require('fs-extra')

// ===========================
// NelsonFxBot Owner Commands
// All commands here are owner only
// ===========================

const owner = [

  // ===========================
  // BROADCAST
  // ===========================
  {
    command: 'broadcast',
    description: 'Broadcast message to all chats',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('📢 Usage: .broadcast <message>')
      await msg.reply('📢 Broadcasting message...')

      try {
        const chats = Object.keys(await sock.groupFetchAllParticipating())
        let sent = 0
        let failed = 0

        for (const chatId of chats) {
          try {
            await sock.sendMessage(chatId, {
              text: `📢 *Broadcast from ${config.botName}*\n\n${text}\n\n_- ${config.botName} Team_`
            })
            sent++
            await utils.sleep(1000)
          } catch {
            failed++
          }
        }

        await msg.reply(
          `📢 *Broadcast Complete!*\n\n` +
          `✅ Sent: ${sent}\n` +
          `❌ Failed: ${failed}\n` +
          `📊 Total: ${sent + failed}`
        )
      } catch (err) {
        await msg.reply(`❌ Broadcast failed: ${err.message}`)
      }
    }
  },

  // ===========================
  // BAN USER
  // ===========================
  {
    command: 'ban',
    description: 'Ban a user from using the bot',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      let target = ''

      if (msg.quoted) {
        target = utils.formatNumber(msg.quoted.sender)
      } else if (text) {
        target = text.replace(/[^0-9]/g, '')
      } else {
        return msg.reply('❌ Usage: .ban @user or reply to a message')
      }

      if (target === config.ownerNumber) {
        return msg.reply('❌ You cannot ban the owner!')
      }

      const result = db.banUser(target)
      if (result) {
        await msg.reply(
          `🚫 *User Banned!*\n\n` +
          `📱 Number: +${target}\n` +
          `👑 Banned by: Owner\n` +
          `📅 Date: ${utils.getDate()}`
        )
      } else {
        await msg.reply(`⚠️ User +${target} is already banned!`)
      }
    }
  },

  // ===========================
  // UNBAN USER
  // ===========================
  {
    command: 'unban',
    description: 'Unban a user',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      let target = ''

      if (msg.quoted) {
        target = utils.formatNumber(msg.quoted.sender)
      } else if (text) {
        target = text.replace(/[^0-9]/g, '')
      } else {
        return msg.reply('❌ Usage: .unban @user or reply to a message')
      }

      const result = db.unbanUser(target)
      if (result) {
        await msg.reply(
          `✅ *User Unbanned!*\n\n` +
          `📱 Number: +${target}\n` +
          `📅 Date: ${utils.getDate()}`
        )
      } else {
        await msg.reply(`⚠️ User +${target} is not banned!`)
      }
    }
  },

  // ===========================
  // LIST BANNED USERS
  // ===========================
  {
    command: 'listban',
    description: 'List all banned users',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg) => {
      const banned = db.getBannedUsers()
      if (banned.length === 0) {
        return msg.reply('✅ No banned users!')
      }

      let text = `🚫 *Banned Users (${banned.length})*\n\n`
      banned.forEach((num, i) => {
        text += `${i + 1}. +${num}\n`
      })
      await msg.reply(text)
    }
  },

  // ===========================
  // BLOCK
  // ===========================
  {
    command: 'block',
    description: 'Block a user on WhatsApp',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      let target = ''

      if (msg.quoted) {
        target = msg.quoted.sender
      } else if (text) {
        target = utils.toJid(text.replace(/[^0-9]/g, ''))
      } else {
        return msg.reply('❌ Usage: .block @user or reply to a message')
      }

      try {
        await sock.updateBlockStatus(target, 'block')
        await msg.reply(
          `🚫 *User Blocked!*\n\n` +
          `📱 Number: +${utils.formatNumber(target)}\n` +
          `📅 Date: ${utils.getDate()}`
        )
      } catch (err) {
        await msg.reply(`❌ Failed to block: ${err.message}`)
      }
    }
  },

  // ===========================
  // UNBLOCK
  // ===========================
  {
    command: 'unblock',
    description: 'Unblock a user on WhatsApp',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      let target = ''

      if (msg.quoted) {
        target = msg.quoted.sender
      } else if (text) {
        target = utils.toJid(text.replace(/[^0-9]/g, ''))
      } else {
        return msg.reply('❌ Usage: .unblock @user or reply to a message')
      }

      try {
        await sock.updateBlockStatus(target, 'unblock')
        await msg.reply(
          `✅ *User Unblocked!*\n\n` +
          `📱 Number: +${utils.formatNumber(target)}\n` +
          `📅 Date: ${utils.getDate()}`
        )
      } catch (err) {
        await msg.reply(`❌ Failed to unblock: ${err.message}`)
      }
    }
  },

  // ===========================
  // EVAL (Run JS Code)
  // ===========================
  {
    command: ['eval', 'exec'],
    description: 'Execute JavaScript code',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .eval <code>')
      try {
        let result = await eval(text)
        if (typeof result !== 'string') {
          result = JSON.stringify(result, null, 2)
        }
        await msg.reply(
          `✅ *Eval Result*\n\n` +
          `📥 *Input:*\n${text}\n\n` +
          `📤 *Output:*\n${result}`
        )
      } catch (err) {
        await msg.reply(
          `❌ *Eval Error*\n\n` +
          `📥 *Input:*\n${text}\n\n` +
          `🔴 *Error:*\n${err.message}`
        )
      }
    }
  },

  // ===========================
  // RESTART
  // ===========================
  {
    command: 'restart',
    description: 'Restart the bot',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg) => {
      await msg.reply(
        `🔄 *Restarting ${config.botName}...*\n\n` +
        `⏳ Bot will be back online in a few seconds!\n` +
        `📅 Time: ${utils.getTime()}`
      )
      await utils.sleep(2000)
      process.exit(0)
    }
  },

  // ===========================
  // SET BOT NAME
  // ===========================
  {
    command: 'setbotname',
    description: 'Change bot WhatsApp name',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .setbotname <name>')
      try {
        await sock.updateProfileName(text)
        await msg.reply(`✅ Bot name changed to: *${text}*`)
      } catch (err) {
        await msg.reply(`❌ Failed to change name: ${err.message}`)
      }
    }
  },

  // ===========================
  // SET BOT STATUS
  // ===========================
  {
    command: 'setbotstatus',
    description: 'Change bot WhatsApp status',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .setbotstatus <status>')
      try {
        await sock.updateProfileStatus(text)
        await msg.reply(`✅ Bot status changed to: *${text}*`)
      } catch (err) {
        await msg.reply(`❌ Failed to change status: ${err.message}`)
      }
    }
  },

  // ===========================
  // SET BOT BIO
  // ===========================
  {
    command: 'setbotbio',
    description: 'Change bot bio/about',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .setbotbio <bio>')
      try {
        await sock.updateProfileStatus(text)
        await msg.reply(`✅ Bot bio changed to: *${text}*`)
      } catch (err) {
        await msg.reply(`❌ Failed to change bio: ${err.message}`)
      }
    }
  },

  // ===========================
  // SET BOT PROFILE PIC
  // ===========================
  {
    command: 'setbotpp',
    description: 'Change bot profile picture',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg) => {
      if (!msg.quoted?.type?.includes('image') && !msg.isImage) {
        return msg.reply('❌ Please send or reply to an image!')
      }
      try {
        const buffer = msg.isImage
          ? await msg.download()
          : await msg.quoted.download()
        await sock.updateProfilePicture(sock.user.id, buffer)
        await msg.reply('✅ Bot profile picture updated!')
      } catch (err) {
        await msg.reply(`❌ Failed to update profile picture: ${err.message}`)
      }
    }
  },

  // ===========================
  // GET LOGS
  // ===========================
  {
    command: 'getlog',
    description: 'View error logs',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg) => {
      try {
        const logPath = './logs/error.log'
        if (!fs.existsSync(logPath)) {
          return msg.reply('📋 No logs found!')
        }
        const logs = fs.readFileSync(logPath, 'utf8')
        const recent = logs.split('\n').slice(-20).join('\n')
        await msg.reply(
          `📋 *Recent Logs (Last 20 lines)*\n\n${recent || 'No logs available'}`
        )
      } catch (err) {
        await msg.reply(`❌ Failed to read logs: ${err.message}`)
      }
    }
  },

  // ===========================
  // CLEAR LOGS
  // ===========================
  {
    command: 'clearlog',
    description: 'Clear error logs',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg) => {
      try {
        const logPath = './logs/error.log'
        if (fs.existsSync(logPath)) {
          fs.writeFileSync(logPath, '')
        }
        await msg.reply('✅ Logs cleared successfully!')
      } catch (err) {
        await msg.reply(`❌ Failed to clear logs: ${err.message}`)
      }
    }
  },

  // ===========================
  // MEMORY USAGE
  // ===========================
  {
    command: 'memory',
    description: 'View RAM and CPU usage',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg) => {
      const mem = utils.getMemoryUsage()
      const uptime = utils.getUptime()
      await msg.reply(
        `💾 *System Memory Usage*\n\n` +
        `📊 *RSS:* ${mem.rss}\n` +
        `🟢 *Heap Used:* ${mem.heapUsed}\n` +
        `📦 *Heap Total:* ${mem.heapTotal}\n` +
        `🔧 *External:* ${mem.external}\n\n` +
        `💻 *CPU:* ${utils.getCpuUsage()}\n` +
        `⏱️ *Uptime:* ${uptime}\n` +
        `🟢 *Node.js:* ${utils.getNodeVersion()}\n` +
        `💻 *Platform:* ${utils.getPlatform()}`
      )
    }
  },

  // ===========================
  // SET MODE
  // ===========================
  {
    command: 'setmode',
    description: 'Change bot mode',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      const modes = ['public', 'private', 'group']
      if (!text || !modes.includes(text.toLowerCase())) {
        return msg.reply(
          `❌ Usage: .setmode <mode>\n\n` +
          `Available modes:\n` +
          `• *public* - Everyone can use\n` +
          `• *private* - Owner only\n` +
          `• *group* - Groups only`
        )
      }
      db.updateSettings('botMode', text.toLowerCase())
      await msg.reply(
        `✅ *Bot mode changed!*\n\n` +
        `🔧 Mode: *${text.toLowerCase()}*`
      )
    }
  },

  // ===========================
  // ADD PREFIX
  // ===========================
  {
    command: 'addprefix',
    description: 'Change command prefix',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .addprefix <prefix>')
      db.updateSettings('prefix', text.trim()[0])
      await msg.reply(
        `✅ *Prefix changed!*\n\n` +
        `⚙️ New prefix: *${text.trim()[0]}*\n` +
        `💡 Example: ${text.trim()[0]}menu`
      )
    }
  },

  // ===========================
  // BOT STATS
  // ===========================
  {
    command: 'botstats',
    description: 'View full bot statistics',
    category: 'Owner',
    ownerOnly: true,
    execute: async (sock, msg) => {
      const stats = db.getStats()
      const banned = db.getBannedUsers()
      const uptime = utils.getUptime()
      const mem = utils.getMemoryUsage()

      await msg.reply(
        `📊 *${config.botName} Statistics*\n\n` +
        `⏱️ *Uptime:* ${uptime}\n` +
        `💬 *Total Messages:* ${stats.totalMessages}\n` +
        `⚡ *Total Commands:* ${stats.totalCommands}\n` +
        `🚫 *Banned Users:* ${banned.length}\n\n` +
        `💾 *RAM Used:* ${mem.heapUsed}\n` +
        `🟢 *Node.js:* ${utils.getNodeVersion()}\n` +
        `📅 *Date:* ${utils.getDate()}\n` +
        `🕐 *Time:* ${utils.getTime()}`
      )
    }
  }

]

module.exports = owner

'use strict'

const config = require('../config')
const utils = require('../lib/utils')
const db = require('../database/db')

// ===========================
// NelsonFxBot Basic Commands
// ===========================

const basic = [

  // ===========================
  // PING
  // ===========================
  {
    command: 'ping',
    description: 'Check bot response speed',
    category: 'Basic',
    execute: async (sock, msg) => {
      const start = Date.now()
      await msg.reply('Pinging...')
      const end = Date.now()
      await msg.reply(
        `🏓 *Pong!*\n\n` +
        `⚡ Response: *${end - start}ms*\n` +
        `🟢 Status: *Online*\n` +
        `🤖 Bot: *${config.botName}*`
      )
    }
  },

  // ===========================
  // ALIVE
  // ===========================
  {
    command: ['alive', 'online'],
    description: 'Check if bot is alive',
    category: 'Basic',
    execute: async (sock, msg) => {
      const stats = db.getStats()
      const uptime = utils.getUptime()
      const mem = utils.getMemoryUsage()
      await msg.reply(
        `╔═══════════════════╗\n` +
        `║  *${config.botName}* 🤖  ║\n` +
        `╚═══════════════════╝\n\n` +
        `✅ *Bot is Alive and Running!*\n\n` +
        `⏱️ *Uptime:* ${uptime}\n` +
        `📅 *Date:* ${utils.getDate()}\n` +
        `🕐 *Time:* ${utils.getTime()}\n` +
        `💾 *Memory:* ${mem.heapUsed}\n` +
        `📊 *Total Commands Used:* ${stats.totalCommands}\n` +
        `📨 *Total Messages:* ${stats.totalMessages}\n` +
        `🔖 *Version:* ${config.version}\n\n` +
        `👑 *Owner:* wa.me/${config.ownerNumber}\n` +
        `💬 *Support:* ${config.support}`
      )
    }
  },

  // ===========================
  // MENU
  // ===========================
  {
    command: ['menu', 'help', 'start'],
    description: 'Show all commands',
    category: 'Basic',
    execute: async (sock, msg) => {
      const uptime = utils.getUptime()
      const settings = db.getSettings()
      const prefix = settings.prefix || config.prefix

      let menuText = `╔═══════════════════╗\n`
      menuText += `║  *${config.botName}* 🤖  ║\n`
      menuText += `╚═══════════════════╝\n\n`
      menuText += `👋 Hello *${msg.pushName}!*\n`
      menuText += `⏱️ Uptime: *${uptime}*\n`
      menuText += `📅 Date: *${utils.getDate()}*\n`
      menuText += `🔖 Version: *${config.version}*\n`
      menuText += `⚙️ Prefix: *${prefix}*\n\n`

      for (const category of config.categories) {
        menuText += `╔══ ${category.name} ══╗\n`
        for (const cmd of category.commands) {
          menuText += `  ┣ ${prefix}${cmd}\n`
        }
        menuText += `╚${'═'.repeat(20)}╝\n\n`
      }

      menuText += `👑 *Owner:* wa.me/${config.ownerNumber}\n`
      menuText += `💬 *Support:* ${config.support}\n`
      menuText += `\n_Powered by ${config.botName} v${config.version}_`

      await msg.reply(menuText)
    }
  },

  // ===========================
  // INFO
  // ===========================
  {
    command: ['info', 'botinfo'],
    description: 'Show bot information',
    category: 'Basic',
    execute: async (sock, msg) => {
      const mem = utils.getMemoryUsage()
      await msg.reply(
        `╔═══════════════════╗\n` +
        `║   *Bot Information*   ║\n` +
        `╚═══════════════════╝\n\n` +
        `🤖 *Name:* ${config.botName}\n` +
        `🔖 *Version:* ${config.version}\n` +
        `👑 *Owner:* +${config.ownerNumber}\n` +
        `💬 *Support:* ${config.support}\n\n` +
        `⚙️ *Prefix:* ${config.prefix}\n` +
        `🌐 *Language:* English\n` +
        `📚 *Library:* Baileys\n` +
        `💻 *Platform:* ${utils.getPlatform()}\n` +
        `🟢 *Node.js:* ${utils.getNodeVersion()}\n\n` +
        `💾 *RAM Used:* ${mem.heapUsed}\n` +
        `💾 *RAM Total:* ${mem.heapTotal}\n\n` +
        `_Made with ❤️ by NelsonFx_`
      )
    }
  },

  // ===========================
  // RUNTIME
  // ===========================
  {
    command: ['runtime', 'uptime'],
    description: 'Show bot uptime',
    category: 'Basic',
    execute: async (sock, msg) => {
      const uptime = utils.getUptime()
      await msg.reply(
        `⏱️ *Bot Runtime*\n\n` +
        `🟢 *Uptime:* ${uptime}\n` +
        `📅 *Started:* ${new Date(Date.now() - process.uptime() * 1000).toLocaleString()}\n` +
        `🕐 *Current Time:* ${utils.getTime()}`
      )
    }
  },

  // ===========================
  // VERSION
  // ===========================
  {
    command: 'version',
    description: 'Show bot version',
    category: 'Basic',
    execute: async (sock, msg) => {
      await msg.reply(
        `🔖 *${config.botName} Version Info*\n\n` +
        `📦 *Bot Version:* ${config.version}\n` +
        `🟢 *Node.js:* ${utils.getNodeVersion()}\n` +
        `💻 *Platform:* ${utils.getPlatform()}\n` +
        `📚 *Library:* @whiskeysockets/baileys\n` +
        `👑 *Developer:* NelsonFx`
      )
    }
  },

  // ===========================
  // SPEED
  // ===========================
  {
    command: 'speed',
    description: 'Full speed test',
    category: 'Basic',
    execute: async (sock, msg) => {
      const start = Date.now()
      await msg.reply('🔄 Running speed test...')
      const mem = utils.getMemoryUsage()
      const ping = Date.now() - start

      // Test response speed
      const t1 = Date.now()
      await utils.sleep(100)
      const t2 = Date.now()

      await msg.reply(
        `⚡ *Speed Test Results*\n\n` +
        `🏓 *Ping:* ${ping}ms\n` +
        `📶 *Response:* ${t2 - t1}ms\n` +
        `💾 *RAM Used:* ${mem.heapUsed}\n` +
        `💾 *RAM Free:* ${mem.heapTotal}\n` +
        `⏱️ *Uptime:* ${utils.getUptime()}\n` +
        `🟢 *Status:* ${ping < 500 ? 'Excellent ✅' : ping < 1000 ? 'Good 🟡' : 'Slow 🔴'}`
      )
    }
  },

  // ===========================
  // PROFILE
  // ===========================
  {
    command: ['profile', 'me'],
    description: 'View your profile',
    category: 'Basic',
    execute: async (sock, msg) => {
      const user = db.getUser(msg.senderNumber)
      const joined = new Date(user.joinedAt).toLocaleDateString()
      await msg.reply(
        `👤 *Your Profile*\n\n` +
        `📛 *Name:* ${msg.pushName}\n` +
        `📱 *Number:* +${msg.senderNumber}\n` +
        `📅 *First Seen:* ${joined}\n` +
        `🕐 *Last Seen:* ${new Date(user.lastSeen).toLocaleString()}\n` +
        `💬 *Commands Used:* ${user.commandsUsed}\n` +
        `⚠️ *Warnings:* ${user.warned}/3\n` +
        `🏷️ *Role:* ${msg.isOwner ? '👑 Owner' : msg.isSenderAdmin ? '🛡️ Admin' : '👤 User'}`
      )
    }
  },

  // ===========================
  // SUPPORT
  // ===========================
  {
    command: ['support', 'contact'],
    description: 'Get support contact',
    category: 'Basic',
    execute: async (sock, msg) => {
      await msg.reply(
        `💬 *${config.botName} Support*\n\n` +
        `Need help? Contact the owner:\n\n` +
        `👑 *Owner:* wa.me/${config.ownerNumber}\n` +
        `📱 *Number:* +${config.ownerNumber}\n\n` +
        `_We typically respond within 24 hours_`
      )
    }
  },

  // ===========================
  // DONATE
  // ===========================
  {
    command: ['donate', 'buymecoffee'],
    description: 'Support the developer',
    category: 'Basic',
    execute: async (sock, msg) => {
      await msg.reply(
        `❤️ *Support ${config.botName}*\n\n` +
        `If you enjoy using this bot, consider supporting the developer!\n\n` +
        `💰 *Contact Owner for donation details:*\n` +
        `👑 wa.me/${config.ownerNumber}\n\n` +
        `_Every contribution keeps the bot running!_ 🙏`
      )
    }
  }

]

module.exports = basic

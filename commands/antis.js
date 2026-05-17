'use strict'

const config = require('../config')
const utils = require('../lib/utils')
const db = require('../database/db')

// ===========================
// NelsonFxBot Anti & Auto-Mod
// Commands + Event Handlers
// ===========================

const antis = [

  // ===========================
  // ANTILINK
  // ===========================
  {
    command: 'antilink',
    description: 'Toggle antilink in group',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text || !['on', 'off'].includes(text.toLowerCase())) {
        const current = db.getGroupSetting(msg.from, 'antilink')
        return msg.reply(
          `🔗 *Antilink Settings*\n\n` +
          `Current Status: ${current ? '✅ ON' : '❌ OFF'}\n\n` +
          `Usage: .antilink on/off`
        )
      }
      const status = text.toLowerCase() === 'on'
      db.updateGroup(msg.from, 'antilink', status)
      await msg.reply(
        `🔗 *Antilink ${status ? 'Enabled' : 'Disabled'}!*\n\n` +
        `${status
          ? '✅ Links will now be deleted automatically.\n⚠️ 3 warnings = kick!'
          : '❌ Links are now allowed in this group.'
        }`
      )
    }
  },

  // ===========================
  // ANTISPAM
  // ===========================
  {
    command: 'antispam',
    description: 'Toggle antispam in group',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text || !['on', 'off'].includes(text.toLowerCase())) {
        const current = db.getGroupSetting(msg.from, 'antispam')
        return msg.reply(
          `🚫 *Antispam Settings*\n\n` +
          `Current Status: ${current ? '✅ ON' : '❌ OFF'}\n\n` +
          `Usage: .antispam on/off`
        )
      }
      const status = text.toLowerCase() === 'on'
      db.updateGroup(msg.from, 'antispam', status)
      await msg.reply(
        `🚫 *Antispam ${status ? 'Enabled' : 'Disabled'}!*\n\n` +
        `${status
          ? '✅ Spammers will be kicked automatically!\n⚠️ 5 messages in 3 seconds = kick!'
          : '❌ Antispam is now disabled.'
        }`
      )
    }
  },

  // ===========================
  // ANTIBOT
  // ===========================
  {
    command: 'antibot',
    description: 'Toggle antibot in group',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text || !['on', 'off'].includes(text.toLowerCase())) {
        const current = db.getGroupSetting(msg.from, 'antibot')
        return msg.reply(
          `🤖 *Antibot Settings*\n\n` +
          `Current Status: ${current ? '✅ ON' : '❌ OFF'}\n\n` +
          `Usage: .antibot on/off`
        )
      }
      const status = text.toLowerCase() === 'on'
      db.updateGroup(msg.from, 'antibot', status)
      await msg.reply(
        `🤖 *Antibot ${status ? 'Enabled' : 'Disabled'}!*\n\n` +
        `${status
          ? '✅ Other bots will be removed automatically!'
          : '❌ Antibot is now disabled.'
        }`
      )
    }
  },

  // ===========================
  // ANTIFAKE
  // ===========================
  {
    command: 'antifake',
    description: 'Toggle antifake numbers',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text || !['on', 'off'].includes(text.toLowerCase())) {
        const current = db.getGroupSetting(msg.from, 'antifake')
        return msg.reply(
          `👻 *Antifake Settings*\n\n` +
          `Current Status: ${current ? '✅ ON' : '❌ OFF'}\n\n` +
          `Usage: .antifake on/off`
        )
      }
      const status = text.toLowerCase() === 'on'
      db.updateGroup(msg.from, 'antifake', status)
      await msg.reply(
        `👻 *Antifake ${status ? 'Enabled' : 'Disabled'}!*\n\n` +
        `${status
          ? '✅ Fake/temporary numbers will be removed automatically!'
          : '❌ Antifake is now disabled.'
        }`
      )
    }
  },

  // ===========================
  // ANTIWORD
  // ===========================
  {
    command: 'antiword',
    description: 'Toggle banned words filter',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text || !['on', 'off'].includes(text.toLowerCase())) {
        const current = db.getGroupSetting(msg.from, 'antiword')
        const words = db.getGroupSetting(msg.from, 'bannedWords') || []
        return msg.reply(
          `🤬 *Antiword Settings*\n\n` +
          `Current Status: ${current ? '✅ ON' : '❌ OFF'}\n` +
          `Banned Words: ${words.length > 0 ? words.join(', ') : 'None'}\n\n` +
          `Usage: .antiword on/off\n` +
          `Add word: .addword <word>\n` +
          `Remove word: .delword <word>`
        )
      }
      const status = text.toLowerCase() === 'on'
      db.updateGroup(msg.from, 'antiword', status)
      await msg.reply(
        `🤬 *Antiword ${status ? 'Enabled' : 'Disabled'}!*\n\n` +
        `${status
          ? '✅ Banned words will be deleted automatically!\nUse .addword to add banned words.'
          : '❌ Word filter is now disabled.'
        }`
      )
    }
  },

  // ===========================
  // ADD BANNED WORD
  // ===========================
  {
    command: 'addword',
    description: 'Add a banned word',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .addword <word>')
      const word = text.toLowerCase().trim()
      const result = db.addBannedWord(msg.from, word)
      if (result) {
        await msg.reply(`✅ *Word Added!*\n\n🚫 "${word}" is now banned in this group.`)
      } else {
        await msg.reply(`⚠️ "${word}" is already in the banned words list!`)
      }
    }
  },

  // ===========================
  // DELETE BANNED WORD
  // ===========================
  {
    command: 'delword',
    description: 'Remove a banned word',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .delword <word>')
      const word = text.toLowerCase().trim()
      const result = db.removeBannedWord(msg.from, word)
      if (result) {
        await msg.reply(`✅ *Word Removed!*\n\n"${word}" has been removed from banned words.`)
      } else {
        await msg.reply(`⚠️ "${word}" is not in the banned words list!`)
      }
    }
  },

  // ===========================
  // SET WELCOME MESSAGE
  // ===========================
  {
    command: 'setwelcome',
    description: 'Set custom welcome message',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text) {
        return msg.reply(
          `👋 *Welcome Message Setup*\n\n` +
          `Usage: .setwelcome <message>\n\n` +
          `*Variables you can use:*\n` +
          `@user - Mentions new member\n` +
          `@group - Group name\n` +
          `@count - Member count\n\n` +
          `*Example:*\n` +
          `.setwelcome Welcome @user to @group! You are member #@count 🎉`
        )
      }
      db.updateGroup(msg.from, 'welcome', true)
      db.updateGroup(msg.from, 'welcomeMsg', text)
      await msg.reply(
        `✅ *Welcome Message Set!*\n\n` +
        `Preview:\n${text
          .replace('@user', `@${msg.senderNumber}`)
          .replace('@group', msg.groupName)
          .replace('@count', msg.groupMembers.length)
        }`
      )
    }
  },

  // ===========================
  // SET GOODBYE MESSAGE
  // ===========================
  {
    command: 'setgoodbye',
    description: 'Set custom goodbye message',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text) {
        return msg.reply(
          `👋 *Goodbye Message Setup*\n\n` +
          `Usage: .setgoodbye <message>\n\n` +
          `*Variables you can use:*\n` +
          `@user - Mentions leaving member\n` +
          `@group - Group name\n\n` +
          `*Example:*\n` +
          `.setgoodbye Goodbye @user from @group! We'll miss you 👋`
        )
      }
      db.updateGroup(msg.from, 'goodbye', true)
      db.updateGroup(msg.from, 'goodbyeMsg', text)
      await msg.reply(
        `✅ *Goodbye Message Set!*\n\n` +
        `Preview:\n${text
          .replace('@user', `@${msg.senderNumber}`)
          .replace('@group', msg.groupName)
        }`
      )
    }
  },

  // ===========================
  // TOGGLE WELCOME ON/OFF
  // ===========================
  {
    command: 'welcome',
    description: 'Toggle welcome messages',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text || !['on', 'off'].includes(text.toLowerCase())) {
        const current = db.getGroupSetting(msg.from, 'welcome')
        return msg.reply(
          `👋 *Welcome Message*\n\n` +
          `Status: ${current ? '✅ ON' : '❌ OFF'}\n\n` +
          `Usage: .welcome on/off\n` +
          `Customize: .setwelcome <message>`
        )
      }
      const status = text.toLowerCase() === 'on'
      db.updateGroup(msg.from, 'welcome', status)
      await msg.reply(`👋 *Welcome messages ${status ? 'enabled' : 'disabled'}!*`)
    }
  },

  // ===========================
  // TOGGLE GOODBYE ON/OFF
  // ===========================
  {
    command: 'goodbye',
    description: 'Toggle goodbye messages',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text || !['on', 'off'].includes(text.toLowerCase())) {
        const current = db.getGroupSetting(msg.from, 'goodbye')
        return msg.reply(
          `👋 *Goodbye Message*\n\n` +
          `Status: ${current ? '✅ ON' : '❌ OFF'}\n\n` +
          `Usage: .goodbye on/off\n` +
          `Customize: .setgoodbye <message>`
        )
      }
      const status = text.toLowerCase() === 'on'
      db.updateGroup(msg.from, 'goodbye', status)
      await msg.reply(`👋 *Goodbye messages ${status ? 'enabled' : 'disabled'}!*`)
    }
  },

  // ===========================
  // GROUP SETTINGS OVERVIEW
  // ===========================
  {
    command: 'gsettings',
    description: 'View all group settings',
    category: 'Anti',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg) => {
      const s = db.getGroup(msg.from)
      const words = s.bannedWords || []
      await msg.reply(
        `⚙️ *Group Settings*\n` +
        `📌 ${msg.groupName}\n\n` +
        `🔗 Antilink: ${s.antilink ? '✅ ON' : '❌ OFF'}\n` +
        `🚫 Antispam: ${s.antispam ? '✅ ON' : '❌ OFF'}\n` +
        `🤖 Antibot: ${s.antibot ? '✅ ON' : '❌ OFF'}\n` +
        `👻 Antifake: ${s.antifake ? '✅ ON' : '❌ OFF'}\n` +
        `🤬 Antiword: ${s.antiword ? '✅ ON' : '❌ OFF'}\n` +
        `👋 Welcome: ${s.welcome ? '✅ ON' : '❌ OFF'}\n` +
        `👋 Goodbye: ${s.goodbye ? '✅ ON' : '❌ OFF'}\n` +
        `✅ Autoaccept: ${s.autoaccept ? '✅ ON' : '❌ OFF'}\n` +
        `🤖 Chatbot: ${s.chatbot ? '✅ ON' : '❌ OFF'}\n\n` +
        `🚫 Banned Words (${words.length}):\n` +
        `${words.length > 0 ? words.join(', ') : 'None'}`
      )
    }
  }

]

// ===========================
// Participant Update Handler
// Handles welcome & goodbye
// ===========================
antis.handleParticipantUpdate = async (sock, update) => {
  const { id, participants, action } = update

  try {
    const groupSettings = db.getGroup(id)
    let meta
    try {
      meta = await sock.groupMetadata(id)
    } catch {
      return
    }

    for (const participant of participants) {
      const number = utils.formatNumber(participant)
      const jid = participant

      // ===========================
      // Welcome Message
      // ===========================
      if (action === 'add' && groupSettings.welcome) {
        let welcomeMsg = groupSettings.welcomeMsg ||
          `Welcome @user to @group! 🎉\nYou are member #@count`

        welcomeMsg = welcomeMsg
          .replace('@user', `@${number}`)
          .replace('@group', meta.subject)
          .replace('@count', meta.participants.length)

        await sock.sendMessage(id, {
          text: welcomeMsg,
          mentions: [jid]
        })
      }

      // ===========================
      // Goodbye Message
      // ===========================
      if (action === 'remove' && groupSettings.goodbye) {
        let goodbyeMsg = groupSettings.goodbyeMsg ||
          `Goodbye @user from @group! 👋`

        goodbyeMsg = goodbyeMsg
          .replace('@user', `@${number}`)
          .replace('@group', meta.subject)

        await sock.sendMessage(id, {
          text: goodbyeMsg,
          mentions: [jid]
        })
      }

      // ===========================
      // Antifake Check on Join
      // ===========================
      if (action === 'add' && groupSettings.antifake) {
        const isFake =
          number.startsWith('1800') ||
          number.startsWith('1888') ||
          number.startsWith('0000') ||
          number.length < 7

        if (isFake) {
          try {
            await sock.groupParticipantsUpdate(id, [jid], 'remove')
            await sock.sendMessage(id, {
              text: `🚫 Fake number detected and removed: +${number}`
            })
          } catch {
            // silently fail
          }
        }
      }

      // ===========================
      // Auto Accept Join Requests
      // ===========================
      if (action === 'pending' && groupSettings.autoaccept) {
        try {
          await sock.groupRequestParticipantsUpdate(id, [jid], 'approve')
        } catch {
          // silently fail
        }
      }
    }
  } catch (err) {
    // silently fail
  }
}

module.exports = antis

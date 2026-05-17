'use strict'

const config = require('../config')
const utils = require('../lib/utils')
const db = require('../database/db')

// ===========================
// NelsonFxBot Group Commands
// ===========================

const group = [

  // ===========================
  // KICK
  // ===========================
  {
    command: 'kick',
    description: 'Remove a member from group',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg, { text }) => {
      let target = ''

      if (msg.quoted) {
        target = msg.quoted.sender
      } else if (msg.args[0]) {
        target = utils.toJid(msg.args[0].replace(/[^0-9]/g, ''))
      } else {
        return msg.reply('❌ Usage: .kick @user or reply to a message')
      }

      const targetNumber = utils.formatNumber(target)

      if (targetNumber === config.ownerNumber) {
        return msg.reply('❌ Cannot kick the bot owner!')
      }

      if (msg.groupAdmins.includes(target) && !msg.isOwner) {
        return msg.reply('❌ Cannot kick an admin!')
      }

      try {
        await sock.groupParticipantsUpdate(msg.from, [target], 'remove')
        await msg.reply(
          `✅ *Member Kicked!*\n\n` +
          `👤 Number: +${targetNumber}\n` +
          `👮 Kicked by: ${msg.pushName}\n` +
          `📅 Date: ${utils.getDate()}`
        )
      } catch (err) {
        await msg.reply(`❌ Failed to kick: ${err.message}`)
      }
    }
  },

  // ===========================
  // ADD
  // ===========================
  {
    command: 'add',
    description: 'Add a member to group',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .add <number>')
      const number = text.replace(/[^0-9]/g, '')
      if (!utils.isValidNumber(number)) {
        return msg.reply('❌ Invalid phone number!')
      }
      const jid = utils.toJid(number)
      try {
        const result = await sock.groupParticipantsUpdate(msg.from, [jid], 'add')
        const status = result[0]?.status
        if (status === '200') {
          await msg.reply(
            `✅ *Member Added!*\n\n` +
            `👤 Number: +${number}\n` +
            `👮 Added by: ${msg.pushName}\n` +
            `📅 Date: ${utils.getDate()}`
          )
        } else if (status === '403') {
          await msg.reply(`❌ +${number} has restricted who can add them to groups!`)
        } else if (status === '408') {
          await msg.reply(`❌ +${number} is not on WhatsApp!`)
        } else {
          await msg.reply(`❌ Could not add +${number}! Status: ${status}`)
        }
      } catch (err) {
        await msg.reply(`❌ Failed to add: ${err.message}`)
      }
    }
  },

  // ===========================
  // PROMOTE
  // ===========================
  {
    command: 'promote',
    description: 'Promote member to admin',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg, { text }) => {
      let target = ''

      if (msg.quoted) {
        target = msg.quoted.sender
      } else if (msg.args[0]) {
        target = utils.toJid(msg.args[0].replace(/[^0-9]/g, ''))
      } else {
        return msg.reply('❌ Usage: .promote @user or reply to a message')
      }

      try {
        await sock.groupParticipantsUpdate(msg.from, [target], 'promote')
        await msg.reply(
          `⬆️ *Member Promoted!*\n\n` +
          `👤 Number: +${utils.formatNumber(target)}\n` +
          `👮 Promoted by: ${msg.pushName}\n` +
          `🛡️ New Role: Admin\n` +
          `📅 Date: ${utils.getDate()}`
        )
      } catch (err) {
        await msg.reply(`❌ Failed to promote: ${err.message}`)
      }
    }
  },

  // ===========================
  // DEMOTE
  // ===========================
  {
    command: 'demote',
    description: 'Demote admin to member',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg, { text }) => {
      let target = ''

      if (msg.quoted) {
        target = msg.quoted.sender
      } else if (msg.args[0]) {
        target = utils.toJid(msg.args[0].replace(/[^0-9]/g, ''))
      } else {
        return msg.reply('❌ Usage: .demote @user or reply to a message')
      }

      try {
        await sock.groupParticipantsUpdate(msg.from, [target], 'demote')
        await msg.reply(
          `⬇️ *Admin Demoted!*\n\n` +
          `👤 Number: +${utils.formatNumber(target)}\n` +
          `👮 Demoted by: ${msg.pushName}\n` +
          `👤 New Role: Member\n` +
          `📅 Date: ${utils.getDate()}`
        )
      } catch (err) {
        await msg.reply(`❌ Failed to demote: ${err.message}`)
      }
    }
  },

  // ===========================
  // TAG ALL
  // ===========================
  {
    command: 'tagall',
    description: 'Mention all group members',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      const members = msg.groupMembers
      let mentions = []
      let mentionText = text
        ? `📢 *${text}*\n\n`
        : `📢 *Attention Everyone!*\n\n`

      for (const member of members) {
        mentions.push(member.id)
        mentionText += `@${utils.formatNumber(member.id)}\n`
      }

      await sock.sendMessage(msg.from, {
        text: mentionText,
        mentions
      }, { quoted: msg.raw })
    }
  },

  // ===========================
  // HIDE TAG
  // ===========================
  {
    command: 'hidetag',
    description: 'Tag all members silently',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      const members = msg.groupMembers
      const mentions = members.map(m => m.id)

      await sock.sendMessage(msg.from, {
        text: text || '​',
        mentions
      }, { quoted: msg.raw })
    }
  },

  // ===========================
  // GROUP LINK
  // ===========================
  {
    command: 'link',
    description: 'Get group invite link',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg) => {
      try {
        const code = await sock.groupInviteCode(msg.from)
        await msg.reply(
          `🔗 *Group Invite Link*\n\n` +
          `https://chat.whatsapp.com/${code}\n\n` +
          `⚠️ Anyone with this link can join the group!`
        )
      } catch (err) {
        await msg.reply(`❌ Failed to get link: ${err.message}`)
      }
    }
  },

  // ===========================
  // REVOKE LINK
  // ===========================
  {
    command: 'revoke',
    description: 'Reset group invite link',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg) => {
      try {
        await sock.groupRevokeInvite(msg.from)
        await msg.reply('✅ Group invite link has been reset!')
      } catch (err) {
        await msg.reply(`❌ Failed to revoke link: ${err.message}`)
      }
    }
  },

  // ===========================
  // OPEN GROUP
  // ===========================
  {
    command: 'open',
    description: 'Allow all members to send messages',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg) => {
      try {
        await sock.groupSettingUpdate(msg.from, 'not_announcement')
        await msg.reply('🔓 *Group is now open!*\nAll members can send messages.')
      } catch (err) {
        await msg.reply(`❌ Failed to open group: ${err.message}`)
      }
    }
  },

  // ===========================
  // CLOSE GROUP
  // ===========================
  {
    command: 'close',
    description: 'Only admins can send messages',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg) => {
      try {
        await sock.groupSettingUpdate(msg.from, 'announcement')
        await msg.reply('🔒 *Group is now closed!*\nOnly admins can send messages.')
      } catch (err) {
        await msg.reply(`❌ Failed to close group: ${err.message}`)
      }
    }
  },

  // ===========================
  // MUTE MEMBER
  // ===========================
  {
    command: 'mute',
    description: 'Mute a group member',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg) => {
      let target = ''

      if (msg.quoted) {
        target = msg.quoted.sender
      } else if (msg.args[0]) {
        target = utils.toJid(msg.args[0].replace(/[^0-9]/g, ''))
      } else {
        return msg.reply('❌ Usage: .mute @user or reply to a message')
      }

      const groupData = db.getGroup(msg.from)
      const muted = groupData.muted || []

      if (muted.includes(target)) {
        return msg.reply(`⚠️ @${utils.formatNumber(target)} is already muted!`)
      }

      muted.push(target)
      db.updateGroup(msg.from, 'muted', muted)

      await msg.reply(
        `🔇 *Member Muted!*\n\n` +
        `👤 @${utils.formatNumber(target)}\n` +
        `Their messages will be deleted automatically.`
      )
    }
  },

  // ===========================
  // UNMUTE MEMBER
  // ===========================
  {
    command: 'unmute',
    description: 'Unmute a group member',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg) => {
      let target = ''

      if (msg.quoted) {
        target = msg.quoted.sender
      } else if (msg.args[0]) {
        target = utils.toJid(msg.args[0].replace(/[^0-9]/g, ''))
      } else {
        return msg.reply('❌ Usage: .unmute @user or reply to a message')
      }

      const groupData = db.getGroup(msg.from)
      const muted = groupData.muted || []
      const index = muted.indexOf(target)

      if (index === -1) {
        return msg.reply(`⚠️ @${utils.formatNumber(target)} is not muted!`)
      }

      muted.splice(index, 1)
      db.updateGroup(msg.from, 'muted', muted)

      await msg.reply(
        `🔊 *Member Unmuted!*\n\n` +
        `👤 @${utils.formatNumber(target)}\n` +
        `They can now send messages again.`
      )
    }
  },

  // ===========================
  // GROUP INFO
  // ===========================
  {
    command: 'groupinfo',
    description: 'Show group information',
    category: 'Group',
    groupOnly: true,
    execute: async (sock, msg) => {
      const meta = msg.groupMetadata
      const admins = msg.groupAdmins
      const created = new Date(meta.creation * 1000).toLocaleDateString()

      await msg.reply(
        `📋 *Group Information*\n\n` +
        `📌 *Name:* ${meta.subject}\n` +
        `🆔 *ID:* ${msg.from}\n` +
        `📝 *Description:* ${meta.desc || 'No description'}\n` +
        `👥 *Members:* ${msg.groupMembers.length}\n` +
        `🛡️ *Admins:* ${admins.length}\n` +
        `📅 *Created:* ${created}\n` +
        `👑 *Created by:* +${utils.formatNumber(meta.owner || '')}\n\n` +
        `_Use .link to get the invite link_`
      )
    }
  },

  // ===========================
  // SET GROUP DESC
  // ===========================
  {
    command: 'setdesc',
    description: 'Change group description',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .setdesc <description>')
      try {
        await sock.groupUpdateDescription(msg.from, text)
        await msg.reply(`✅ Group description updated!`)
      } catch (err) {
        await msg.reply(`❌ Failed to update description: ${err.message}`)
      }
    }
  },

  // ===========================
  // SET GROUP NAME
  // ===========================
  {
    command: 'setgname',
    description: 'Change group name',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .setgname <name>')
      try {
        await sock.groupUpdateSubject(msg.from, text)
        await msg.reply(`✅ Group name changed to: *${text}*`)
      } catch (err) {
        await msg.reply(`❌ Failed to change name: ${err.message}`)
      }
    }
  },

  // ===========================
  // SET GROUP PROFILE PIC
  // ===========================
  {
    command: 'setppgc',
    description: 'Change group profile picture',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    botAdmin: true,
    execute: async (sock, msg) => {
      if (!msg.quoted?.type?.includes('image') && !msg.isImage) {
        return msg.reply('❌ Please send or reply to an image!')
      }
      try {
        const buffer = msg.isImage
          ? await msg.download()
          : await msg.quoted.download()
        await sock.updateProfilePicture(msg.from, buffer)
        await msg.reply('✅ Group profile picture updated!')
      } catch (err) {
        await msg.reply(`❌ Failed to update picture: ${err.message}`)
      }
    }
  },

  // ===========================
  // AUTO ACCEPT
  // ===========================
  {
    command: 'autoaccept',
    description: 'Auto approve join requests',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg, { text }) => {
      if (!text || !['on', 'off'].includes(text.toLowerCase())) {
        return msg.reply('❌ Usage: .autoaccept on/off')
      }
      const status = text.toLowerCase() === 'on'
      db.updateGroup(msg.from, 'autoaccept', status)
      await msg.reply(
        `✅ *Auto Accept ${status ? 'Enabled' : 'Disabled'}!*\n\n` +
        `Join requests will ${status ? 'now be' : 'no longer be'} auto approved.`
      )
    }
  },

  // ===========================
  // WARN
  // ===========================
  {
    command: 'warn',
    description: 'Warn a group member',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg) => {
      let target = ''

      if (msg.quoted) {
        target = msg.quoted.sender
      } else if (msg.args[0]) {
        target = utils.toJid(msg.args[0].replace(/[^0-9]/g, ''))
      } else {
        return msg.reply('❌ Usage: .warn @user or reply to a message')
      }

      const targetNumber = utils.formatNumber(target)
      const warns = db.warnUser(targetNumber)

      if (warns >= 3) {
        try {
          await sock.groupParticipantsUpdate(msg.from, [target], 'remove')
          await msg.reply(
            `🚫 *Member Kicked!*\n\n` +
            `👤 @${targetNumber} has reached 3 warnings and has been kicked!`
          )
          db.resetWarnings(targetNumber)
        } catch {
          await msg.reply(`⚠️ @${targetNumber} has reached 3 warnings but could not be kicked!`)
        }
      } else {
        await msg.reply(
          `⚠️ *Warning Issued!*\n\n` +
          `👤 @${targetNumber}\n` +
          `⚠️ Warnings: ${warns}/3\n\n` +
          `_${3 - warns} more warning(s) will result in a kick!_`
        )
      }
    }
  },

  // ===========================
  // RESET WARNINGS
  // ===========================
  {
    command: 'resetwarn',
    description: 'Reset warnings for a member',
    category: 'Group',
    groupOnly: true,
    adminOnly: true,
    execute: async (sock, msg) => {
      let target = ''

      if (msg.quoted) {
        target = msg.quoted.sender
      } else if (msg.args[0]) {
        target = utils.toJid(msg.args[0].replace(/[^0-9]/g, ''))
      } else {
        return msg.reply('❌ Usage: .resetwarn @user or reply to a message')
      }

      const targetNumber = utils.formatNumber(target)
      db.resetWarnings(targetNumber)
      await msg.reply(
        `✅ *Warnings Reset!*\n\n` +
        `👤 @${targetNumber} warnings have been cleared.`
      )
    }
  }

]

module.exports = group

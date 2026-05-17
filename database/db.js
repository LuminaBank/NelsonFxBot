'use strict'

const fs = require('fs-extra')
const path = require('path')
const logger = require('../lib/logger')

// ===========================
// NelsonFxBot Database
// Simple JSON-based database
// No external service needed
// ===========================

const DB_DIR = path.join(__dirname)
const DB_PATH = path.join(DB_DIR, 'nelsondb.json')

// ===========================
// Default Database Structure
// ===========================
const defaultDB = {
  // Bot settings
  settings: {
    prefix: '.',
    botMode: 'public',
    autoRead: true,
    autoTyping: true,
    autoRecording: true,
    autoReact: true
  },

  // Banned users (can't use bot)
  bannedUsers: [],

  // Bot stats
  stats: {
    totalCommands: 0,
    totalMessages: 0,
    startTime: Date.now()
  },

  // Groups settings
  groups: {},

  // Users data
  users: {}
}

// ===========================
// Load Database
// ===========================
const loadDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeJsonSync(DB_PATH, defaultDB, { spaces: 2 })
      logger.info('Database created successfully')
    }
    return fs.readJsonSync(DB_PATH)
  } catch (err) {
    logger.error('Failed to load database: ' + err.message)
    return defaultDB
  }
}

// ===========================
// Save Database
// ===========================
const saveDB = (data) => {
  try {
    fs.writeJsonSync(DB_PATH, data, { spaces: 2 })
    return true
  } catch (err) {
    logger.error('Failed to save database: ' + err.message)
    return false
  }
}

// ===========================
// Database Methods
// ===========================
const db = {

  // ===========================
  // Settings
  // ===========================
  getSettings: () => {
    const data = loadDB()
    return data.settings
  },

  updateSettings: (key, value) => {
    const data = loadDB()
    data.settings[key] = value
    saveDB(data)
  },

  // ===========================
  // Banned Users
  // ===========================
  getBannedUsers: () => {
    const data = loadDB()
    return data.bannedUsers || []
  },

  isBanned: (number) => {
    const data = loadDB()
    return data.bannedUsers.includes(number)
  },

  banUser: (number) => {
    const data = loadDB()
    if (!data.bannedUsers.includes(number)) {
      data.bannedUsers.push(number)
      saveDB(data)
      return true
    }
    return false
  },

  unbanUser: (number) => {
    const data = loadDB()
    const index = data.bannedUsers.indexOf(number)
    if (index > -1) {
      data.bannedUsers.splice(index, 1)
      saveDB(data)
      return true
    }
    return false
  },

  // ===========================
  // Stats
  // ===========================
  getStats: () => {
    const data = loadDB()
    return data.stats
  },

  incrementCommands: () => {
    const data = loadDB()
    data.stats.totalCommands = (data.stats.totalCommands || 0) + 1
    saveDB(data)
  },

  incrementMessages: () => {
    const data = loadDB()
    data.stats.totalMessages = (data.stats.totalMessages || 0) + 1
    saveDB(data)
  },

  // ===========================
  // Group Settings
  // ===========================
  getGroup: (groupId) => {
    const data = loadDB()
    if (!data.groups[groupId]) {
      data.groups[groupId] = {
        antilink: false,
        antispam: false,
        antibot: false,
        antifake: false,
        antiword: false,
        welcome: false,
        goodbye: false,
        welcomeMsg: 'Welcome @user to @group! 🎉',
        goodbyeMsg: 'Goodbye @user from @group! 👋',
        bannedWords: [],
        autoaccept: false,
        chatbot: false,
        muted: []
      }
      saveDB(data)
    }
    return data.groups[groupId]
  },

  updateGroup: (groupId, key, value) => {
    const data = loadDB()
    if (!data.groups[groupId]) {
      db.getGroup(groupId)
    }
    data.groups[groupId][key] = value
    saveDB(data)
  },

  getGroupSetting: (groupId, key) => {
    const group = db.getGroup(groupId)
    return group[key]
  },

  // Add banned word to group
  addBannedWord: (groupId, word) => {
    const data = loadDB()
    const group = db.getGroup(groupId)
    if (!group.bannedWords.includes(word.toLowerCase())) {
      data.groups[groupId].bannedWords.push(word.toLowerCase())
      saveDB(data)
      return true
    }
    return false
  },

  // Remove banned word from group
  removeBannedWord: (groupId, word) => {
    const data = loadDB()
    const group = db.getGroup(groupId)
    const index = group.bannedWords.indexOf(word.toLowerCase())
    if (index > -1) {
      data.groups[groupId].bannedWords.splice(index, 1)
      saveDB(data)
      return true
    }
    return false
  },

  // ===========================
  // User Data
  // ===========================
  getUser: (number) => {
    const data = loadDB()
    if (!data.users[number]) {
      data.users[number] = {
        number,
        name: '',
        joinedAt: Date.now(),
        commandsUsed: 0,
        lastSeen: Date.now(),
        warned: 0
      }
      saveDB(data)
    }
    return data.users[number]
  },

  updateUser: (number, key, value) => {
    const data = loadDB()
    if (!data.users[number]) db.getUser(number)
    data.users[number][key] = value
    saveDB(data)
  },

  incrementUserCommands: (number) => {
    const data = loadDB()
    if (!data.users[number]) db.getUser(number)
    data.users[number].commandsUsed = (data.users[number].commandsUsed || 0) + 1
    data.users[number].lastSeen = Date.now()
    saveDB(data)
  },

  warnUser: (number) => {
    const data = loadDB()
    if (!data.users[number]) db.getUser(number)
    data.users[number].warned = (data.users[number].warned || 0) + 1
    saveDB(data)
    return data.users[number].warned
  },

  resetWarnings: (number) => {
    const data = loadDB()
    if (!data.users[number]) db.getUser(number)
    data.users[number].warned = 0
    saveDB(data)
  },

  // ===========================
  // Full DB Access
  // ===========================
  getAll: () => loadDB(),
  save: saveDB

}

module.exports = db

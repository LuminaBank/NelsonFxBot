'use strict'

const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const mime = require('mime-types')
const config = require('../config')

// ===========================
// NelsonFxBot Utilities
// ===========================

const utils = {

  // ===========================
  // Time & Date
  // ===========================

  getTime: () => {
    const now = new Date()
    return now.toLocaleTimeString('en-US', { hour12: true })
  },

  getDate: () => {
    const now = new Date()
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  getUptime: () => {
    const uptime = process.uptime()
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    return `${hours}h ${minutes}m ${seconds}s`
  },

  // ===========================
  // Number & Text Helpers
  // ===========================

  // Format WhatsApp JID to phone number
  formatNumber: (jid) => {
    return jid.replace(/[^0-9]/g, '')
  },

  // Format phone number to JID
  toJid: (number) => {
    return number.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  },

  // Format group JID
  toGroupJid: (id) => {
    return id.includes('@g.us') ? id : id + '@g.us'
  },

  // Get sender name nicely
  getSenderName: (pushName, jid) => {
    return pushName || utils.formatNumber(jid)
  },

  // Sleep / delay
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Random item from array
  random: (arr) => arr[Math.floor(Math.random() * arr.length)],

  // Random number between min and max
  randomNumber: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

  // Capitalize first letter
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),

  // Truncate long text
  truncate: (str, length = 100) => {
    return str.length > length ? str.substring(0, length) + '...' : str
  },

  // Check if string is a URL
  isUrl: (str) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  },

  // Check if number is valid WhatsApp number
  isValidNumber: (number) => {
    const num = number.replace(/[^0-9]/g, '')
    return num.length >= 10 && num.length <= 15
  },

  // ===========================
  // File Helpers
  // ===========================

  // Download file from URL and save it
  downloadFile: async (url, filename) => {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    })
    const writer = fs.createWriteStream(filename)
    response.data.pipe(writer)
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  },

  // Download file as buffer
  getBuffer: async (url, options = {}) => {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      ...options
    })
    return Buffer.from(response.data)
  },

  // Get file extension from URL or mime type
  getExtension: (filename) => {
    return path.extname(filename).slice(1)
  },

  getMimeType: (filename) => {
    return mime.lookup(filename) || 'application/octet-stream'
  },

  // Check if file exists
  fileExists: (filePath) => {
    return fs.existsSync(filePath)
  },

  // Ensure directory exists
  ensureDir: (dirPath) => {
    fs.ensureDirSync(dirPath)
  },

  // Delete file safely
  deleteFile: async (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        await fs.unlink(filePath)
      }
    } catch (err) {
      // silently fail
    }
  },

  // Get file size in MB
  getFileSize: (filePath) => {
    const stats = fs.statSync(filePath)
    return (stats.size / (1024 * 1024)).toFixed(2)
  },

  // ===========================
  // Memory & System
  // ===========================

  getMemoryUsage: () => {
    const mem = process.memoryUsage()
    return {
      rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      external: (mem.external / 1024 / 1024).toFixed(2) + ' MB'
    }
  },

  getCpuUsage: () => {
    const cpus = require('os').cpus()
    return cpus[0].model
  },

  getPlatform: () => {
    return process.platform
  },

  getNodeVersion: () => {
    return process.version
  },

  // ===========================
  // Message Helpers
  // ===========================

  // Build a mention string
  mention: (jid) => {
    return `@${jid.split('@')[0]}`
  },

  // Check if message is from owner
  isOwner: (jid) => {
    const number = utils.formatNumber(jid)
    return number === config.ownerNumber
  },

  // Check if message is from group
  isGroup: (jid) => {
    return jid.endsWith('@g.us')
  },

  // Check if message is from bot itself
  isBot: (jid, botNumber) => {
    return utils.formatNumber(jid) === utils.formatNumber(botNumber)
  },

  // Format bytes to readable size
  formatBytes: (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // ===========================
  // API Helpers
  // ===========================

  // Make GET request
  fetchJson: async (url, options = {}) => {
    const response = await axios.get(url, options)
    return response.data
  },

  // Make POST request
  postJson: async (url, data, options = {}) => {
    const response = await axios.post(url, data, options)
    return response.data
  },

  // ===========================
  // String Cleaners
  // ===========================

  // Remove special characters
  cleanText: (text) => {
    return text.replace(/[^\w\s]/gi, '').trim()
  },

  // Remove extra spaces
  removeSpaces: (text) => {
    return text.replace(/\s+/g, ' ').trim()
  },

  // Convert seconds to time string
  secondsToTime: (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s`
  }

}

module.exports = utils

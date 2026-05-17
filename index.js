'use strict'

const { connectToWhatsApp } = require('./lib/connection')
const logger = require('./lib/logger')
const config = require('./config')
const utils = require('./lib/utils')
const db = require('./database/db')
const fs = require('fs-extra')
const path = require('path')

// ===========================
// NelsonFxBot - Main Entry
// ===========================

const start = async () => {
  try {

    // ===========================
    // Print Startup Banner
    // ===========================
    console.clear()
    logger.banner(config.botName, config.version, config.ownerNumber)

    // ===========================
    // Create Required Directories
    // ===========================
    const dirs = [
      './session',
      './database',
      './assets',
      './tmp',
      './logs'
    ]
    for (const dir of dirs) {
      utils.ensureDir(dir)
    }
    logger.info('All directories verified ✅')

    // ===========================
    // Initialize Database
    // ===========================
    const settings = db.getSettings()
    logger.info(`Database initialized ✅`)
    logger.info(`Bot Mode: ${settings.botMode || config.mode}`)
    logger.info(`Prefix: ${settings.prefix || config.prefix}`)

    // ===========================
    // Verify Config
    // ===========================
    if (!config.ownerNumber) {
      logger.error('Owner number is not set in .env file!')
      process.exit(1)
    }

    if (!config.botName) {
      logger.error('Bot name is not set in .env file!')
      process.exit(1)
    }

    logger.info(`Bot Name: ${config.botName}`)
    logger.info(`Owner: +${config.ownerNumber}`)
    logger.info(`Version: ${config.version}`)
    logger.info(`Session Method: ${config.sessionMethod}`)

    // ===========================
    // API Keys Check
    // ===========================
    const apiStatus = {
      'Gemini AI': !!config.geminiApiKey,
      'Weather': !!config.weatherApiKey,
      'News': !!config.newsApiKey,
      'RemoveBG': !!config.removebgApiKey
    }

    logger.info('API Keys Status:')
    for (const [name, status] of Object.entries(apiStatus)) {
      if (status) {
        logger.success(`  ${name}: Connected ✅`)
      } else {
        logger.warn(`  ${name}: Not set ⚠️ (some features disabled)`)
      }
    }

    // ===========================
    // Connect to WhatsApp
    // ===========================
    logger.info('Connecting to WhatsApp...')

    if (config.sessionMethod === 'qr') {
      logger.info('Session method: QR Code')
      logger.info('A QR code will appear below — scan it with WhatsApp!')
      logger.info('WhatsApp > Linked Devices > Link a Device')
    } else {
      logger.info('Session method: Pairing Code')
      logger.info(`Pairing code will be sent for number: +${config.botNumber}`)
    }

    await connectToWhatsApp()

  } catch (err) {
    logger.error('Fatal startup error: ' + err.message)
    logger.error(err.stack)

    // Retry after 10 seconds
    logger.info('Retrying in 10 seconds...')
    setTimeout(() => start(), 10000)
  }
}

// ===========================
// Global Error Handlers
// ===========================
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception: ' + err.message)
  logger.error(err.stack)
})

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection: ' + (err?.message || err))
})

process.on('SIGTERM', () => {
  logger.warn('SIGTERM received — shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.warn('SIGINT received — shutting down gracefully')
  process.exit(0)
})

// ===========================
// Boot the Bot
// ===========================
start()

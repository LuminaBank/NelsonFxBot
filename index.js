'use strict'

const { connectToWhatsApp } = require('./lib/connection')
const logger = require('./lib/logger')
const config = require('./config')
const utils = require('./lib/utils')
const db = require('./database/db')
const fs = require('fs-extra')
const path = require('path')
const readline = require('readline')

// ===========================
// NelsonFxBot — Main Entry
// ===========================

// ===========================
// Readline Interface
// For terminal/log interaction
// ===========================
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim())
    })
  })
}

// ===========================
// Check If Session Exists
// ===========================
const sessionExists = () => {
  const sessionDir = config.sessionDir
  const credsPath = path.join(sessionDir, 'creds.json')
  // Check config.env SESSION_ID
  if (config.sessionId && config.sessionId.startsWith('NELSONFX')) {
    return true
  }
  // Check session folder
  if (fs.existsSync(credsPath)) {
    return true
  }
  return false
}

// ===========================
// First Time Setup Wizard
// ===========================
const setupWizard = async () => {
  console.clear()
  console.log('\n')
  console.log('╔══════════════════════════════════════════╗')
  console.log('║           NelsonFxBot Setup              ║')
  console.log('║       First Time Configuration           ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log('\n')
  console.log('👋 Welcome to NelsonFxBot!')
  console.log('📱 No session found — let\'s connect your WhatsApp\n')
  console.log('Choose connection method:\n')
  console.log('  1️⃣  QR Code — Scan with WhatsApp camera')
  console.log('  2️⃣  Pairing Code — Enter code in WhatsApp\n')

  let choice = ''
  while (!['1', '2'].includes(choice)) {
    choice = await question('Enter 1 or 2: ')
    if (!['1', '2'].includes(choice)) {
      console.log('❌ Invalid choice! Enter 1 or 2\n')
    }
  }

  if (choice === '1') {
    console.log('\n✅ QR Code method selected!')
    console.log('📱 Steps to scan:')
    console.log('   1. Open WhatsApp on your phone')
    console.log('   2. Tap ⋮ Menu → Linked Devices')
    console.log('   3. Tap "Link a Device"')
    console.log('   4. Scan the QR code that appears below\n')
    return { method: 'qr', phone: null }
  }

  if (choice === '2') {
    console.log('\n✅ Pairing Code method selected!')
    console.log('📱 Steps after getting code:')
    console.log('   1. Open WhatsApp on your phone')
    console.log('   2. Tap ⋮ Menu → Linked Devices')
    console.log('   3. Tap "Link a Device"')
    console.log('   4. Tap "Link with phone number"')
    console.log('   5. Enter the code shown below\n')

    let phone = ''
    while (!phone || phone.length < 7) {
      phone = await question('📞 Enter your WhatsApp number (with country code, no +): ')
      phone = phone.replace(/[^0-9]/g, '')
      if (!phone || phone.length < 7) {
        console.log('❌ Invalid number! Example: 2349138567333\n')
      }
    }

    console.log(`\n✅ Number set: +${phone}`)
    console.log('⏳ Starting connection...\n')
    return { method: 'pairing', phone }
  }
}

// ===========================
// Main Start Function
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
    const dirs = ['./session', './database', './assets', './tmp', './logs']
    for (const dir of dirs) {
      utils.ensureDir(dir)
    }
    logger.info('All directories verified ✅')

    // ===========================
    // Initialize Database
    // ===========================
    db.getSettings()
    logger.info('Database initialized ✅')

    // ===========================
    // Verify Config
    // ===========================
    if (!config.ownerNumber) {
      logger.error('OWNER_NUMBER not set in config.env!')
      process.exit(1)
    }

    logger.info(`Bot Name: ${config.botName}`)
    logger.info(`Owner: +${config.ownerNumber}`)
    logger.info(`Version: ${config.version}`)

    // ===========================
    // Check Session
    // ===========================
    let setupConfig = null

    if (!sessionExists()) {
      // No session — run setup wizard
      logger.warn('No session found — Starting setup wizard...')
      await utils.sleep(1000)
      setupConfig = await setupWizard()
    } else {
      logger.success('Session found — Connecting...')
    }

    // ===========================
    // Connect to WhatsApp
    // ===========================
    await connectToWhatsApp(setupConfig)

  } catch (err) {
    logger.error('Fatal error: ' + err.message)
    logger.info('Retrying in 10 seconds...')
    setTimeout(() => start(), 10000)
  }
}

// ===========================
// Global Error Handlers
// ===========================
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception: ' + err.message)
})

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection: ' + (err?.message || err))
})

process.on('SIGTERM', () => {
  logger.warn('SIGTERM — shutting down')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.warn('SIGINT — shutting down')
  process.exit(0)
})

// ===========================
// Boot
// ===========================
start()

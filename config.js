require('dotenv').config()

const config = {
  // ===========================
  // Bot Identity
  // ===========================
  botName: process.env.BOT_NAME || 'NelsonFxBot',
  version: process.env.BOT_VERSION || '1.0.0',
  prefix: process.env.PREFIX || '.',
  ownerNumber: process.env.OWNER_NUMBER || '2349138567333',
  ownerName: 'NelsonFx',
  botNumber: process.env.BOT_NUMBER || '',
  support: 'https://wa.me/2349138567333',

  // ===========================
  // Bot Mode
  // ===========================
  // public = everyone | private = owner only | group = groups only
  mode: process.env.BOT_MODE || 'public',

  // ===========================
  // Session
  // ===========================
  sessionMethod: process.env.SESSION_METHOD || 'qr',
  sessionDir: './session',

  // ===========================
  // Auto Features
  // ===========================
  autoRead: process.env.AUTO_READ === 'true',
  autoTyping: process.env.AUTO_TYPING === 'true',
  autoRecording: process.env.AUTO_RECORDING === 'true',
  autoReact: process.env.AUTO_REACT === 'true',

  // ===========================
  // Auto Restart
  // ===========================
  autoRestart: true,
  autoRestartTime: process.env.AUTO_RESTART_TIME || '03:00',

  // ===========================
  // API Keys
  // ===========================
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  weatherApiKey: process.env.WEATHER_API_KEY || '',
  newsApiKey: process.env.NEWS_API_KEY || '',
  removebgApiKey: process.env.REMOVEBG_API_KEY || '',

  // ===========================
  // Command Categories (for menu)
  // ===========================
  categories: [
    {
      name: '🔰 Basic',
      emoji: '🔰',
      commands: ['menu', 'ping', 'alive', 'info', 'runtime', 'version', 'speed']
    },
    {
      name: '🛡️ Anti / Auto-Mod',
      emoji: '🛡️',
      commands: ['antilink', 'antispam', 'antibot', 'antifake', 'antiword', 'setwelcome', 'setgoodbye']
    },
    {
      name: '👥 Group',
      emoji: '👥',
      commands: ['kick', 'add', 'promote', 'demote', 'tagall', 'hidetag', 'link', 'revoke', 'open', 'close', 'mute', 'unmute', 'groupinfo', 'setdesc', 'setname', 'setppgc', 'autoaccept']
    },
    {
      name: '🎬 Media',
      emoji: '🎬',
      commands: ['sticker', 'toimg', 'tomp3', 'ytmp3', 'ytmp4', 'tiktok', 'instagram', 'facebook', 'twitter', 'enhance', 'removebg', 'ocr', 'compress']
    },
    {
      name: '🤖 AI & Smart',
      emoji: '🤖',
      commands: ['ai', 'imagine', 'roast', 'compliment', 'advice', 'story', 'lyrics', 'chatbot']
    },
    {
      name: '🎮 Fun & Games',
      emoji: '🎮',
      commands: ['meme', 'quote', 'joke', 'fact', 'truth', 'dare', 'ship', 'would', '8ball', 'roll', 'coinflip', 'rps', 'horoscope', 'emojimix']
    },
    {
      name: '🔧 Utility',
      emoji: '🔧',
      commands: ['weather', 'translate', 'dictionary', 'calc', 'time', 'short', 'qr', 'encode', 'decode', 'carbon', 'tts', 'currency', 'news', 'wiki', 'ip', 'color']
    },
    {
      name: '👑 Owner',
      emoji: '👑',
      commands: ['broadcast', 'block', 'unblock', 'ban', 'unban', 'eval', 'restart', 'setbotname', 'setbotstatus', 'setbotbio', 'setbotpp', 'getlog', 'clearlog', 'memory', 'listban', 'addprefix', 'delprefix']
    }
  ],

  // ===========================
  // Reaction Emojis
  // ===========================
  reactions: {
    success: '✅',
    error: '❌',
    wait: '⏳',
    loading: '🔄',
    owner: '👑',
    group: '👥',
    banned: '🚫'
  },

  // ===========================
  // Bot Personality Responses
  // ===========================
  personality: {
    // Friendly
    greetings: ['Hey! 👋', 'Sup! 😎', 'Hello there! 🤗', 'Hii! ✨'],
    // Savage
    errors: [
      'Bruh that ain\'t right 💀',
      'Did you really just do that? 😭',
      'Try harder next time 😂'
    ],
    // Professional
    processing: [
      'Processing your request...',
      'Give me a sec...',
      'On it! ⚡'
    ]
  },

  // ===========================
  // Limits
  // ===========================
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxVideoLength: 300, // 5 minutes in seconds
  cooldown: 3, // seconds between commands per user

  // ===========================
  // Database
  // ===========================
  dbPath: './database/nelsondb',
}

module.exports = config

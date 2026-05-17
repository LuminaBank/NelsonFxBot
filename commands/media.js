'use strict'

const config = require('../config')
const utils = require('../lib/utils')
const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')

// ===========================
// NelsonFxBot Media Commands
// ===========================

const media = [

  // ===========================
  // STICKER
  // ===========================
  {
    command: ['sticker', 'stiker', 's'],
    description: 'Convert image/video to sticker',
    category: 'Media',
    execute: async (sock, msg, { text }) => {
      const isImage = msg.isImage || msg.quoted?.type === 'imageMessage'
      const isVideo = msg.isVideo || msg.quoted?.type === 'videoMessage'

      if (!isImage && !isVideo) {
        return msg.reply(
          `🖼️ *Sticker Maker*\n\n` +
          `Send or reply to an image/video with .sticker\n\n` +
          `Options:\n` +
          `.sticker <pack> | <author>\n` +
          `Example: .sticker NelsonFx | Bot`
        )
      }

      await msg.react('⏳')

      try {
        const buffer = msg.isImage || msg.isVideo
          ? await msg.download()
          : await msg.quoted.download()

        const parts = text?.split('|') || []
        const packname = parts[0]?.trim() || config.botName
        const author = parts[1]?.trim() || 'NelsonFx'

        // Save temp file
        const tmpPath = `./tmp/sticker_${Date.now()}`
        const outPath = `${tmpPath}.webp`

        if (isVideo) {
          const inPath = `${tmpPath}.mp4`
          await fs.writeFile(inPath, buffer)

          await new Promise((resolve, reject) => {
            const ffmpeg = require('fluent-ffmpeg')
            const ffmpegPath = require('ffmpeg-static')
            ffmpeg.setFfmpegPath(ffmpegPath)
            ffmpeg(inPath)
              .inputOptions(['-t 10'])
              .outputOptions([
                '-vcodec libwebp',
                '-vf scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0',
                '-loop 0',
                '-preset default',
                '-an',
                '-vsync 0'
              ])
              .toFormat('webp')
              .save(outPath)
              .on('end', resolve)
              .on('error', reject)
          })

          await utils.deleteFile(inPath)
        } else {
          const sharp = require('sharp')
          await sharp(buffer)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp()
            .toFile(outPath)
        }

        const stickerBuffer = await fs.readFile(outPath)

        await sock.sendMessage(msg.from, {
          sticker: stickerBuffer
        }, { quoted: msg.raw })

        await utils.deleteFile(outPath)
        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Failed to create sticker: ${err.message}`)
      }
    }
  },

  // ===========================
  // STICKER TO IMAGE
  // ===========================
  {
    command: ['toimg', 'toimage'],
    description: 'Convert sticker to image',
    category: 'Media',
    execute: async (sock, msg) => {
      const isSticker = msg.isSticker || msg.quoted?.type === 'stickerMessage'
      if (!isSticker) {
        return msg.reply('❌ Please send or reply to a sticker!')
      }

      await msg.react('⏳')

      try {
        const buffer = msg.isSticker
          ? await msg.download()
          : await msg.quoted.download()

        await sock.sendMessage(msg.from, {
          image: buffer,
          caption: '✅ Here is your sticker as an image!'
        }, { quoted: msg.raw })

        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Failed to convert: ${err.message}`)
      }
    }
  },

  // ===========================
  // TO MP3
  // ===========================
  {
    command: ['tomp3', 'toaudio'],
    description: 'Convert video to audio',
    category: 'Media',
    execute: async (sock, msg) => {
      const isVideo = msg.isVideo || msg.quoted?.type === 'videoMessage'
      if (!isVideo) {
        return msg.reply('❌ Please send or reply to a video!')
      }

      await msg.react('⏳')
      await msg.reply('🔄 Converting video to audio...')

      try {
        const buffer = msg.isVideo
          ? await msg.download()
          : await msg.quoted.download()

        const tmpIn = `./tmp/video_${Date.now()}.mp4`
        const tmpOut = `./tmp/audio_${Date.now()}.mp3`

        await fs.writeFile(tmpIn, buffer)

        await new Promise((resolve, reject) => {
          const ffmpeg = require('fluent-ffmpeg')
          const ffmpegPath = require('ffmpeg-static')
          ffmpeg.setFfmpegPath(ffmpegPath)
          ffmpeg(tmpIn)
            .toFormat('mp3')
            .save(tmpOut)
            .on('end', resolve)
            .on('error', reject)
        })

        const audioBuffer = await fs.readFile(tmpOut)

        await sock.sendMessage(msg.from, {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          pttDefault: false
        }, { quoted: msg.raw })

        await utils.deleteFile(tmpIn)
        await utils.deleteFile(tmpOut)
        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Conversion failed: ${err.message}`)
      }
    }
  },

  // ===========================
  // YOUTUBE MP3
  // ===========================
  {
    command: ['ytmp3', 'ytaudio', 'yta'],
    description: 'Download YouTube audio',
    category: 'Media',
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .ytmp3 <youtube url or search>')

      await msg.react('⏳')
      await msg.reply('🔍 Searching YouTube...')

      try {
        const yts = require('yt-search')
        const ytdl = require('ytdl-core')

        let url = text
        if (!utils.isUrl(text)) {
          const results = await yts(text)
          if (!results.videos.length) {
            return msg.reply('❌ No results found!')
          }
          url = results.videos[0].url
        }

        if (!ytdl.validateURL(url)) {
          return msg.reply('❌ Invalid YouTube URL!')
        }

        const info = await ytdl.getInfo(url)
        const title = info.videoDetails.title
        const duration = info.videoDetails.lengthSeconds

        if (duration > config.maxVideoLength * 2) {
          return msg.reply(`❌ Video too long! Maximum is ${utils.secondsToTime(config.maxVideoLength * 2)}`)
        }

        await msg.reply(`📥 Downloading: *${title}*\n⏱️ Duration: ${utils.secondsToTime(duration)}`)

        const tmpOut = `./tmp/yt_${Date.now()}.mp3`
        const stream = ytdl(url, { quality: 'highestaudio', filter: 'audioonly' })
        const writer = fs.createWriteStream(tmpOut)
        stream.pipe(writer)

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
        })

        const audioBuffer = await fs.readFile(tmpOut)

        await sock.sendMessage(msg.from, {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          pttDefault: false,
          fileName: `${title}.mp3`
        }, { quoted: msg.raw })

        await utils.deleteFile(tmpOut)
        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Download failed: ${err.message}`)
      }
    }
  },

  // ===========================
  // YOUTUBE MP4
  // ===========================
  {
    command: ['ytmp4', 'ytvideo', 'ytv'],
    description: 'Download YouTube video',
    category: 'Media',
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .ytmp4 <youtube url or search>')

      await msg.react('⏳')
      await msg.reply('🔍 Searching YouTube...')

      try {
        const yts = require('yt-search')
        const ytdl = require('ytdl-core')

        let url = text
        if (!utils.isUrl(text)) {
          const results = await yts(text)
          if (!results.videos.length) {
            return msg.reply('❌ No results found!')
          }
          url = results.videos[0].url
        }

        if (!ytdl.validateURL(url)) {
          return msg.reply('❌ Invalid YouTube URL!')
        }

        const info = await ytdl.getInfo(url)
        const title = info.videoDetails.title
        const duration = info.videoDetails.lengthSeconds

        if (duration > config.maxVideoLength) {
          return msg.reply(`❌ Video too long! Maximum is ${utils.secondsToTime(config.maxVideoLength)}`)
        }

        await msg.reply(`📥 Downloading: *${title}*\n⏱️ Duration: ${utils.secondsToTime(duration)}`)

        const tmpOut = `./tmp/yt_${Date.now()}.mp4`
        const stream = ytdl(url, { quality: 'highest', filter: 'videoandaudio' })
        const writer = fs.createWriteStream(tmpOut)
        stream.pipe(writer)

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve)
          writer.on('error', reject)
        })

        const videoBuffer = await fs.readFile(tmpOut)

        await sock.sendMessage(msg.from, {
          video: videoBuffer,
          caption: `🎬 *${title}*\n\n_Downloaded by ${config.botName}_`,
          fileName: `${title}.mp4`
        }, { quoted: msg.raw })

        await utils.deleteFile(tmpOut)
        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Download failed: ${err.message}`)
      }
    }
  },

  // ===========================
  // TIKTOK DOWNLOADER
  // ===========================
  {
    command: ['tiktok', 'tt'],
    description: 'Download TikTok video no watermark',
    category: 'Media',
    execute: async (sock, msg, { text }) => {
      if (!text || !utils.isUrl(text)) {
        return msg.reply('❌ Usage: .tiktok <tiktok url>')
      }

      await msg.react('⏳')
      await msg.reply('🔄 Downloading TikTok video...')

      try {
        const response = await utils.fetchJson(
          `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(text)}`
        )

        if (!response?.video?.noWatermark) {
          return msg.reply('❌ Could not fetch TikTok video!')
        }

        const videoBuffer = await utils.getBuffer(response.video.noWatermark)

        await sock.sendMessage(msg.from, {
          video: videoBuffer,
          caption: `🎵 *${response.title || 'TikTok Video'}*\n\n_Downloaded by ${config.botName}_`
        }, { quoted: msg.raw })

        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Download failed: ${err.message}`)
      }
    }
  },

  // ===========================
  // INSTAGRAM DOWNLOADER
  // ===========================
  {
    command: ['instagram', 'ig', 'insta'],
    description: 'Download Instagram reel/post',
    category: 'Media',
    execute: async (sock, msg, { text }) => {
      if (!text || !utils.isUrl(text)) {
        return msg.reply('❌ Usage: .instagram <instagram url>')
      }

      await msg.react('⏳')
      await msg.reply('🔄 Downloading Instagram content...')

      try {
        const response = await utils.fetchJson(
          `https://api.snapinsta.app/v1/instagram?url=${encodeURIComponent(text)}`
        )

        if (!response?.data) {
          return msg.reply('❌ Could not fetch Instagram content!\nMake sure the post is public.')
        }

        const videoUrl = response.data?.video_url || response.data?.[0]?.url

        if (videoUrl) {
          const buffer = await utils.getBuffer(videoUrl)
          await sock.sendMessage(msg.from, {
            video: buffer,
            caption: `📸 *Instagram Content*\n\n_Downloaded by ${config.botName}_`
          }, { quoted: msg.raw })
        } else {
          return msg.reply('❌ No downloadable content found!')
        }

        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Download failed: ${err.message}`)
      }
    }
  },

  // ===========================
  // FACEBOOK DOWNLOADER
  // ===========================
  {
    command: ['facebook', 'fb'],
    description: 'Download Facebook video',
    category: 'Media',
    execute: async (sock, msg, { text }) => {
      if (!text || !utils.isUrl(text)) {
        return msg.reply('❌ Usage: .facebook <facebook video url>')
      }

      await msg.react('⏳')
      await msg.reply('🔄 Downloading Facebook video...')

      try {
        const response = await utils.fetchJson(
          `https://api.fabdl.com/facebook/get?url=${encodeURIComponent(text)}`
        )

        if (!response?.result?.sd) {
          return msg.reply('❌ Could not fetch Facebook video!\nMake sure the video is public.')
        }

        const videoBuffer = await utils.getBuffer(response.result.sd)

        await sock.sendMessage(msg.from, {
          video: videoBuffer,
          caption: `📘 *${response.result.title || 'Facebook Video'}*\n\n_Downloaded by ${config.botName}_`
        }, { quoted: msg.raw })

        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Download failed: ${err.message}`)
      }
    }
  },

  // ===========================
  // TWITTER/X DOWNLOADER
  // ===========================
  {
    command: ['twitter', 'twit', 'xdl'],
    description: 'Download Twitter/X video',
    category: 'Media',
    execute: async (sock, msg, { text }) => {
      if (!text || !utils.isUrl(text)) {
        return msg.reply('❌ Usage: .twitter <twitter/x url>')
      }

      await msg.react('⏳')
      await msg.reply('🔄 Downloading Twitter/X video...')

      try {
        const response = await utils.fetchJson(
          `https://api.vxtwitter.com/Twitter/status/${text.split('/status/')[1]?.split('?')[0]}`
        )

        if (!response?.media_extended?.[0]?.url) {
          return msg.reply('❌ No video found in this tweet!')
        }

        const videoUrl = response.media_extended[0].url
        const videoBuffer = await utils.getBuffer(videoUrl)

        await sock.sendMessage(msg.from, {
          video: videoBuffer,
          caption: `🐦 *Twitter/X Video*\n\n${response.text || ''}\n\n_Downloaded by ${config.botName}_`
        }, { quoted: msg.raw })

        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Download failed: ${err.message}`)
      }
    }
  },

  // ===========================
  // REMOVE BACKGROUND
  // ===========================
  {
    command: ['removebg', 'rmbg'],
    description: 'Remove image background',
    category: 'Media',
    execute: async (sock, msg) => {
      const isImage = msg.isImage || msg.quoted?.type === 'imageMessage'
      if (!isImage) return msg.reply('❌ Please send or reply to an image!')

      if (!config.removebgApiKey) {
        return msg.reply('❌ RemoveBG API key not set!\nContact owner to enable this feature.')
      }

      await msg.react('⏳')
      await msg.reply('🔄 Removing background...')

      try {
        const buffer = msg.isImage
          ? await msg.download()
          : await msg.quoted.download()

        const FormData = require('form-data')
        const form = new FormData()
        form.append('image_file', buffer, { filename: 'image.jpg' })
        form.append('size', 'auto')

        const response = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
          headers: {
            ...form.getHeaders(),
            'X-Api-Key': config.removebgApiKey
          },
          responseType: 'arraybuffer'
        })

        await sock.sendMessage(msg.from, {
          image: Buffer.from(response.data),
          caption: '✅ Background removed successfully!'
        }, { quoted: msg.raw })

        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Failed to remove background: ${err.message}`)
      }
    }
  },

  // ===========================
  // OCR - TEXT FROM IMAGE
  // ===========================
  {
    command: ['ocr', 'readtext', 'textfromimage'],
    description: 'Extract text from image',
    category: 'Media',
    execute: async (sock, msg) => {
      const isImage = msg.isImage || msg.quoted?.type === 'imageMessage'
      if (!isImage) return msg.reply('❌ Please send or reply to an image!')

      await msg.react('⏳')
      await msg.reply('🔄 Reading text from image...')

      try {
        const buffer = msg.isImage
          ? await msg.download()
          : await msg.quoted.download()

        const base64 = buffer.toString('base64')

        const response = await utils.fetchJson(
          `https://api.ocr.space/parse/image`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            params: {
              apikey: 'helloworld',
              base64Image: `data:image/jpg;base64,${base64}`,
              language: 'eng'
            }
          }
        )

        const text = response?.ParsedResults?.[0]?.ParsedText
        if (!text || text.trim() === '') {
          return msg.reply('❌ No text found in this image!')
        }

        await msg.reply(
          `📝 *Text Extracted from Image*\n\n${text.trim()}`
        )

        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ OCR failed: ${err.message}`)
      }
    }
  },

  // ===========================
  // IMAGE ENHANCE
  // ===========================
  {
    command: ['enhance', 'upscale'],
    description: 'Enhance/upscale an image',
    category: 'Media',
    execute: async (sock, msg) => {
      const isImage = msg.isImage || msg.quoted?.type === 'imageMessage'
      if (!isImage) return msg.reply('❌ Please send or reply to an image!')

      await msg.react('⏳')
      await msg.reply('🔄 Enhancing image...')

      try {
        const buffer = msg.isImage
          ? await msg.download()
          : await msg.quoted.download()

        const sharp = require('sharp')
        const enhanced = await sharp(buffer)
          .resize(2048, 2048, {
            fit: 'inside',
            withoutEnlargement: false
          })
          .sharpen()
          .jpeg({ quality: 95 })
          .toBuffer()

        await sock.sendMessage(msg.from, {
          image: enhanced,
          caption: '✅ Image enhanced successfully!'
        }, { quoted: msg.raw })

        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ Enhancement failed: ${err.message}`)
      }
    }
  },

  // ===========================
  // TEXT TO SPEECH
  // ===========================
  {
    command: ['tts', 'speak'],
    description: 'Convert text to speech audio',
    category: 'Media',
    execute: async (sock, msg, { text }) => {
      if (!text) return msg.reply('❌ Usage: .tts <text>')

      await msg.react('⏳')

      try {
        const encodedText = encodeURIComponent(text)
        const audioBuffer = await utils.getBuffer(
          `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`
        )

        await sock.sendMessage(msg.from, {
          audio: audioBuffer,
          mimetype: 'audio/mpeg',
          pttDefault: true
        }, { quoted: msg.raw })

        await msg.react('✅')
      } catch (err) {
        await msg.react('❌')
        await msg.reply(`❌ TTS failed: ${err.message}`)
      }
    }
  }

]

module.exports = media

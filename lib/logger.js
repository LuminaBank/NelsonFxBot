'use strict'

const chalk = require('chalk')
const moment = require('moment')

// ===========================
// NelsonFxBot Logger
// ===========================

const getTime = () => moment().format('HH:mm:ss')
const getDate = () => moment().format('DD/MM/YYYY')

const logger = {

  // Info log - general information
  info: (message) => {
    console.log(
      chalk.cyan(`[${getDate()} ${getTime()}]`) +
      chalk.blueBright(' [INFO] ') +
      chalk.white(message)
    )
  },

  // Success log
  success: (message) => {
    console.log(
      chalk.cyan(`[${getDate()} ${getTime()}]`) +
      chalk.greenBright(' [SUCCESS] ') +
      chalk.white(message)
    )
  },

  // Warning log
  warn: (message) => {
    console.log(
      chalk.cyan(`[${getDate()} ${getTime()}]`) +
      chalk.yellowBright(' [WARN] ') +
      chalk.white(message)
    )
  },

  // Error log
  error: (message) => {
    console.log(
      chalk.cyan(`[${getDate()} ${getTime()}]`) +
      chalk.redBright(' [ERROR] ') +
      chalk.white(message)
    )
  },

  // Command log - when someone uses a command
  cmd: (sender, command, chat) => {
    console.log(
      chalk.cyan(`[${getDate()} ${getTime()}]`) +
      chalk.magentaBright(' [CMD] ') +
      chalk.yellow(`${sender}`) +
      chalk.white(' used ') +
      chalk.greenBright(`.${command}`) +
      chalk.white(` in ${chat}`)
    )
  },

  // Connection log
  conn: (message) => {
    console.log(
      chalk.cyan(`[${getDate()} ${getTime()}]`) +
      chalk.cyanBright(' [CONN] ') +
      chalk.white(message)
    )
  },

  // Bot startup banner
  banner: (botName, version, ownerNumber) => {
    console.log('\n')
    console.log(chalk.greenBright('╔═══════════════════════════════════╗'))
    console.log(chalk.greenBright('║') + chalk.bold.yellowBright(`       ${botName}         `) + chalk.greenBright('║'))
    console.log(chalk.greenBright('║') + chalk.white(`       Version: ${version}              `) + chalk.greenBright('║'))
    console.log(chalk.greenBright('║') + chalk.white(`       Owner: +${ownerNumber}    `) + chalk.greenBright('║'))
    console.log(chalk.greenBright('║') + chalk.white('       Made with ❤️  by NelsonFx    ') + chalk.greenBright('║'))
    console.log(chalk.greenBright('╚═══════════════════════════════════╝'))
    console.log('\n')
  }

}

module.exports = logger

import Debug from 'debug'
import nodemailer from 'nodemailer'
import swig from 'swig'
import ses from 'nodemailer-ses-transport'

const debug = Debug('crowi:lib:mailer')

export default crowi => {
  'use strict'

  var config = crowi.getConfig()
  var mailConfig: any = {}
  var mailer: any = {}
  var MAIL_TEMPLATE_DIR = crowi.mailDir

  function createSMTPClient(option?) {
    var client

    debug('createSMTPClient option', option)
    if (!option) {
      option = {
        host: config.crowi['mail:smtpHost'],
        port: config.crowi['mail:smtpPort'],
      }

      if (config.crowi['mail:smtpUser'] && config.crowi['mail:smtpPassword']) {
        option.auth = {
          user: config.crowi['mail:smtpUser'],
          pass: config.crowi['mail:smtpPassword'],
        }
      }
      if (option.port === 465) {
        option.secure = true
      }
    }
    option.tls = { rejectUnauthorized: false }

    client = nodemailer.createTransport(option)

    debug('mailer set up for SMTP', client)
    return client
  }

  function createSESClient(option?) {
    var client

    if (!option) {
      option = {
        accessKeyId: config.crowi['aws:accessKeyId'],
        secretAccessKey: config.crowi['aws:secretAccessKey'],
      }
    }

    client = nodemailer.createTransport(ses(option))

    debug('mailer set up for SES', client)
    return client
  }

  function initialize() {
    if (!config.crowi['mail:from']) {
      mailer = undefined
      return
    }

    if (config.crowi['mail:smtpHost'] && config.crowi['mail:smtpPort']) {
      // SMTP 設定がある場合はそれを優先
      mailer = createSMTPClient()
    } else if (config.crowi['aws:accessKeyId'] && config.crowi['aws:secretAccessKey']) {
      // AWS 設定がある場合はSESを設定
      mailer = createSESClient()
    } else {
      mailer = undefined
    }

    mailConfig.from = config.crowi['mail:from']
    mailConfig.subject = config.crowi['app:title'] + 'からのメール'

    debug('mailer initialized')
  }

  function setupMailConfig(overrideConfig) {
    var c = overrideConfig
    var mc: any = {}
    mc = mailConfig

    mc.to = c.to
    mc.from = c.from || mailConfig.from
    mc.text = c.text
    mc.subject = c.subject || mailConfig.subject

    return mc
  }

  function send(config, callback) {
    if (mailer) {
      var templateVars = config.vars || {}
      return swig.renderFile(MAIL_TEMPLATE_DIR + config.template, templateVars, function(err, output) {
        if (err) {
          throw err
        }

        config.text = output
        return mailer.sendMail(setupMailConfig(config), callback)
      })
    } else {
      debug('Mailer is not completed to set up. Please set up SMTP or AWS setting.')
      return callback(new Error('Mailer is not completed to set up. Please set up SMTP or AWS setting.'), null)
    }
  }

  initialize()

  return {
    createSMTPClient: createSMTPClient,
    createSESClient: createSESClient,
    mailer: mailer,
    send: send,
  }
}

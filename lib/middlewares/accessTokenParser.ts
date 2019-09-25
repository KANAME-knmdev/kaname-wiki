import { Express } from 'express'
import Crowi from 'server/crowi'
import Debug from 'debug'
import { parseAccessToken } from '../util/accessTokenParser'

const debug = Debug('crowi:middlewares:accessTokenParser')

export default (crowi: Crowi, app: Express) => {
  return (req, res, next) => {
    const accessToken = parseAccessToken(req)
    if (!accessToken) {
      return next()
    }

    const User = crowi.model('User')

    debug('accessToken is', accessToken)
    User.findUserByApiToken(accessToken)
      .then(function(userData) {
        req.user = userData
        req.skipCsrfVerify = true
        debug('Access token parsed: skipCsrfVerify')

        next()
      })
      .catch(function(err) {
        next()
      })
  }
}

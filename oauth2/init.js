const soas2 = require('simple-oauth2-server')
const MongodbAPI = require('./mongodbAPI')
const { loginByUsername } = require('./../models/User')

const CANCEL_MESSAGE = 'Authentication is fail!'

module.exports = initOAuth2

/**
 * Authentication.
 * @param {Object} req
 * @param {Function} next
 * @param {Function} cancel
 * @returns {Object}
 */
function authentication (req, next, cancel) {
  if (!req.body.username || !req.body.password) {
    cancel(CANCEL_MESSAGE)
  } else {
    loginByUsername(req.app.locals.db, req.body.username, req.body.password)
      .then((user) => {
        if (user) {
          req.user = user
          next()
        } else {
          cancel(CANCEL_MESSAGE)
        }
      })
      .catch((error) => {
        console.log(error)
        cancel(CANCEL_MESSAGE)
      })
  }
}

/**
 * Token Extend.
 * @param {Object} req
 * @return {Object}
 */
function tokenExtend (req) {
  let result = {
    userID: String(req.user._id),
    type: req.user.userType,
  }
  return result
}

/**
 * Init OAuth2.
 * @param {Object} db
 * @param {Object} app
 * @returns {Object}
 */
function initOAuth2 (db, app) {
  app.set('name', 'oauth2 server')
  soas2.init({
    expressApp: app,
    authentication: authentication,
    expiredToken: 365 * 24 * 60 * 60, // token lifetime
    createTokenPath: '/token', // route where server gives tokens
    revocationPath: '/tokenRevocation', // route where server revokes tokens
    tokensDB: new MongodbAPI(db), // API for working with DB
    tokenType: 'Bearer', // Configured for Bearer tokens by default
    // Function for configuring token format if it`s needed (argument is request)
    tokenExtend,
  }).defend({
    routes: ['**'],
    method: ['get', 'post', 'put', 'delete'],
  })
}

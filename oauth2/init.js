const soas2 = require('simple-oauth2-server')
const MongodbAPI = require('./mongodbAPI')
const UserModel = require('./../models/User')
const AdministratorModel = require('./../models/Administrator')

const CANCEL_MESSAGE = 'Authentication is fail!'

const USER_TYPE_ADMINISTRATOR = 0
const USER_TYPE_STUDENT = 1
const USER_TYPE_NANNY = 2
const USER_TYPE_PARENT = 3
const USER_TYPE_DRIVER = 4
const USER_TYPE_TEACHER = 5

const ADMINISTRATOR_TYPE_ROOT = 0
const ADMINISTRATOR_TYPE_SCHOOL = 1

module.exports = initOAuth2

/**
 * Authentication.
 * @param {Object} req
 * @param {Function} next
 * @param {Function} cancel
 * @returns {undefined}
 */
function authentication (req, next, cancel) {
  if (!req.body.username || !req.body.password) {
    cancel(CANCEL_MESSAGE)
  } else {
    UserModel.loginByUsername(req.app.locals.db, req.body.username, req.body.password)
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
 * @returns {Object}
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
 * @returns {undefined}
 */
function initOAuth2 (db, app) {
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

  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Module(/**)?', '/Log(/**)?', '/Administrator(/**)?'],
    methods: ['get', 'post', 'put', 'delete'],
  }).defend({
    routes: ['/School'],
    method: ['post'],
  }).defend({
    routes: ['/School', '/School/:page(\\d+)', '/School/Log', '/School/:schoolID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/School/:schoolID([0-9a-fA-F]{24})'],
    method: ['delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL && v.schoolID === req.params.schoolID) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/School/:schoolID([0-9a-fA-F]{24})'],
    method: ['get'],
  }).defend({
    routes: ['/School/:schoolID([0-9a-fA-F]{24})'],
    method: ['put'],
  })
}

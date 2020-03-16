const soas2 = require('simple-oauth2-server')
const MongodbAPI = require('./mongodbAPI')
const UserModel = require('./../models/User')
const AdministratorModel = require('./../models/Administrator')
const ClassModel = require('./../models/Class')
const TeacherModel = require('./../models/Teacher')
const StudentModel = require('./../models/Student')
const ParentModel = require('./../models/Parent')
const TripModel = require('./../models/Trip')

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

  soas2.defend({
    routes: ['/Info(/**)?', '/GPS(/**)?', '/Token(/**)?', '/Notification(/**)?'],
    method: ['get', 'post', 'put', 'delete'],
  }).defend({
    routes: ['/CarModel', '/CarModel/:page(\\d+)', '/CarModel/:carModelID([0-9a-fA-F]{24})'],
    method: ['get'],
  }).defend({
    routes: ['/Route', '/Route/:page(\\d+)', '/Route/:routeID([0-9a-fA-F]{24})'],
    method: ['get'],
  }).defend({
    routes: ['/Car', '/Car/:page(\\d+)', '/Car/:carID([0-9a-fA-F]{24})'],
    method: ['get'],
  }).defend({
    routes: ['/CarStop', '/CarStop/:page(\\d+)', '/CarStop/:carStopID([0-9a-fA-F]{24})'],
    method: ['get'],
  }).defend({
    routes: ['/User'],
    method: ['post'],
  }).defend({
    routes: ['/User/byAccessToken', '/User/current'],
    method: ['get'],
  }).defend({
    routes: ['/User/password'],
    method: ['put'],
  })

  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Module(/**)?', '/Log(/**)?', '/Administrator(/**)?', '/TripLocation(/**)?', '/CarStopTrip(/**)?', '/SMS(/**)?', '/Config(/**)?'],
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
  }).defend({
    routes: ['/Class/Log', '/Class/:classID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/Teacher', '/Teacher/:page(\\d+)', '/Teacher/Log', '/Teacher/:teacherID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/Student', '/Student/:page(\\d+)', '/Student/Log', '/Student/:studentID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/Parent', '/Parent/:page(\\d+)', '/Parent/Log', '/Parent/:parentID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
    || req.token.type === USER_TYPE_NANNY
    || req.token.type === USER_TYPE_DRIVER
      ? next()
      : cancel()
  }).defend({
    routes: ['/User', '/User/:page(\\d+)', '/User/:userID([0-9a-fA-F]{24})', '/User/byPhone/', '/User/ByEmail', '/User/Log', '/User/:userID([0-9a-fA-F]{24})/Log'],
    methods: ['get'],
  }).defend({
    routes: ['/User/:userID([0-9a-fA-F]{24})', '/User/:userID([0-9a-fA-F]{24})/block', '/User/:userID([0-9a-fA-F]{24})/unblock'],
    methods: ['put'],
  }).defend({
    routes: ['/User/:userID([0-9a-fA-F]{24})'],
    methods: ['delete'],
  })
  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/User/:userID([0-9a-fA-F]{24})/password'],
    methods: ['put'],
  })

  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL && v.schoolID === req.params.schoolID) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/School/:schoolID([0-9a-fA-F]{24})'],
    method: ['get', 'put'],
  })

  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            req.schoolID = v.schoolID
            return next()
          }
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Class', '/Class/:page(\\d+)', '/Class/bySchool'],
    method: ['get'],
  }).defend({
    routes: ['/Class'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return ClassModel.getClassByID(req.app.locals.db, req.params.classID, null)
              .then((c) => {
                if (c !== null && c.schoolID === v.schoolID) return next()
                return cancel()
              })
          }
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Class/:classID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            req.schoolID = v.schoolID
            return next()
          }
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Teacher/bySchool'],
    method: ['get'],
  }).defend({
    routes: ['/Teacher'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return TeacherModel.getTeacherByID(req.app.locals.db, req.params.teacherID, null)
              .then((c) => {
                if (c !== null && c.schoolID === v.schoolID) return next()
                return cancel()
              })
          }
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Teacher/:teacherID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return ClassModel.getClassByID(req.app.locals.db, req.query.classID, null)
              .then((c) => {
                if (c !== null && c.schoolID === v.schoolID) return next()
                return cancel()
              })
          }
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Student/byClass'],
    method: ['get'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return next()
    }
    return cancel()
  }).defend({
    routes: ['/Student'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return StudentModel.getStudentByID(req.app.locals.db, req.params.studentID, 'class')
              .then((c) => {
                if (c !== null && c.class != null && c.class.schoolID === v.schoolID) return next()
                return cancel()
              })
          }
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Student/:studentID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return next()
    }
    return cancel()
  }).defend({
    routes: ['/Parent'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return ParentModel.getParentByID(req.app.locals.db, req.params.parentID, 'student')
              .then((c) => {
                if (c !== null && c.student != null && c.student.class != null && c.student.class.schoolID === v.schoolID) return next()
                return cancel()
              })
          }
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Parent/:parentID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/Nanny', '/Nanny/:page(\\d+)', '/Nanny/Log', '/Nanny/:nannyID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/Nanny'],
    method: ['post'],
  }).defend({
    routes: ['/Nanny/:nannyID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/Driver', '/Driver/:page(\\d+)', '/Driver/Log', '/Driver/:driverID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/Driver'],
    method: ['post'],
  }).defend({
    routes: ['/Driver/:driverID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/CarModel/Log', '/CarModel/:carModelID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/CarModel'],
    method: ['post'],
  }).defend({
    routes: ['/CarModel/:carModelID([0-9a-fA-F]{24})'],
    method: ['put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/Route/Log', '/Route/:routeID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/Route'],
    method: ['post'],
  }).defend({
    routes: ['/Route/:routeID([0-9a-fA-F]{24})'],
    method: ['put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/Car/Log', '/Car/:carID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/Car'],
    method: ['post'],
  }).defend({
    routes: ['/Car/:carID([0-9a-fA-F]{24})'],
    method: ['put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
    || req.token.type === USER_TYPE_DRIVER
      ? next()
      : cancel()
  }).defend({
    routes: ['/CarFuel(/**)?'],
    method: ['get', 'post', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
    || req.token.type === USER_TYPE_DRIVER
      ? next()
      : cancel()
  }).defend({
    routes: ['/CarMaintenance(/**)?'],
    method: ['get', 'post', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/CarStop/Log', '/CarStop/:carStopID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/CarStop'],
    method: ['post'],
  }).defend({
    routes: ['/CarStop/:carStopID([0-9a-fA-F]{24})'],
    method: ['put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/StudentList(/**)?'],
    method: ['get', 'post', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/StudentTrip(/**)?'],
    method: ['get', 'post', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
    || req.token.type === USER_TYPE_PARENT
      ? next()
      : cancel()
  }).defend({
    routes: ['/ParentRequest(/**)?'],
    method: ['get', 'post', 'put', 'delete'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
    || req.token.type === USER_TYPE_PARENT
      ? next()
      : cancel()
  }).defend({
    routes: ['/Feedback'],
    method: ['post'],
  }).defend({
    routes: ['/Feedback/:feedbackID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
  })
  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/Feedback', '/Feedback/:page(\\d+)', '/Feedback/Log', '/Feedback/:feedbackID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/Feedback/:feedbackID([0-9a-fA-F]{24})/response'],
    method: ['put'],
  })

  soas2.layerAnd((req, next, cancel) => {
    return req.token.type === USER_TYPE_ADMINISTRATOR
      ? next()
      : cancel()
  }).defend({
    routes: ['/Trip', '/Trip/:page(\\d+)', '/Trip/byTime', '/Trip/Log', '/Trip/:tripID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/Trip'],
    method: ['post'],
  }).defend({
    routes: ['/Trip/:tripID([0-9a-fA-F]{24})'],
    method: ['delete'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return next()
    }
    if (req.token.type === USER_TYPE_NANNY) {
      return TripModel.getTripByID(req.app.locals.db, req.params.tripID, 'nanny')
        .then((v) => {
          if (v !== null && v.nanny != null && v.nanny.userID === req.token.userID) return next()
          return cancel()
        })
    }
    if (req.token.type === USER_TYPE_DRIVER) {
      return TripModel.getTripByID(req.app.locals.db, req.params.tripID, 'driver')
        .then((v) => {
          if (v !== null && v.driver != null && v.driver.userID === req.token.userID) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Trip/:tripID([0-9a-fA-F]{24})'],
    method: ['get'],
  }).defend({
    routes: [
      '/Trip/:tripID([0-9a-fA-F]{24})',
      '/Trip/:tripID([0-9a-fA-F]{24})/status',
      '/Trip/:tripID([0-9a-fA-F]{24})/student/:studentID([0-9a-fA-F]{24})/status',
      '/Trip/:tripID([0-9a-fA-F]{24})/student/:studentID([0-9a-fA-F]{24})/image',
    ],
    method: ['put'],
  })
}

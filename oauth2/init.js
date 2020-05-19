const soas2 = require('simple-oauth2-server')
const MongodbAPI = require('./mongodbAPI')
const AdministratorModel = require('./../models/Administrator')
const CarModel = require('./../models/Car')
const CarFuelModel = require('./../models/CarFuel')
const CarMaintenanceModel = require('./../models/CarMaintenance')
const CarModelModel = require('./../models/CarModel')
const CarStopModel = require('./../models/CarStop')
const ClassModel = require('./../models/Class')
const ConfigModel = require('./../models/Config')
const DriverModel = require('./../models/Driver')
const FeedbackModel = require('./../models/Feedback')
const NannyModel = require('./../models/Nanny')
const ParentModel = require('./../models/Parent')
const ParentRequestModel = require('./../models/ParentRequest')
const RouteModel = require('./../models/Route')
const StudentModel = require('./../models/Student')
const StudentListModel = require('./../models/StudentList')
const TeacherModel = require('./../models/Teacher')
const TripModel = require('./../models/Trip')
const UserModel = require('./../models/User')

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
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Administrator/Log', '/Administrator/:administratorID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/Administrator/:administratorID([0-9a-fA-F]{24})'],
    method: ['delete'],
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
    routes: ['/Administrator', '/Administrator/:page(\\d+)'],
    method: ['get'],
  }).defend({
    routes: ['/Administrator'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return AdministratorModel.getAdministratorByID(req.app.locals.db, req.params.administratorID, null)
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
    routes: ['/Administrator/:administratorID([0-9a-fA-F]{24})'],
    method: ['get', 'put'],
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
    routes: ['/Car/Log', '/Car/:carID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/Car', '/Car/:page(\\d+)'],
    method: ['get'],
  }).defend({
    routes: ['/Car'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return CarModel.getCarByID(req.app.locals.db, req.params.carID, null)
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
    routes: ['/Car/:carID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
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
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/CarModel/Log', '/CarModel/:carModelID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/CarModel', '/CarModel/:page(\\d+)'],
    method: ['get'],
  }).defend({
    routes: ['/CarModel'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return CarModelModel.getCarModelByID(req.app.locals.db, req.params.carModelID, null)
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
    routes: ['/CarModel/:carModelID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
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
    routes: ['/CarStop/Log', '/CarStop/:carStopID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/CarStop', '/CarStop/:page(\\d+)'],
    method: ['get'],
  }).defend({
    routes: ['/CarStop'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return CarStopModel.getCarStopByID(req.app.locals.db, req.params.carStopID, null)
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
    routes: ['/CarStop/:carStopID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
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
    routes: ['/CarStopTrip(/**)?'],
    methods: ['get', 'post', 'put', 'delete'],
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
    routes: ['/Class/Log', '/Class/:classID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    if (req.token.type === USER_TYPE_TEACHER) {
      return TeacherModel.getTeacherByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.teacherID = String(v._id)
          return next()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Class', '/Class/:page(\\d+)'],
    method: ['get'],
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
    routes: ['/Class/bySchool'],
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
    if (req.token.type === USER_TYPE_TEACHER) {
      return ClassModel.getClassByID(req.app.locals.db, req.params.classID, 'teacher')
        .then((c) => {
          if (c !== null && c.teacher != null && c.teacher.userID === req.token.userID) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Class/:classID([0-9a-fA-F]{24})'],
    method: ['get'],
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
    method: ['put', 'delete'],
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
    routes: ['/Config/Log', '/Config/:configID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/Config', '/Config/:page(\\d+)'],
    method: ['get'],
  }).defend({
    routes: ['/Config'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return ConfigModel.getConfigByID(req.app.locals.db, req.params.configID, null)
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
    routes: ['/Config/:configID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
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
    routes: ['/Driver/Log', '/Driver/:driverID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/Driver', '/Driver/:page(\\d+)'],
    method: ['get'],
  }).defend({
    routes: ['/Driver'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return DriverModel.getDriverByID(req.app.locals.db, req.params.driverID, null)
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
    routes: ['/Driver/:driverID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
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
    routes: ['/Feedback/Log', '/Feedback/:feedbackID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    if (req.token.type === USER_TYPE_PARENT) {
      return ParentModel.getParentByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.schoolID = v.schoolID
          req.userID = req.token.userID
          return next()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Feedback', '/Feedback/:page(\\d+)'],
    method: ['get'],
  }).defend({
    routes: ['/Feedback'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return FeedbackModel.getFeedbackByID(req.app.locals.db, req.params.feedbackID, null)
              .then((c) => {
                if (c !== null && c.schoolID === v.schoolID) return next()
                return cancel()
              })
          }
          return cancel()
        })
    }
    if (req.token.type === USER_TYPE_PARENT) {
      return FeedbackModel.getFeedbackByID(req.app.locals.db, req.params.feedbackID, null)
        .then((c) => {
          if (c !== null && c.userID === req.token.userID) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Feedback/:feedbackID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return FeedbackModel.getFeedbackByID(req.app.locals.db, req.params.feedbackID, null)
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
    routes: ['/Feedback/:feedbackID([0-9a-fA-F]{24})/response'],
    method: ['put'],
  })

  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            req.schoolID = v.schoolID
          }
          return next()
        })
    }
    return next()
  }).defend({
    routes: ['/GPS(/**)?'],
    method: ['get', 'post', 'put', 'delete'],
  })

  soas2.defend({
    routes: ['/Info(/**)?'],
    method: ['get', 'post', 'put', 'delete'],
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
    routes: ['/Log(/**)?'],
    methods: ['get', 'post', 'put', 'delete'],
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
    routes: ['/Module(/**)?'],
    methods: ['get', 'post', 'put', 'delete'],
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
    routes: ['/Nanny/Log', '/Nanny/:nannyID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/Nanny', '/Nanny/:page(\\d+)'],
    method: ['get'],
  }).defend({
    routes: ['/Nanny'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return NannyModel.getNannyByID(req.app.locals.db, req.params.nannyID, null)
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
    routes: ['/Nanny/:nannyID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
  })

  soas2.defend({
    routes: ['/Notification(/**)?'],
    method: ['get', 'post', 'put', 'delete'],
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
    routes: ['/Parent/Log', '/Parent/:parentID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/Parent', '/Parent/:page(\\d+)'],
    method: ['get'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR || req.token.type === USER_TYPE_TEACHER) {
      return next()
    }
    return cancel()
  }).defend({
    routes: ['/Parent/byClass'],
    method: ['get'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return next()
    }
    return cancel()
  }).defend({
    routes: ['/Parent'],
    method: ['post'],
  }).defend({
    routes: ['/Parent/:parentID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
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
    routes: ['/ParentRequest/Log', '/ParentRequest/:parentRequestID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    if (req.token.type === USER_TYPE_PARENT) {
      return ParentModel.getParentByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.parentID = String(v._id)
          return next()
        })
    }
    if (req.token.type === USER_TYPE_TEACHER) {
      return TeacherModel.getTeacherByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.teacherID = String(v._id)
          return next()
        })
    }
    return cancel()
  }).defend({
    routes: ['/ParentRequest', '/ParentRequest/:page(\\d+)'],
    method: ['get'],
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
    if (req.token.type === USER_TYPE_PARENT) {
      return ParentModel.getParentByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.schoolID = v.schoolID
          req.parentID = String(v._id)
          return next()
        })
    }
    return cancel()
  }).defend({
    routes: ['/ParentRequest'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return ParentRequestModel.getParentRequestByID(req.app.locals.db, req.params.parentRequestID, null)
              .then((c) => {
                if (c !== null && c.schoolID === v.schoolID) return next()
                return cancel()
              })
          }
          return cancel()
        })
    }
    if (req.token.type === USER_TYPE_PARENT) {
      return ParentRequestModel.getParentRequestByID(req.app.locals.db, req.params.parentRequestID, 'parent')
        .then((c) => {
          if (c !== null && c.parent !== null && c.parent.userID === req.token.userID) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/ParentRequest/:parentRequestID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
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
    routes: ['/Route/Log', '/Route/:routeID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/Route', '/Route/:page(\\d+)'],
    method: ['get'],
  }).defend({
    routes: ['/Route'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return RouteModel.getRouteByID(req.app.locals.db, req.params.routeID, null)
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
    routes: ['/Route/:routeID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
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
    routes: ['/School', '/School/:page(\\d+)', '/School/Log', '/School/:schoolID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
  }).defend({
    routes: ['/School'],
    method: ['post'],
  }).defend({
    routes: ['/School/:schoolID([0-9a-fA-F]{24})'],
    method: ['delete'],
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
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/SMS(/**)?'],
    methods: ['get', 'post', 'put', 'delete'],
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
    routes: ['/Student/Log', '/Student/:studentID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/Student', '/Student/:page(\\d+)'],
    method: ['get'],
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
            return ClassModel.getClassByID(req.app.locals.db, req.query.classID, null)
              .then((c) => {
                if (c !== null && c.schoolID === v.schoolID) return next()
                return cancel()
              })
          }
          return cancel()
        })
    }
    if (req.token.type === USER_TYPE_TEACHER) {
      return ClassModel.getClassByID(req.app.locals.db, req.query.classID, 'teacher')
        .then((c) => {
          if (c !== null && c.teacher !== null && c.teacher.userID === req.token.userID) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Student/byClass', '/Student/byClassStatusInDate'],
    method: ['get'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return StudentModel.getStudentByID(req.app.locals.db, req.params.studentID, null)
              .then((c) => {
                if (c !== null && c.schoolID === v.schoolID) return next()
                return cancel()
              })
          }
          return cancel()
        })
    }
    if (req.token.type === USER_TYPE_TEACHER) {
      return StudentModel.getStudentByID(req.app.locals.db, req.params.studentID, 'class')
        .then((c) => {
          if (c !== null && c.class != null && c.class.teacher != null && c.class.teacher.userID === req.token.userID) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Student/:studentID([0-9a-fA-F]{24})'],
    method: ['get'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return StudentModel.getStudentByID(req.app.locals.db, req.params.studentID, null)
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
    routes: ['/Student/:studentID([0-9a-fA-F]{24})'],
    method: ['put', 'delete'],
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
    routes: ['/StudentList/Log', '/StudentList/:studentListID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/StudentList', '/StudentList/:page(\\d+)'],
    method: ['get'],
  }).defend({
    routes: ['/StudentList'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return StudentListModel.getStudentListByID(req.app.locals.db, req.params.studentListID, null)
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
    routes: ['/StudentList/:studentListID([0-9a-fA-F]{24})'],
    method: ['get', 'put', 'delete'],
  }).defend({
    routes: ['/StudentList/:studentListID([0-9a-fA-F]{24})/studentIDs/add', '/StudentList/:studentListID([0-9a-fA-F]{24})/studentIDs/remove'],
    method: ['put'],
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
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          return cancel()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Teacher/Log', '/Teacher/:teacherID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    routes: ['/Teacher', '/Teacher/:page(\\d+)', '/Teacher/bySchool'],
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

  soas2.defend({
    routes: ['/Token(/**)?'],
    method: ['get', 'post', 'put', 'delete'],
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
    routes: ['/Trip/byTime', '/Trip/Log', '/Trip/:tripID([0-9a-fA-F]{24})/Log'],
    method: ['get'],
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
    if (req.token.type === USER_TYPE_STUDENT) {
      return StudentModel.getStudentByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.studentID = String(v._id)
          return next()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Trip', '/Trip/:page(\\d+)'],
    method: ['get'],
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
    routes: ['/Trip'],
    method: ['post'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return TripModel.getTripByID(req.app.locals.db, req.params.tripID, null)
              .then((c) => {
                if (c !== null && c.schoolID === v.schoolID) return next()
                return cancel()
              })
          }
          return cancel()
        })
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
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_DRIVER) {
      return DriverModel.getDriverByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.driverID = String(v._id)
          return next()
        })
    }
    if (req.token.type === USER_TYPE_NANNY) {
      return NannyModel.getNannyByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.nannyID = String(v._id)
          return next()
        })
    }
    if (req.token.type === USER_TYPE_STUDENT) {
      return StudentModel.getStudentByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.studentID = String(v._id)
          return next()
        })
    }
    if (req.token.type === USER_TYPE_PARENT) {
      return ParentModel.getParentByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.studentIDs = v.studentIDs
          return next()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Trip/next'],
    method: ['get'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_DRIVER) {
      return DriverModel.getDriverByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          req.driverID = String(v._id)
          return next()
        })
    }
    return cancel()
  }).defend({
    routes: ['/Trip/history'],
    method: ['get'],
  })
  soas2.defend({
    routes: ['/Trip/byStudent'],
    method: ['get'],
  })
  soas2.layerAnd((req, next, cancel) => {
    if (req.token.type === USER_TYPE_ADMINISTRATOR) {
      return AdministratorModel.getAdministratorByUser(req.app.locals.db, req.token.userID, null)
        .then((v) => {
          if (v.adminType === ADMINISTRATOR_TYPE_ROOT) return next()
          if (v.adminType === ADMINISTRATOR_TYPE_SCHOOL) {
            return TripModel.getTripByID(req.app.locals.db, req.params.tripID, null)
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
    routes: ['/Trip/:tripID([0-9a-fA-F]{24})'],
    method: ['delete'],
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
    routes: ['/TripLocation(/**)?'],
    methods: ['get', 'post', 'put', 'delete'],
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
  soas2.defend({
    routes: ['/User'],
    method: ['post'],
  }).defend({
    routes: ['/User/byAccessToken', '/User/current'],
    method: ['get'],
  }).defend({
    routes: ['/User/password'],
    method: ['put'],
  })
}

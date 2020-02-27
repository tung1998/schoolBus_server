const express = require('express')
const router = express.Router()

const { getAdministratorByUser } = require('../models/Administrator')
const { getStudentByUser } = require('../models/Student')
const { getNannyByUser } = require('../models/Nanny')
const { getParentByUser } = require('../models/Parent')
const { getDriverByUser } = require('../models/Driver')
const { getTeacherByUser } = require('../models/Teacher')
const { getModules } = require('../models/Module')

const USER_TYPE_ADMINISTRATOR = 0
const USER_TYPE_STUDENT = 1
const USER_TYPE_NANNY = 2
const USER_TYPE_PARENT = 3
const USER_TYPE_DRIVER = 4
const USER_TYPE_TEACHER = 5

router.get('/', (req, res, next) => {
  let db = req.app.locals.db
  let userType = Number(req.token.type) || 0
  getModules(db).then((modules) => {
    let human = ''
    switch (userType) {
      case USER_TYPE_STUDENT:
        human = 'student'
        break
      case USER_TYPE_NANNY:
        human = 'nanny'
        break
      case USER_TYPE_PARENT:
        human = 'parent'
        break
      case USER_TYPE_DRIVER:
        human = 'driver'
        break
      case USER_TYPE_TEACHER:
        human = 'teacher'
        break
      default:
        human = 'admin'
    }
    let listModules = modules.filter(({ permission }) => {
      return Array.isArray(permission) && permission.includes(human)
    })
    switch (userType) {
      case USER_TYPE_STUDENT:
        getStudentByUser(db, req.token.userID)
          .then((student) => {
            delete student.user.password
            delete student.user.salt
            student.modules = listModules
            res.send(student)
          })
          .catch(next)
        break
      case USER_TYPE_NANNY:
        getNannyByUser(db, req.token.userID)
          .then((nanny) => {
            delete nanny.user.password
            delete nanny.user.salt
            nanny.modules = listModules
            res.send(nanny)
          })
          .catch(next)
        break
      case USER_TYPE_PARENT:
        getParentByUser(db, req.token.userID)
          .then((parent) => {
            delete parent.user.password
            delete parent.user.salt
            parent.modules = listModules
            res.send(parent)
          })
          .catch(next)
        break
      case USER_TYPE_DRIVER:
        getDriverByUser(db, req.token.userID)
          .then((driver) => {
            delete driver.user.password
            delete driver.user.salt
            driver.modules = listModules
            res.send(driver)
          })
          .catch(next)
        break
      case USER_TYPE_TEACHER:
        getTeacherByUser(db, req.token.userID)
          .then((teacher) => {
            delete teacher.user.password
            delete teacher.user.salt
            teacher.modules = listModules
            res.send(teacher)
          })
          .catch(next)
        break
      default:
        getAdministratorByUser(db, req.token.userID)
          .then((admin) => {
            if (!admin) {
              next()
            } else {
              delete admin.user.password
              delete admin.user.salt
              admin.modules = listModules
              res.send(admin)
            }
          })
          .catch(next)
        break
    }
  }).catch(next)
})

module.exports = router

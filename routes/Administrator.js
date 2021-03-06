const express = require('express')
const router = express.Router()

const AdministratorModel = require('./../models/Administrator')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { username, password, image, name, phone, email, adminType, permission, schoolID, dateOfBirth } = req.body
  if (req.schoolID !== undefined) schoolID = req.schoolID
  let { db } = req.app.locals
  AdministratorModel.createAdministrator(db, username, password, image, name, phone, email, adminType, permission, schoolID, dateOfBirth)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create administrator : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'administrator',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { limit, extra, ...query } = req.query
  limit = Number(limit)
  if (req.schoolID !== undefined) {
    let result = {}
    return AdministratorModel.getAdministratorsBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return AdministratorModel.countAdministratorsBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  AdministratorModel.getAdministrators(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return AdministratorModel.countAdministrators(db, query)
    })
    .then((cnt) => {
      result.count = cnt
      result.page = 1
      res.send(result)
    })
    .catch(next)
})

router.get('/:page(\\d+)', (req, res, next) => {
  let { db } = req.app.locals
  let { limit, extra, ...query } = req.query
  limit = Number(limit)
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Not Found' })
  else {
    if (req.schoolID !== undefined) {
      let result = {}
      return AdministratorModel.getAdministratorsBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return AdministratorModel.countAdministratorsBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    AdministratorModel.getAdministrators(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return AdministratorModel.countAdministrators(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:administratorID([0-9a-fA-F]{24})', (req, res, next) => {
  let { administratorID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  AdministratorModel.getAdministratorByID(db, administratorID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:administratorID([0-9a-fA-F]{24})', (req, res, next) => {
  let { administratorID } = req.params
  let { adminType, permission, schoolID, image, name, phone, email, dateOfBirth } = req.body
  let obj = {}
  if (adminType !== undefined) obj.adminType = adminType
  if (permission !== undefined) obj.permission = permission
  if (schoolID !== undefined) obj.schoolID = schoolID
  let obj1 = {}
  if (image !== undefined) obj1.image = image
  if (name !== undefined) obj1.name = name
  if (phone !== undefined) obj1.phone = phone
  if (email !== undefined) obj1.email = email
  if (schoolID !== undefined) obj1.schoolID = schoolID
  if (dateOfBirth !== undefined) obj1.dateOfBirth = dateOfBirth
  let { db } = req.app.locals
  AdministratorModel.updateAdministrator(db, administratorID, obj, obj1)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update administrator : _id = ${administratorID}`,
          Date.now(),
          1,
          req.body,
          'administrator',
          administratorID,
        )
      }
    })
    .catch(next)
})

router.delete('/:administratorID([0-9a-fA-F]{24})', (req, res, next) => {
  let { administratorID } = req.params
  let { db } = req.app.locals
  AdministratorModel.deleteAdministrator(db, administratorID)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete administrator : _id = ${administratorID}`,
          Date.now(),
          2,
          null,
          'administrator',
          administratorID,
        )
      }
    })
    .catch(next)
})

router.get('/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObjectType(db, 'administrator', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:administratorID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { administratorID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'administrator', administratorID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

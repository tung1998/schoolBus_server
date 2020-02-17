const express = require('express')
const router = express.Router()

const AdministratorModel = require('./../models/Administrator')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { userID, adminType, permission } = req.body
  let { db } = req.app.locals
  AdministratorModel.createAdministrator(db, userID, adminType, permission)
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
  let { extra } = req.query
  let result = {}
  AdministratorModel.getAdministrators(db, 1, extra)
    .then((data) => {
      result.data = data
      return AdministratorModel.countAdministrators(db)
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
  let { extra } = req.query
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Page not found' })
  else {
    let result = {}
    AdministratorModel.getAdministrators(db, page, extra)
      .then((data) => {
        result.data = data
        return AdministratorModel.countAdministrators(db)
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
  let { adminType, permission } = req.body
  let obj = {}
  if (adminType !== undefined) obj.adminType = adminType
  if (permission !== undefined) obj.permission = permission
  let { db } = req.app.locals
  AdministratorModel.updateAdministrator(db, administratorID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
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

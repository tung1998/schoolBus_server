const express = require('express')
const router = express.Router()

const SchoolModel = require('./../models/School')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { name, address, status } = req.body
  let { db } = req.app.locals
  SchoolModel.createSchool(db, name, address, status)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create school : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'school',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let result = {}
  SchoolModel.getSchools(db, 1)
    .then((data) => {
      result.data = data
      return SchoolModel.countSchools(db)
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
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Page not found' })
  else {
    let result = {}
    SchoolModel.getSchools(db, page)
      .then((data) => {
        result.data = data
        return SchoolModel.countSchools(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:schoolID([0-9a-fA-F]{24})', (req, res, next) => {
  let { schoolID } = req.params
  let { db } = req.app.locals
  SchoolModel.getSchoolByID(db, schoolID)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:schoolID([0-9a-fA-F]{24})', (req, res, next) => {
  let { schoolID } = req.params
  let { name, address, status } = req.body
  let obj = {}
  if (name !== undefined) obj.name = name
  if (address !== undefined) obj.address = address
  if (status !== undefined) obj.status = status
  let { db } = req.app.locals
  SchoolModel.updateSchool(db, schoolID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update school : _id = ${schoolID}`,
          Date.now(),
          1,
          req.body,
          'school',
          schoolID,
        )
      }
    })
    .catch(next)
})

router.delete('/:schoolID([0-9a-fA-F]{24})', (req, res, next) => {
  let { schoolID } = req.params
  let { db } = req.app.locals
  SchoolModel.deleteSchool(db, schoolID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete school : _id = ${schoolID}`,
          Date.now(),
          2,
          null,
          'school',
          schoolID,
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
  LogModel.getLogsByObjectType(db, 'school', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:schoolID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { schoolID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'school', schoolID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

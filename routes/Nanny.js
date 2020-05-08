const express = require('express')
const router = express.Router()

const NannyModel = require('./../models/Nanny')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { username, password, image, name, phone, email, address, IDNumber, IDIssueDate, IDIssueBy, status, schoolID, dateOfBirth } = req.body
  if (req.schoolID !== undefined) schoolID = req.schoolID
  let { db } = req.app.locals
  NannyModel.createNanny(db, username, password, image, name, phone, email, address, IDNumber, IDIssueDate, IDIssueBy, status, schoolID, dateOfBirth)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create nanny : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'nanny',
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
    return NannyModel.getNanniesBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return NannyModel.countNanniesBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  NannyModel.getNannies(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return NannyModel.countNannies(db, query)
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
      return NannyModel.getNanniesBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return NannyModel.countNanniesBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    NannyModel.getNannies(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return NannyModel.countNannies(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:nannyID([0-9a-fA-F]{24})', (req, res, next) => {
  let { nannyID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  NannyModel.getNannyByID(db, nannyID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:nannyID([0-9a-fA-F]{24})', (req, res, next) => {
  let { nannyID } = req.params
  let { address, IDNumber, IDIssueDate, IDIssueBy, status, schoolID, image, name, phone, email, dateOfBirth } = req.body
  let obj = {}
  if (address !== undefined) obj.address = address
  if (IDNumber !== undefined) obj.IDNumber = IDNumber
  if (IDIssueDate !== undefined) obj.IDIssueDate = IDIssueDate
  if (IDIssueBy !== undefined) obj.IDIssueBy = IDIssueBy
  if (status !== undefined) obj.status = status
  if (schoolID !== undefined) obj.schoolID = schoolID
  let obj1 = {}
  if (image !== undefined) obj1.image = image
  if (name !== undefined) obj1.name = name
  if (phone !== undefined) obj1.phone = phone
  if (email !== undefined) obj1.email = email
  if (schoolID !== undefined) obj1.schoolID = schoolID
  if (dateOfBirth !== undefined) obj1.dateOfBirth = dateOfBirth
  let { db } = req.app.locals
  NannyModel.updateNanny(db, nannyID, obj, obj1)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update nanny : _id = ${nannyID}`,
          Date.now(),
          1,
          req.body,
          'nanny',
          nannyID,
        )
      }
    })
    .catch(next)
})

router.delete('/:nannyID([0-9a-fA-F]{24})', (req, res, next) => {
  let { nannyID } = req.params
  let { db } = req.app.locals
  NannyModel.deleteNanny(db, nannyID)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete nanny : _id = ${nannyID}`,
          Date.now(),
          2,
          null,
          'nanny',
          nannyID,
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
  LogModel.getLogsByObjectType(db, 'nanny', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:nannyID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { nannyID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'nanny', nannyID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

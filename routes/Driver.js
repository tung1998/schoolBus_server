const express = require('express')
const router = express.Router()

const DriverModel = require('./../models/Driver')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { username, password, image, name, phone, email, address, IDNumber, IDIssueDate, IDIssueBy, DLNumber, DLIssueDate, status } = req.body
  let schoolID = req.schoolID || req.body.schoolID
  let { db } = req.app.locals
  DriverModel.createDriver(db, username, password, image, name, phone, email, address, IDNumber, IDIssueDate, IDIssueBy, DLNumber, DLIssueDate, status, schoolID)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create driver : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'driver',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  if (req.schoolID !== undefined) {
    let result = {}
    return DriverModel.getDriversBySchool(db, req.schoolID, 1, extra)
      .then((data) => {
        result.data = data
        return DriverModel.countDriversBySchool(db, req.schoolID)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  DriverModel.getDrivers(db, 1, extra)
    .then((data) => {
      result.data = data
      return DriverModel.countDrivers(db)
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
  if (!page || page <= 0) res.status(404).send({ message: 'Not Found' })
  else {
    if (req.schoolID !== undefined) {
      let result = {}
      return DriverModel.getDriversBySchool(db, req.schoolID, page, extra)
        .then((data) => {
          result.data = data
          return DriverModel.countDriversBySchool(db, req.schoolID)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    DriverModel.getDrivers(db, page, extra)
      .then((data) => {
        result.data = data
        return DriverModel.countDrivers(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:driverID([0-9a-fA-F]{24})', (req, res, next) => {
  let { driverID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  DriverModel.getDriverByID(db, driverID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:driverID([0-9a-fA-F]{24})', (req, res, next) => {
  let { driverID } = req.params
  let { address, IDNumber, IDIssueDate, IDIssueBy, DLNumber, DLIssueDate, status, schoolID, image, name, phone, email } = req.body
  let obj = {}
  if (address !== undefined) obj.address = address
  if (IDNumber !== undefined) obj.IDNumber = IDNumber
  if (IDIssueDate !== undefined) obj.IDIssueDate = IDIssueDate
  if (IDIssueBy !== undefined) obj.IDIssueBy = IDIssueBy
  if (DLNumber !== undefined) obj.DLNumber = DLNumber
  if (DLIssueDate !== undefined) obj.DLIssueDate = DLIssueDate
  if (status !== undefined) obj.status = status
  if (schoolID !== undefined) obj.schoolID = schoolID
  let obj1 = {}
  if (image !== undefined) obj1.image = image
  if (name !== undefined) obj1.name = name
  if (phone !== undefined) obj1.phone = phone
  if (email !== undefined) obj1.email = email
  let { db } = req.app.locals
  DriverModel.updateDriver(db, driverID, obj, obj1)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update driver : _id = ${driverID}`,
          Date.now(),
          1,
          req.body,
          'driver',
          driverID,
        )
      }
    })
    .catch(next)
})

router.delete('/:driverID([0-9a-fA-F]{24})', (req, res, next) => {
  let { driverID } = req.params
  let { db } = req.app.locals
  DriverModel.deleteDriver(db, driverID)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete driver : _id = ${driverID}`,
          Date.now(),
          2,
          null,
          'driver',
          driverID,
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
  LogModel.getLogsByObjectType(db, 'driver', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:driverID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { driverID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'driver', driverID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

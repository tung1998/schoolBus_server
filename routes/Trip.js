const express = require('express')
const router = express.Router()

const TripModel = require('./../models/Trip')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { carID, driverID, nannyID, routeID, students, attendance, type, status, note, accident, startTime, endTime } = req.body
  let { db } = req.app.locals
  TripModel.createTrip(db, carID, driverID, nannyID, routeID, students, attendance, type, status, note, accident, startTime, endTime)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create trip : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'trip',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  TripModel.getTrips(db, 1, extra)
    .then((data) => {
      result.data = data
      return TripModel.countTrips(db)
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
    let result = {}
    TripModel.getTrips(db, page, extra)
      .then((data) => {
        result.data = data
        return TripModel.countTrips(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:tripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { tripID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  TripModel.getTripByID(db, tripID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:tripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { tripID } = req.params
  let { carID, driverID, nannyID, routeID, students, attendance, type, status, note, accident, startTime, endTime } = req.body
  let obj = {}
  if (carID !== undefined) obj.carID = carID
  if (driverID !== undefined) obj.driverID = driverID
  if (nannyID !== undefined) obj.nannyID = nannyID
  if (routeID !== undefined) obj.routeID = routeID
  if (attendance !== undefined) obj.attendance = attendance
  if (type !== undefined) obj.type = type
  if (status !== undefined) obj.status = status
  if (note !== undefined) obj.note = note
  if (accident !== undefined) obj.accident = accident
  if (startTime !== undefined) obj.startTime = startTime
  if (endTime !== undefined) obj.endTime = endTime
  if (students !== undefined) obj.students = students
  let { db } = req.app.locals
  TripModel.updateTrip(db, tripID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update trip : _id = ${tripID}`,
          Date.now(),
          1,
          req.body,
          'trip',
          tripID,
        )
      }
    })
    .catch(next)
})

router.put('/:tripID([0-9a-fA-F]{24})/status', (req, res, next) => {
  let { tripID } = req.params
  let { status } = req.body
  let { db } = req.app.locals
  TripModel.updateTripStatus(db, tripID, status)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update trip status : _id = ${tripID}`,
          Date.now(),
          1,
          req.body,
          'trip',
          tripID,
        )
      }
    })
    .catch(next)
})

router.delete('/:tripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { tripID } = req.params
  let { db } = req.app.locals
  TripModel.deleteTrip(db, tripID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete trip : _id = ${tripID}`,
          Date.now(),
          2,
          null,
          'trip',
          tripID,
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
  LogModel.getLogsByObjectType(db, 'trip', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:tripID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { tripID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'trip', tripID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

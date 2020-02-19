const express = require('express')
const router = express.Router()

const CarStopTripModel = require('./../models/CarStopTrip')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { carStopID, tripID, reachTime } = req.body
  let { db } = req.app.locals
  CarStopTripModel.createCarStopTrip(db, carStopID, tripID, reachTime)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create carStopTrip : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'carStopTrip',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  CarStopTripModel.getCarStopTrips(db, 1, extra)
    .then((data) => {
      result.data = data
      return CarStopTripModel.countCarStopTrips(db)
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
    CarStopTripModel.getCarStopTrips(db, page, extra)
      .then((data) => {
        result.data = data
        return CarStopTripModel.countCarStopTrips(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:carStopTripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carStopTripID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  CarStopTripModel.getCarStopTripByID(db, carStopTripID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:carStopTripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carStopTripID } = req.params
  let { carStopID, tripID, reachTime } = req.body
  let obj = {}
  if (carStopID !== undefined) obj.carStopID = carStopID
  if (tripID !== undefined) obj.tripID = tripID
  if (reachTime !== undefined) obj.reachTime = reachTime
  let { db } = req.app.locals
  CarStopTripModel.updateCarStopTrip(db, carStopTripID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update carStopTrip : _id = ${carStopTripID}`,
          Date.now(),
          1,
          req.body,
          'carStopTrip',
          carStopTripID,
        )
      }
    })
    .catch(next)
})

router.delete('/:carStopTripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carStopTripID } = req.params
  let { db } = req.app.locals
  CarStopTripModel.deleteCarStopTrip(db, carStopTripID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete carStopTrip : _id = ${carStopTripID}`,
          Date.now(),
          2,
          null,
          'carStopTrip',
          carStopTripID,
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
  LogModel.getLogsByObjectType(db, 'carStopTrip', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:carStopTripID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { carStopTripID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'carStopTrip', carStopTripID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/getByTrip/:page(\\d+)', (req, res, next) => {
  let extra = req.query.extra
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Page not found' })
  else {
    let tripID = req.query.tripID
    let db = req.app.locals.db
    CarStopTripModel.getCarStopTripsByTrip(db, tripID, page, extra)
      .then(CarStopTrips => res.send(CarStopTrips))
      .catch(next)
  }
})

module.exports = router

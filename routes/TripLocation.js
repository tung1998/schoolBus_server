const express = require('express')
const router = express.Router()

const TripLocationModel = require('./../models/TripLocation')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { tripID, location, time } = req.body
  let { db } = req.app.locals
  TripLocationModel.createTripLocation(db, tripID, location, time)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create tripLocation : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'tripLocation',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  TripLocationModel.getTripLocations(db, 1, extra)
    .then((data) => {
      result.data = data
      return TripLocationModel.countTripLocations(db)
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
    TripLocationModel.getTripLocations(db, page, extra)
      .then((data) => {
        result.data = data
        return TripLocationModel.countTripLocations(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:tripLocationID([0-9a-fA-F]{24})', (req, res, next) => {
  let { tripLocationID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  TripLocationModel.getTripLocationByID(db, tripLocationID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:tripLocationID([0-9a-fA-F]{24})', (req, res, next) => {
  let { tripLocationID } = req.params
  let { tripID, location, time } = req.body
  let obj = {}
  if (tripID !== undefined) obj.tripID = tripID
  if (location !== undefined) obj.location = location
  if (time !== undefined) obj.time = time
  let { db } = req.app.locals
  TripLocationModel.updateTripLocation(db, tripLocationID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update tripLocation : _id = ${tripLocationID}`,
          Date.now(),
          1,
          req.body,
          'tripLocation',
          tripLocationID,
        )
      }
    })
    .catch(next)
})

router.delete('/:tripLocationID([0-9a-fA-F]{24})', (req, res, next) => {
  let { tripLocationID } = req.params
  let { db } = req.app.locals
  TripLocationModel.deleteTripLocation(db, tripLocationID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete tripLocation : _id = ${tripLocationID}`,
          Date.now(),
          2,
          null,
          'tripLocation',
          tripLocationID,
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
  LogModel.getLogsByObjectType(db, 'tripLocation', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:tripLocationID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { tripLocationID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'tripLocation', tripLocationID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

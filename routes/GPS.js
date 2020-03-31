const express = require('express')
const router = express.Router()

const GPSModel = require('./../models/GPS')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { carID, location, schoolID } = req.body
  if (req.schoolID !== undefined) schoolID = req.schoolID
  let { db } = req.app.locals
  GPSModel.createGPS(db, carID, location, schoolID)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create GPS : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'GPS',
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
    return GPSModel.getGPSBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return GPSModel.countGPSBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  GPSModel.getGPS(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return GPSModel.countGPS(db, query)
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
      return GPSModel.getGPSBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return GPSModel.countGPSBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    GPSModel.getGPS(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return GPSModel.countGPS(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:GPSID([0-9a-fA-F]{24})', (req, res, next) => {
  let { GPSID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  GPSModel.getGPSByID(db, GPSID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:GPSID([0-9a-fA-F]{24})', (req, res, next) => {
  let { GPSID } = req.params
  let { carID, location, schoolID } = req.body
  let obj = {}
  if (carID !== undefined) obj.carID = carID
  if (location !== undefined) obj.location = location
  if (schoolID !== undefined) obj.schoolID = schoolID
  let { db } = req.app.locals
  GPSModel.updateGPS(db, GPSID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update GPS : _id = ${GPSID}`,
          Date.now(),
          1,
          req.body,
          'GPS',
          GPSID,
        )
      }
    })
    .catch(next)
})

router.delete('/:GPSID([0-9a-fA-F]{24})', (req, res, next) => {
  let { GPSID } = req.params
  let { db } = req.app.locals
  GPSModel.deleteGPS(db, GPSID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete GPS : _id = ${GPSID}`,
          Date.now(),
          2,
          null,
          'GPS',
          GPSID,
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
  LogModel.getLogsByObjectType(db, 'GPS', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:GPSID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { GPSID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'GPS', GPSID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/byCar', (req, res, next) => {
  let { db } = req.app.locals
  let { carID, page, extra } = req.query
  page = Number(page) || 1
  GPSModel.getGPSByCar(db, carID, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/last', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  GPSModel.getGPSLast(db, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

const express = require('express')
const router = express.Router()

const CarStopModel = require('./../models/CarStop')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { stopType, name, address, location, schoolID } = req.body
  if (req.schoolID !== undefined) schoolID = req.schoolID
  let { db } = req.app.locals
  CarStopModel.createCarStop(db, stopType, name, address, location, schoolID)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create carStop : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'carStop',
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
    return CarStopModel.getCarStopsBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return CarStopModel.countCarStopsBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  CarStopModel.getCarStops(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return CarStopModel.countCarStops(db, query)
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
      return CarStopModel.getCarStopsBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return CarStopModel.countCarStopsBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    CarStopModel.getCarStops(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return CarStopModel.countCarStops(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:carStopID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carStopID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  CarStopModel.getCarStopByID(db, carStopID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:carStopID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carStopID } = req.params
  let { stopType, name, address, location, schoolID } = req.body
  let obj = {}
  if (stopType !== undefined) obj.stopType = stopType
  if (name !== undefined) obj.name = name
  if (address !== undefined) obj.address = address
  if (location !== undefined) obj.location = location
  if (schoolID !== undefined) obj.schoolID = schoolID
  let { db } = req.app.locals
  CarStopModel.updateCarStop(db, carStopID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update carStop : _id = ${carStopID}`,
          Date.now(),
          1,
          req.body,
          'carStop',
          carStopID,
        )
      }
    })
    .catch(next)
})

router.delete('/:carStopID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carStopID } = req.params
  let { db } = req.app.locals
  CarStopModel.deleteCarStop(db, carStopID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete carStop : _id = ${carStopID}`,
          Date.now(),
          2,
          null,
          'carStop',
          carStopID,
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
  LogModel.getLogsByObjectType(db, 'carStop', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:carStopID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { carStopID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'carStop', carStopID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

const express = require('express')
const router = express.Router()

const CarFuelModel = require('./../models/CarFuel')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { carID, volume, price, schoolID } = req.body
  if (req.schoolID !== undefined) schoolID = req.schoolID
  let { db } = req.app.locals
  CarFuelModel.createCarFuel(db, carID, volume, price, schoolID)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create carFuel : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'carFuel',
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
    return CarFuelModel.getCarFuelsBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return CarFuelModel.countCarFuelsBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  CarFuelModel.getCarFuels(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return CarFuelModel.countCarFuels(db, query)
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
      return CarFuelModel.getCarFuelsBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return CarFuelModel.countCarFuelsBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    CarFuelModel.getCarFuels(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return CarFuelModel.countCarFuels(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:carFuelID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carFuelID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  CarFuelModel.getCarFuelByID(db, carFuelID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:carFuelID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carFuelID } = req.params
  let { carID, volume, price, schoolID } = req.body
  let obj = {}
  if (carID !== undefined) obj.carID = carID
  if (volume !== undefined) obj.volume = volume
  if (price !== undefined) obj.price = price
  if (schoolID !== undefined) obj.schoolID = schoolID
  let { db } = req.app.locals
  CarFuelModel.updateCarFuel(db, carFuelID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update carFuel : _id = ${carFuelID}`,
          Date.now(),
          1,
          req.body,
          'carFuel',
          carFuelID,
        )
      }
    })
    .catch(next)
})

router.delete('/:carFuelID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carFuelID } = req.params
  let { db } = req.app.locals
  CarFuelModel.deleteCarFuel(db, carFuelID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete carFuel : _id = ${carFuelID}`,
          Date.now(),
          2,
          null,
          'carFuel',
          carFuelID,
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
  LogModel.getLogsByObjectType(db, 'carFuel', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:carFuelID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { carFuelID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'carFuel', carFuelID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

const express = require('express')
const router = express.Router()

const CarModel = require('./../models/Car')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { carModelID, status } = req.body
  let { db } = req.app.locals
  CarModel.createCar(db, carModelID, status)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create car : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'car',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  CarModel.getCars(db, 1, extra)
    .then((data) => {
      result.data = data
      return CarModel.countCars(db)
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
    CarModel.getCars(db, page, extra)
      .then((data) => {
        result.data = data
        return CarModel.countCars(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:carID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  CarModel.getCarByID(db, carID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:carID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carID } = req.params
  let { carModelID, status } = req.body
  let obj = {}
  if (carModelID !== undefined) obj.carModelID = carModelID
  if (status !== undefined) obj.status = status
  let { db } = req.app.locals
  CarModel.updateCar(db, carID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update car : _id = ${carID}`,
          Date.now(),
          1,
          req.body,
          'car',
          carID,
        )
      }
    })
    .catch(next)
})

router.delete('/:carID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carID } = req.params
  let { db } = req.app.locals
  CarModel.deleteCar(db, carID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete car : _id = ${carID}`,
          Date.now(),
          2,
          null,
          'car',
          carID,
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
  LogModel.getLogsByObjectType(db, 'car', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:carID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { carID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'car', carID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

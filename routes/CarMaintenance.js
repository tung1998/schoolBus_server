const express = require('express')
const router = express.Router()

const CarMaintenanceModel = require('./../models/CarMaintenance')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { carID, type, description, price } = req.body
  let { db } = req.app.locals
  CarMaintenanceModel.createCarMaintenance(db, carID, type, description, price)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create carMaintenance : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'carMaintenance',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  CarMaintenanceModel.getCarMaintenances(db, 1, extra)
    .then((data) => {
      result.data = data
      return CarMaintenanceModel.countCarMaintenances(db)
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
    CarMaintenanceModel.getCarMaintenances(db, page, extra)
      .then((data) => {
        result.data = data
        return CarMaintenanceModel.countCarMaintenances(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:carMaintenanceID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carMaintenanceID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  CarMaintenanceModel.getCarMaintenanceByID(db, carMaintenanceID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:carMaintenanceID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carMaintenanceID } = req.params
  let { carID, type, description, price } = req.body
  let obj = {}
  if (carID !== undefined) obj.carID = carID
  if (type !== undefined) obj.type = type
  if (description !== undefined) obj.description = description
  if (price !== undefined) obj.price = price
  let { db } = req.app.locals
  CarMaintenanceModel.updateCarMaintenance(db, carMaintenanceID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update carMaintenance : _id = ${carMaintenanceID}`,
          Date.now(),
          1,
          req.body,
          'carMaintenance',
          carMaintenanceID,
        )
      }
    })
    .catch(next)
})

router.delete('/:carMaintenanceID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carMaintenanceID } = req.params
  let { db } = req.app.locals
  CarMaintenanceModel.deleteCarMaintenance(db, carMaintenanceID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete carMaintenance : _id = ${carMaintenanceID}`,
          Date.now(),
          2,
          null,
          'carMaintenance',
          carMaintenanceID,
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
  LogModel.getLogsByObjectType(db, 'carMaintenance', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:carMaintenanceID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { carMaintenanceID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'carMaintenance', carMaintenanceID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

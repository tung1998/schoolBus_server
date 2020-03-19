const express = require('express')
const router = express.Router()

const CarModelModel = require('./../models/CarModel')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { brand, model, seatNumber, fuelType, fuelCapacity, maintenanceDay, maintenanceDistance } = req.body
  let schoolID = req.schoolID || req.body.schoolID
  let { db } = req.app.locals
  CarModelModel.createCarModel(db, brand, model, seatNumber, fuelType, fuelCapacity, maintenanceDay, maintenanceDistance, schoolID)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create carModel : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'carModel',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let limit = Number(req.query.limit)
  if (req.schoolID !== undefined) {
    let result = {}
    return CarModelModel.getCarModelsBySchool(db, req.schoolID, limit, 1)
      .then((data) => {
        result.data = data
        return CarModelModel.countCarModelsBySchool(db, req.schoolID)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  CarModelModel.getCarModels(db, limit, 1)
    .then((data) => {
      result.data = data
      return CarModelModel.countCarModels(db)
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
  let limit = Number(req.query.limit)
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Not Found' })
  else {
    if (req.schoolID !== undefined) {
      let result = {}
      return CarModelModel.getCarModelsBySchool(db, req.schoolID, limit, page)
        .then((data) => {
          result.data = data
          return CarModelModel.countCarModelsBySchool(db, req.schoolID)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    CarModelModel.getCarModels(db, limit, page)
      .then((data) => {
        result.data = data
        return CarModelModel.countCarModels(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:carModelID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carModelID } = req.params
  let { db } = req.app.locals
  CarModelModel.getCarModelByID(db, carModelID)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:carModelID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carModelID } = req.params
  let { brand, model, seatNumber, fuelType, fuelCapacity, maintenanceDay, maintenanceDistance, schoolID } = req.body
  let obj = {}
  if (brand !== undefined) obj.brand = brand
  if (model !== undefined) obj.model = model
  if (seatNumber !== undefined) obj.seatNumber = seatNumber
  if (fuelType !== undefined) obj.fuelType = fuelType
  if (fuelCapacity !== undefined) obj.fuelCapacity = fuelCapacity
  if (maintenanceDay !== undefined) obj.maintenanceDay = maintenanceDay
  if (maintenanceDistance !== undefined) obj.maintenanceDistance = maintenanceDistance
  if (schoolID !== undefined) obj.schoolID = schoolID
  let { db } = req.app.locals
  CarModelModel.updateCarModel(db, carModelID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update carModel : _id = ${carModelID}`,
          Date.now(),
          1,
          req.body,
          'carModel',
          carModelID,
        )
      }
    })
    .catch(next)
})

router.delete('/:carModelID([0-9a-fA-F]{24})', (req, res, next) => {
  let { carModelID } = req.params
  let { db } = req.app.locals
  CarModelModel.deleteCarModel(db, carModelID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete carModel : _id = ${carModelID}`,
          Date.now(),
          2,
          null,
          'carModel',
          carModelID,
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
  LogModel.getLogsByObjectType(db, 'carModel', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:carModelID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { carModelID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'carModel', carModelID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

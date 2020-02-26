const express = require('express')
const router = express.Router()

const RouteModel = require('./../models/Route')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { requireCarStop, pickupCarStop, takeoffCarStop, toll, carID, driverID, nannyID, studentIDs } = req.body
  let { db } = req.app.locals
  RouteModel.createRoute(db, requireCarStop, pickupCarStop, takeoffCarStop, toll, carID, driverID, nannyID, studentIDs)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create route : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'route',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  RouteModel.getRoutes(db, 1, extra)
    .then((data) => {
      result.data = data
      return RouteModel.countRoutes(db)
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
    RouteModel.getRoutes(db, page, extra)
      .then((data) => {
        result.data = data
        return RouteModel.countRoutes(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:routeID([0-9a-fA-F]{24})', (req, res, next) => {
  let { routeID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  RouteModel.getRouteByID(db, routeID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:routeID([0-9a-fA-F]{24})', (req, res, next) => {
  let { routeID } = req.params
  let { requireCarStop, pickupCarStop, takeoffCarStop, toll, carID, driverID, nannyID, studentIDs } = req.body
  let obj = {}
  if (requireCarStop !== undefined) obj.requireCarStop = requireCarStop
  if (pickupCarStop !== undefined) obj.pickupCarStop = pickupCarStop
  if (takeoffCarStop !== undefined) obj.takeoffCarStop = takeoffCarStop
  if (toll !== undefined) obj.toll = toll
  if (carID !== undefined) obj.carID = carID
  if (driverID !== undefined) obj.driverID = driverID
  if (nannyID !== undefined) obj.nannyID = nannyID
  if (studentIDs !== undefined) obj.studentIDs = studentIDs
  let { db } = req.app.locals
  RouteModel.updateRoute(db, routeID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update route : _id = ${routeID}`,
          Date.now(),
          1,
          req.body,
          'route',
          routeID,
        )
      }
    })
    .catch(next)
})

router.delete('/:routeID([0-9a-fA-F]{24})', (req, res, next) => {
  let { routeID } = req.params
  let { db } = req.app.locals
  RouteModel.deleteRoute(db, routeID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete route : _id = ${routeID}`,
          Date.now(),
          2,
          null,
          'route',
          routeID,
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
  LogModel.getLogsByObjectType(db, 'route', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:routeID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { routeID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'route', routeID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

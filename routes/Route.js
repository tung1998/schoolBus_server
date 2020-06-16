const express = require('express')
const router = express.Router()

const RouteModel = require('./../models/Route')
const StudentListModel = require('./../models/StudentList')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { startCarStopID, endCarStopID, toll, carID, driverID, nannyID, studentListID, name, startTime, schoolID, type } = req.body
  if (req.schoolID !== undefined) schoolID = req.schoolID
  let { db } = req.app.locals
  StudentListModel.getStudentListByID(db, studentListID, null)
    .then((v) => {
      let carStops = v !== null && Array.isArray(v.carStopIDs)
        ? v.carStopIDs.map(c => ({ carStopID: c, delayTime: null }))
        : []
      return RouteModel.createRoute(db, startCarStopID, endCarStopID, toll, carID, driverID, nannyID, studentListID, name, startTime, schoolID, carStops, type)
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
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { limit, extra, ...query } = req.query
  limit = Number(limit)
  if (req.schoolID !== undefined) {
    let result = {}
    return RouteModel.getRoutesBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return RouteModel.countRoutesBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  RouteModel.getRoutes(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return RouteModel.countRoutes(db, query)
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
      return RouteModel.getRoutesBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return RouteModel.countRoutesBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    RouteModel.getRoutes(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return RouteModel.countRoutes(db, query)
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
  let { startCarStopID, endCarStopID, toll, carID, driverID, nannyID, studentListID, name, startTime, schoolID, carStops, type } = req.body
  let obj = {}
  if (startCarStopID !== undefined) obj.startCarStopID = startCarStopID
  if (endCarStopID !== undefined) obj.endCarStopID = endCarStopID
  if (toll !== undefined) obj.toll = toll
  if (carID !== undefined) obj.carID = carID
  if (driverID !== undefined) obj.driverID = driverID
  if (nannyID !== undefined) obj.nannyID = nannyID
  if (studentListID !== undefined) obj.studentListID = studentListID
  if (name !== undefined) obj.name = name
  if (startTime !== undefined) obj.startTime = startTime
  if (schoolID !== undefined) obj.schoolID = schoolID
  if (carStops !== undefined) obj.carStops = carStops
  if (type !== undefined) obj.type = type
  let { db } = req.app.locals
  let p = Promise.resolve()
  if (studentListID !== undefined && carStops === undefined) {
    p = StudentListModel.getStudentListByID(db, studentListID, null)
      .then((v) => {
        if (v !== null && Array.isArray(v.carStopIDs)) {
          obj.carStops = v.carStopIDs.map(c => ({ carStopID: c, delayTime: null }))
        }
      })
  }
  p.then(() => {
    return RouteModel.updateRoute(db, routeID, obj)
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

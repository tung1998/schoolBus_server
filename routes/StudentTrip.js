const express = require('express')
const router = express.Router()

const StudentTripModel = require('./../models/StudentTrip')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { tripID, studentID, status, schoolID } = req.body
  if (req.schoolID !== undefined) schoolID = req.schoolID
  let { db } = req.app.locals
  StudentTripModel.createStudentTrip(db, tripID, studentID, status, schoolID)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create studentTrip : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'studentTrip',
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
    return StudentTripModel.getStudentTripsBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return StudentTripModel.countStudentTripsBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  StudentTripModel.getStudentTrips(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return StudentTripModel.countStudentTrips(db, query)
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
      return StudentTripModel.getStudentTripsBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return StudentTripModel.countStudentTripsBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    StudentTripModel.getStudentTrips(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return StudentTripModel.countStudentTrips(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:studentTripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { studentTripID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  StudentTripModel.getStudentTripByID(db, studentTripID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:studentTripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { studentTripID } = req.params
  let { tripID, studentID, status, schoolID } = req.body
  let obj = {}
  if (tripID !== undefined) obj.tripID = tripID
  if (studentID !== undefined) obj.studentID = studentID
  if (status !== undefined) obj.status = status
  if (schoolID !== undefined) obj.schoolID = schoolID
  let { db } = req.app.locals
  StudentTripModel.updateStudentTrip(db, studentTripID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update studentTrip : _id = ${studentTripID}`,
          Date.now(),
          1,
          req.body,
          'studentTrip',
          studentTripID,
        )
      }
    })
    .catch(next)
})

router.put('/:studentTripID([0-9a-fA-F]{24})/status', (req, res, next) => {
  let { studentTripID } = req.params
  let { status } = req.body
  let { db } = req.app.locals
  StudentTripModel.updateStudentTripStatus(db, studentTripID, status)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update studentTrip status : _id = ${studentTripID}`,
          Date.now(),
          1,
          req.body,
          'studentTrip',
          studentTripID,
        )
      }
    })
    .catch(next)
})

router.delete('/:studentTripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { studentTripID } = req.params
  let { db } = req.app.locals
  StudentTripModel.deleteStudentTrip(db, studentTripID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete studentTrip : _id = ${studentTripID}`,
          Date.now(),
          2,
          null,
          'studentTrip',
          studentTripID,
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
  LogModel.getLogsByObjectType(db, 'studentTrip', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:studentTripID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { studentTripID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'studentTrip', studentTripID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

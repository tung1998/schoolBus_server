const express = require('express')
const router = express.Router()

const StudentModel = require('./../models/Student')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { username, password, image, name, phone, email, address, IDStudent, classID, status, carStopID, schoolID, dateOfBirth } = req.body
  if (req.schoolID !== undefined) schoolID = req.schoolID
  let { db } = req.app.locals
  StudentModel.createStudent(db, username, password, image, name, phone, email, address, IDStudent, classID, status, carStopID, schoolID, dateOfBirth)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create student : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'student',
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
    return StudentModel.getStudentsBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return StudentModel.countStudentsBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  StudentModel.getStudents(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return StudentModel.countStudents(db, query)
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
      return StudentModel.getStudentsBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return StudentModel.countStudentsBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    StudentModel.getStudents(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return StudentModel.countStudents(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:studentID([0-9a-fA-F]{24})', (req, res, next) => {
  let { studentID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  StudentModel.getStudentByID(db, studentID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:studentID([0-9a-fA-F]{24})', (req, res, next) => {
  let { studentID } = req.params
  let { address, IDStudent, classID, status, carStopID, schoolID, image, name, phone, email, dateOfBirth } = req.body
  let obj = {}
  if (address !== undefined) obj.address = address
  if (IDStudent !== undefined) obj.IDStudent = IDStudent
  if (classID !== undefined) obj.classID = classID
  if (status !== undefined) obj.status = status
  if (carStopID !== undefined) obj.carStopID = carStopID
  if (schoolID !== undefined) obj.schoolID = schoolID
  let obj1 = {}
  if (image !== undefined) obj1.image = image
  if (name !== undefined) obj1.name = name
  if (phone !== undefined) obj1.phone = phone
  if (email !== undefined) obj1.email = email
  if (schoolID !== undefined) obj1.schoolID = schoolID
  if (dateOfBirth !== undefined) obj1.dateOfBirth = dateOfBirth
  let { db } = req.app.locals
  StudentModel.updateStudent(db, studentID, obj, obj1)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update student : _id = ${studentID}`,
          Date.now(),
          1,
          req.body,
          'student',
          studentID,
        )
      }
    })
    .catch(next)
})

router.delete('/:studentID([0-9a-fA-F]{24})', (req, res, next) => {
  let { studentID } = req.params
  let { db } = req.app.locals
  StudentModel.deleteStudent(db, studentID)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete student : _id = ${studentID}`,
          Date.now(),
          2,
          null,
          'student',
          studentID,
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
  LogModel.getLogsByObjectType(db, 'student', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:studentID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { studentID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'student', studentID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/byClass', (req, res, next) => {
  let { db } = req.app.locals
  let { classID, limit, page, extra, ...query } = req.query
  limit = Number(limit)
  page = Number(page) || 1
  StudentModel.getStudentsByClass(db, classID, query, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/byClassStatusInDate', (req, res, next) => {
  let { db } = req.app.locals
  let { classID, year, month, extra } = req.query
  year = Number(year)
  month = Number(month)
  StudentModel.getStudentsByClassStatusInDate(db, classID, year, month, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:studentID([0-9a-fA-F]{24})/tripInDateLog', (req, res, next) => {
  let { db } = req.app.locals
  let { studentID } = req.params
  let { date, extra } = req.query
  let [d, m, y] = date.split(/\//)
  date = new Date(Number(y), Number(m) - 1, Number(d))
  StudentModel.getTripsByStudentInDateLogs(db, studentID, date, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

const express = require('express')
const router = express.Router()

const StudentModel = require('./../models/Student')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { userID, address, IDStudent, name, classID, status } = req.body
  let { db } = req.app.locals
  StudentModel.createStudent(db, userID, address, IDStudent, name, classID, status)
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
  let { extra } = req.query
  let result = {}
  StudentModel.getStudents(db, 1, extra)
    .then((data) => {
      result.data = data
      return StudentModel.countStudents(db)
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
    StudentModel.getStudents(db, page, extra)
      .then((data) => {
        result.data = data
        return StudentModel.countStudents(db)
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
  let { address, IDStudent, name, classID, status } = req.body
  let obj = {}
  if (address !== undefined) obj.address = address
  if (IDStudent !== undefined) obj.IDStudent = IDStudent
  if (name !== undefined) obj.name = name
  if (classID !== undefined) obj.classID = classID
  if (status !== undefined) obj.status = status
  let { db } = req.app.locals
  StudentModel.updateStudent(db, studentID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
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

module.exports = router

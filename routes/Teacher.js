const express = require('express')
const router = express.Router()

const TeacherModel = require('./../models/Teacher')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { schoolID, name } = req.body
  let { db } = req.app.locals
  TeacherModel.createTeacher(db, schoolID, name)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create teacher : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'teacher',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  TeacherModel.getTeachers(db, 1, extra)
    .then((data) => {
      result.data = data
      return TeacherModel.countTeachers(db)
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
    TeacherModel.getTeachers(db, page, extra)
      .then((data) => {
        result.data = data
        return TeacherModel.countTeachers(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:teacherID([0-9a-fA-F]{24})', (req, res, next) => {
  let { teacherID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  TeacherModel.getTeacherByID(db, teacherID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:teacherID([0-9a-fA-F]{24})', (req, res, next) => {
  let { teacherID } = req.params
  let { schoolID, name } = req.body
  let obj = {}
  if (schoolID !== undefined) obj.schoolID = schoolID
  if (name !== undefined) obj.name = name
  let { db } = req.app.locals
  TeacherModel.updateTeacher(db, teacherID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update teacher : _id = ${teacherID}`,
          Date.now(),
          1,
          req.body,
          'teacher',
          teacherID,
        )
      }
    })
    .catch(next)
})

router.delete('/:teacherID([0-9a-fA-F]{24})', (req, res, next) => {
  let { teacherID } = req.params
  let { db } = req.app.locals
  TeacherModel.deleteTeacher(db, teacherID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete teacher : _id = ${teacherID}`,
          Date.now(),
          2,
          null,
          'teacher',
          teacherID,
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
  LogModel.getLogsByObjectType(db, 'teacher', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:teacherID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { teacherID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'teacher', teacherID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router
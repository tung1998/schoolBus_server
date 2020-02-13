const express = require('express')
const router = express.Router()

const StudentListModel = require('./../models/StudentList')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { name, studentIDs } = req.body
  let { db } = req.app.locals
  StudentListModel.createStudentList(db, name, studentIDs)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create studentList : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'studentList',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let result = {}
  StudentListModel.getStudentLists(db, 1)
    .then((data) => {
      result.data = data
      return StudentListModel.countStudentLists(db)
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
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Page not found' })
  else {
    let result = {}
    StudentListModel.getStudentLists(db, page)
      .then((data) => {
        result.data = data
        return StudentListModel.countStudentLists(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:studentListID([0-9a-fA-F]{24})', (req, res, next) => {
  let { studentListID } = req.params
  let { db } = req.app.locals
  StudentListModel.getStudentListByID(db, studentListID)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:studentListID([0-9a-fA-F]{24})', (req, res, next) => {
  let { studentListID } = req.params
  let { name, studentIDs } = req.body
  let obj = {}
  if (name !== undefined) obj.name = name
  if (studentIDs !== undefined) obj.studentIDs = studentIDs
  let { db } = req.app.locals
  StudentListModel.updateStudentList(db, studentListID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update studentList : _id = ${studentListID}`,
          Date.now(),
          1,
          req.body,
          'studentList',
          studentListID,
        )
      }
    })
    .catch(next)
})

router.delete('/:studentListID([0-9a-fA-F]{24})', (req, res, next) => {
  let { studentListID } = req.params
  let { db } = req.app.locals
  StudentListModel.deleteStudentList(db, studentListID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete studentList : _id = ${studentListID}`,
          Date.now(),
          2,
          null,
          'studentList',
          studentListID,
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
  LogModel.getLogsByObjectType(db, 'studentList', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:studentListID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { studentListID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'studentList', studentListID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

const express = require('express')
const router = express.Router()

const { ObjectID } = require('mongodb')
const StudentListModel = require('./../models/StudentList')
const StudentModel = require('./../models/Student')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { name, studentIDs = [] } = req.body
  let { db } = req.app.locals
  StudentModel.getStudentsCarStopIDs(db, studentIDs)
    .then((carStopIDs) => {
      return StudentListModel.createStudentList(db, name, studentIDs, carStopIDs)
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
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  StudentListModel.getStudentLists(db, 1, extra)
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
  let { extra } = req.query
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Not Found' })
  else {
    let result = {}
    StudentListModel.getStudentLists(db, page, extra)
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
  let { extra } = req.query
  StudentListModel.getStudentListByID(db, studentListID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:studentListID([0-9a-fA-F]{24})', (req, res, next) => {
  let { db } = req.app.locals
  let { studentListID } = req.params
  let { name, studentIDs, carStopIDs } = req.body
  let obj = {}
  if (name !== undefined) obj.name = name
  if (studentIDs !== undefined) obj.studentIDs = studentIDs
  if (carStopIDs !== undefined) obj.carStopIDs = carStopIDs
  let p = Promise.resolve()
  if (studentIDs !== undefined && carStopIDs === undefined) {
    p = StudentModel.getStudentsCarStopIDs(db, studentIDs)
      .then((v) => {
        obj.carStopIDs = v
      })
  }
  p
    .then(() => {
      return StudentListModel.updateStudentList(db, studentListID, obj)
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

router.put('/:studentListID([0-9a-fA-F]{24})/studentIDs/add', (req, res, next) => {
  let { studentListID } = req.params
  let { studentIDs } = req.body
  if (!Array.isArray(studentIDs)) studentIDs = [studentIDs]
  let { db } = req.app.locals
  Promise.all([
    StudentListModel.getStudentListByID(db, studentListID, null),
    StudentModel.getStudentsByIDs(db, studentIDs.map(ObjectID), null),
  ])
    .then(([v, students]) => {
      if (v === null) return res.status(404).send({ message: 'Not Found' })
      let obj = { studentIDs: v.studentIDs, carStopIDs: v.carStopIDs }
      studentIDs.forEach((e) => {
        if (!obj.studentIDs.includes(e)) {
          obj.studentIDs.push(e)
          if (students[e] != null && students[e].carStopID != null && !obj.carStopIDs.includes(students[e].carStopID)) {
            obj.carStopIDs.push(students[e].carStopID)
          }
        }
      })
      return StudentListModel.updateStudentList(db, studentListID, obj)
        .then(({ matchedCount }) => {
          if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
          else {
            res.send()
            return LogModel.createLog(
              db,
              req.token ? req.token.userID : null,
              req.headers['user-agent'],
              req.ip,
              `Update studentList add studentIDs : _id = ${studentListID}`,
              Date.now(),
              1,
              req.body,
              'studentList',
              studentListID,
            )
          }
        })
    })
    .catch(next)
})

router.put('/:studentListID([0-9a-fA-F]{24})/studentIDs/remove', (req, res, next) => {
  let { studentListID } = req.params
  let { studentIDs } = req.body
  let { db } = req.app.locals
  StudentListModel.getStudentListByID(db, studentListID, 'student')
    .then((v) => {
      if (v === null) return res.status(404).send({ message: 'Not Found' })
      studentIDs = Array.isArray(studentIDs) ? studentIDs.reduce((a, c) => ({ ...a, [c]: null }), {}) : { [studentIDs]: null }
      let carStopIDs = {}
      let obj = {}
      obj.studentIDs = v.studentIDs.filter((e, i) => {
        if (e in studentIDs) return false
        if (v.students[i] != null && v.students[i].carStopID != null) carStopIDs[v.students[i].carStopID] = null
        return true
      })
      obj.carStopIDs = v.carStopIDs.filter(e => e in carStopIDs)
      return StudentListModel.updateStudentList(db, studentListID, obj)
        .then(({ matchedCount }) => {
          if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
          else {
            res.send()
            return LogModel.createLog(
              db,
              req.token ? req.token.userID : null,
              req.headers['user-agent'],
              req.ip,
              `Update studentList remove studentIDs : _id = ${studentListID}`,
              Date.now(),
              1,
              req.body,
              'studentList',
              studentListID,
            )
          }
        })
    })
    .catch(next)
})

module.exports = router

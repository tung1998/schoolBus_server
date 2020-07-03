const express = require('express')
const router = express.Router()

const ParentRequestModel = require('./../models/ParentRequest')
const StudentModel = require('./../models/Student')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { studentID, tripID, time, type, status, parentID, teacherID, note, schoolID } = req.body
  if (req.parentID !== undefined) parentID = req.parentID
  if (req.schoolID !== undefined) schoolID = req.schoolID
  let { db } = req.app.locals
  StudentModel.getStudentByID(db, studentID, 'class')
    .then((v) => {
      if (teacherID === undefined) {
        teacherID = v && v.class && v.class.teacherID
      }
      return ParentRequestModel.createParentRequest(db, studentID, tripID, time, type, status, parentID, teacherID, note, schoolID)
        .then(({ insertedId }) => {
          res.send({ _id: insertedId })
          return LogModel.createLog(
            db,
            req.token ? req.token.userID : null,
            req.headers['user-agent'],
            req.ip,
            `Create parentRequest : _id = ${insertedId}`,
            Date.now(),
            0,
            req.body,
            'parentRequest',
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
  if (req.parentID !== undefined) {
    let result = {}
    return ParentRequestModel.getParentRequestsByParent(db, req.parentID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return ParentRequestModel.countParentRequestsByParent(db, req.parentID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  if (req.teacherID !== undefined) {
    let result = {}
    return ParentRequestModel.getParentRequestsByTeacher(db, req.teacherID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return ParentRequestModel.countParentRequestsByTeacher(db, req.teacherID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  if (req.schoolID !== undefined) {
    let result = {}
    return ParentRequestModel.getParentRequestsBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return ParentRequestModel.countParentRequestsBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  ParentRequestModel.getParentRequests(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return ParentRequestModel.countParentRequests(db, query)
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
    if (req.parentID !== undefined) {
      let result = {}
      return ParentRequestModel.getParentRequestsByParent(db, req.parentID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return ParentRequestModel.countParentRequestsByParent(db, req.parentID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    if (req.teacherID !== undefined) {
      let result = {}
      return ParentRequestModel.getParentRequestsByTeacher(db, req.teacherID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return ParentRequestModel.countParentRequestsByTeacher(db, req.teacherID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    if (req.schoolID !== undefined) {
      let result = {}
      return ParentRequestModel.getParentRequestsBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return ParentRequestModel.countParentRequestsBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    ParentRequestModel.getParentRequests(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return ParentRequestModel.countParentRequests(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:parentRequestID([0-9a-fA-F]{24})', (req, res, next) => {
  let { parentRequestID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  ParentRequestModel.getParentRequestByID(db, parentRequestID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:parentRequestID([0-9a-fA-F]{24})', (req, res, next) => {
  let { parentRequestID } = req.params
  let { studentID, tripID, time, type, status, parentID, teacherID, note, schoolID } = req.body
  let obj = {}
  if (studentID !== undefined) obj.studentID = studentID
  if (tripID !== undefined) obj.tripID = tripID
  if (time !== undefined) obj.time = time
  if (type !== undefined) obj.type = type
  if (status !== undefined) obj.status = status
  if (parentID !== undefined) obj.parentID = parentID
  if (teacherID !== undefined) obj.teacherID = teacherID
  if (note !== undefined) obj.note = note
  if (schoolID !== undefined) obj.schoolID = schoolID
  let { db } = req.app.locals
  ParentRequestModel.updateParentRequest(db, parentRequestID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update parentRequest : _id = ${parentRequestID}`,
          Date.now(),
          1,
          req.body,
          'parentRequest',
          parentRequestID,
        )
      }
    })
    .catch(next)
})

router.delete('/:parentRequestID([0-9a-fA-F]{24})', (req, res, next) => {
  let { parentRequestID } = req.params
  let { db } = req.app.locals
  ParentRequestModel.deleteParentRequest(db, parentRequestID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete parentRequest : _id = ${parentRequestID}`,
          Date.now(),
          2,
          null,
          'parentRequest',
          parentRequestID,
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
  LogModel.getLogsByObjectType(db, 'parentRequest', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:parentRequestID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { parentRequestID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'parentRequest', parentRequestID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.put('/:parentRequestID([0-9a-fA-F]{24})/confirm', (req, res, next) => {
  let { parentRequestID } = req.params
  let { db } = req.app.locals
  ParentRequestModel.confirmParentRequest(db, parentRequestID)
    .then(({ lastErrorObject: { updatedExisting }, value }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Confirm parentRequest : _id = ${parentRequestID}`,
          Date.now(),
          1,
          req.body,
          'parentRequest',
          parentRequestID,
        )
      }
    })
    .catch(next)
})

module.exports = router

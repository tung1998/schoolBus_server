const express = require('express')
const router = express.Router()

const ClassModel = require('./../models/Class')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { name, schoolID, teacherID } = req.body
  let { db } = req.app.locals
  ClassModel.createClass(db, name, schoolID, teacherID)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create class : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'class',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  ClassModel.getClasses(db, 1, extra)
    .then((data) => {
      result.data = data
      return ClassModel.countClasses(db)
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
    ClassModel.getClasses(db, page, extra)
      .then((data) => {
        result.data = data
        return ClassModel.countClasses(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:classID([0-9a-fA-F]{24})', (req, res, next) => {
  let { classID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  ClassModel.getClassByID(db, classID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:classID([0-9a-fA-F]{24})', (req, res, next) => {
  let { classID } = req.params
  let { name, schoolID, teacherID } = req.body
  let obj = {}
  if (name !== undefined) obj.name = name
  if (schoolID !== undefined) obj.schoolID = schoolID
  if (teacherID !== undefined) obj.teacherID = teacherID
  let { db } = req.app.locals
  ClassModel.updateClass(db, classID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update class : _id = ${classID}`,
          Date.now(),
          1,
          req.body,
          'class',
          classID,
        )
      }
    })
    .catch(next)
})

router.delete('/:classID([0-9a-fA-F]{24})', (req, res, next) => {
  let { classID } = req.params
  let { db } = req.app.locals
  ClassModel.deleteClass(db, classID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete class : _id = ${classID}`,
          Date.now(),
          2,
          null,
          'class',
          classID,
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
  LogModel.getLogsByObjectType(db, 'class', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:classID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { classID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'class', classID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router
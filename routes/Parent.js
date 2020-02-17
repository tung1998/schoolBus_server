const express = require('express')
const router = express.Router()

const ParentModel = require('./../models/Parent')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { userID, studentID } = req.body
  let { db } = req.app.locals
  ParentModel.createParent(db, userID, studentID)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create parent : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'parent',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  ParentModel.getParents(db, 1, extra)
    .then((data) => {
      result.data = data
      return ParentModel.countParents(db)
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
    ParentModel.getParents(db, page, extra)
      .then((data) => {
        result.data = data
        return ParentModel.countParents(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:parentID([0-9a-fA-F]{24})', (req, res, next) => {
  let { parentID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  ParentModel.getParentByID(db, parentID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:parentID([0-9a-fA-F]{24})', (req, res, next) => {
  let { parentID } = req.params
  let { studentID } = req.body
  let obj = {}
  if (studentID !== undefined) obj.studentID = studentID
  let { db } = req.app.locals
  ParentModel.updateParent(db, parentID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update parent : _id = ${parentID}`,
          Date.now(),
          1,
          req.body,
          'parent',
          parentID,
        )
      }
    })
    .catch(next)
})

router.delete('/:parentID([0-9a-fA-F]{24})', (req, res, next) => {
  let { parentID } = req.params
  let { db } = req.app.locals
  ParentModel.deleteParent(db, parentID)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete parent : _id = ${parentID}`,
          Date.now(),
          2,
          null,
          'parent',
          parentID,
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
  LogModel.getLogsByObjectType(db, 'parent', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:parentID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { parentID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'parent', parentID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

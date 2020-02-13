const express = require('express')
const router = express.Router()

const ParentRequestModel = require('./../models/ParentRequest')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { requestID, studentID, content, approve } = req.body
  let { db } = req.app.locals
  ParentRequestModel.createParentRequest(db, requestID, studentID, content, approve)
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
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  ParentRequestModel.getParentRequests(db, 1, extra)
    .then((data) => {
      result.data = data
      return ParentRequestModel.countParentRequests(db)
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
    ParentRequestModel.getParentRequests(db, page, extra)
      .then((data) => {
        result.data = data
        return ParentRequestModel.countParentRequests(db)
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
  let { requestID, studentID, content, approve } = req.body
  let obj = {}
  if (requestID !== undefined) obj.requestID = requestID
  if (studentID !== undefined) obj.studentID = studentID
  if (content !== undefined) obj.content = content
  if (approve !== undefined) obj.approve = approve
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

module.exports = router

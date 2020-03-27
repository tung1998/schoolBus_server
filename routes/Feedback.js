const express = require('express')
const router = express.Router()

const FeedbackModel = require('./../models/Feedback')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { userID, type, title, content, status, schoolID } = req.body
  if (req.userID !== undefined) userID = req.userID
  if (req.schoolID !== undefined) schoolID = req.schoolID
  let { db } = req.app.locals
  FeedbackModel.createFeedback(db, userID, type, title, content, status, schoolID)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create feedback : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'feedback',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { limit, extra, ...query } = req.query
  limit = Number(limit)
  if (req.userID !== undefined) {
    let result = {}
    return FeedbackModel.getFeedbacksByUser(db, req.userID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return FeedbackModel.countFeedbacksByUser(db, req.userID, query)
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
    return FeedbackModel.getFeedbacksBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return FeedbackModel.countFeedbacksBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  FeedbackModel.getFeedbacks(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return FeedbackModel.countFeedbacks(db, query)
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
    if (req.userID !== undefined) {
      let result = {}
      return FeedbackModel.getFeedbacksByUser(db, req.userID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return FeedbackModel.countFeedbacksByUser(db, req.userID, query)
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
      return FeedbackModel.getFeedbacksBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return FeedbackModel.countFeedbacksBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    FeedbackModel.getFeedbacks(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return FeedbackModel.countFeedbacks(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:feedbackID([0-9a-fA-F]{24})', (req, res, next) => {
  let { feedbackID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  FeedbackModel.getFeedbackByID(db, feedbackID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:feedbackID([0-9a-fA-F]{24})', (req, res, next) => {
  let { feedbackID } = req.params
  let { userID, type, title, content, status, schoolID } = req.body
  let obj = {}
  if (userID !== undefined) obj.userID = userID
  if (type !== undefined) obj.type = type
  if (title !== undefined) obj.title = title
  if (content !== undefined) obj.content = content
  if (status !== undefined) obj.status = status
  if (schoolID !== undefined) obj.schoolID = schoolID
  let { db } = req.app.locals
  FeedbackModel.updateFeedback(db, feedbackID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update feedback : _id = ${feedbackID}`,
          Date.now(),
          1,
          req.body,
          'feedback',
          feedbackID,
        )
      }
    })
    .catch(next)
})

router.put('/:feedbackID([0-9a-fA-F]{24})/response', (req, res, next) => {
  let { feedbackID } = req.params
  let { responseContent } = req.body
  let responseUserID = req.token && req.token.userID
  let { db } = req.app.locals
  FeedbackModel.updateFeedbackResponse(db, feedbackID, responseUserID, responseContent)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update feedback response: _id = ${feedbackID}`,
          Date.now(),
          1,
          req.body,
          'feedback',
          feedbackID,
        )
      }
    })
    .catch(next)
})

router.delete('/:feedbackID([0-9a-fA-F]{24})', (req, res, next) => {
  let { feedbackID } = req.params
  let { db } = req.app.locals
  FeedbackModel.deleteFeedback(db, feedbackID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete feedback : _id = ${feedbackID}`,
          Date.now(),
          2,
          null,
          'feedback',
          feedbackID,
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
  LogModel.getLogsByObjectType(db, 'feedback', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:feedbackID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { feedbackID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'feedback', feedbackID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

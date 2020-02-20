const express = require('express')
const router = express.Router()

const FeedbackModel = require('./../models/Feedback')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { userID, type, feedback } = req.body
  let { db } = req.app.locals
  FeedbackModel.createFeedback(db, userID, type, feedback)
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
  let { extra } = req.query
  let result = {}
  FeedbackModel.getFeedbacks(db, 1, extra)
    .then((data) => {
      result.data = data
      return FeedbackModel.countFeedbacks(db)
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
    FeedbackModel.getFeedbacks(db, page, extra)
      .then((data) => {
        result.data = data
        return FeedbackModel.countFeedbacks(db)
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
  let { userID, type, feedback } = req.body
  let obj = {}
  if (userID !== undefined) obj.userID = userID
  if (type !== undefined) obj.type = type
  if (feedback !== undefined) obj.feedback = feedback
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
  let { response } = req.body
  let responseBy = req.token != null ? req.token.userID : null
  let { db } = req.app.locals
  FeedbackModel.updateFeedbackResponse(db, feedbackID, responseBy, response)
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

const express = require('express')
const router = express.Router()

const SMSModel = require('./../models/SMS')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { userID, phoneNumber, content, status, price } = req.body
  let { db } = req.app.locals
  SMSModel.createSMS(db, userID, phoneNumber, content, status, price)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create SMS : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'SMS',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  SMSModel.getSMS(db, 1, extra)
    .then((data) => {
      result.data = data
      return SMSModel.countSMS(db)
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
    SMSModel.getSMS(db, page, extra)
      .then((data) => {
        result.data = data
        return SMSModel.countSMS(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:SMSID([0-9a-fA-F]{24})', (req, res, next) => {
  let { SMSID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  SMSModel.getSMSByID(db, SMSID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:SMSID([0-9a-fA-F]{24})', (req, res, next) => {
  let { SMSID } = req.params
  let { userID, phoneNumber, content, status, price } = req.body
  let obj = {}
  if (userID !== undefined) obj.userID = userID
  if (phoneNumber !== undefined) obj.phoneNumber = phoneNumber
  if (content !== undefined) obj.content = content
  if (status !== undefined) obj.status = status
  if (price !== undefined) obj.price = price
  let { db } = req.app.locals
  SMSModel.updateSMS(db, SMSID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update SMS : _id = ${SMSID}`,
          Date.now(),
          1,
          req.body,
          'SMS',
          SMSID,
        )
      }
    })
    .catch(next)
})

router.delete('/:SMSID([0-9a-fA-F]{24})', (req, res, next) => {
  let { SMSID } = req.params
  let { db } = req.app.locals
  SMSModel.deleteSMS(db, SMSID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete SMS : _id = ${SMSID}`,
          Date.now(),
          2,
          null,
          'SMS',
          SMSID,
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
  LogModel.getLogsByObjectType(db, 'SMS', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:SMSID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { SMSID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'SMS', SMSID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

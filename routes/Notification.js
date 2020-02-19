const express = require('express')
const router = express.Router()

const NotificationModel = require('./../models/Notification')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { type, userID, title, content, status } = req.body
  let createdBy = (req.token) ? req.token.userID : null
  let { db } = req.app.locals
  NotificationModel.createNotification(db, type, userID, title, content, status, createdBy)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create notification : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'notification',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  let page = 1
  if (req.token && req.token.type !== 0) {
    NotificationModel.getNotificationsByUser(db, String(req.token.userID), page, extra)
      .then((data) => {
        result.data = data
        return NotificationModel.countNotificationsByUser(db, String(req.token.userID))
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  } else {
    NotificationModel.getNotifications(db, page, extra)
      .then((data) => {
        result.data = data
        return NotificationModel.countNotifications(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:page(\\d+)', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Not Found' })
  else {
    let result = {}
    NotificationModel.getNotifications(db, page, extra)
      .then((data) => {
        result.data = data
        return NotificationModel.countNotifications(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:notificationID([0-9a-fA-F]{24})', (req, res, next) => {
  let { notificationID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  NotificationModel.getNotificationByID(db, notificationID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:notificationID([0-9a-fA-F]{24})', (req, res, next) => {
  let { notificationID } = req.params
  let { type, userID, title, content, status, createdBy } = req.body
  let obj = {}
  if (type !== undefined) obj.type = type
  if (userID !== undefined) obj.userID = userID
  if (title !== undefined) obj.title = title
  if (content !== undefined) obj.content = content
  if (status !== undefined) obj.status = status
  if (createdBy !== undefined) obj.createdBy = createdBy
  let { db } = req.app.locals
  NotificationModel.updateNotification(db, notificationID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update notification : _id = ${notificationID}`,
          Date.now(),
          1,
          req.body,
          'notification',
          notificationID,
        )
      }
    })
    .catch(next)
})

router.delete('/:notificationID([0-9a-fA-F]{24})', (req, res, next) => {
  let { notificationID } = req.params
  let { db } = req.app.locals
  NotificationModel.deleteNotification(db, notificationID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete notification : _id = ${notificationID}`,
          Date.now(),
          2,
          null,
          'notification',
          notificationID,
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
  LogModel.getLogsByObjectType(db, 'notification', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:notificationID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { notificationID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'notification', notificationID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/getByUser/:page(\\d+)', (req, res, next) => {
  let extra = req.query.extra
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Not Found' })
  else {
    let userID = req.query.userID
    let db = req.app.locals.db
    NotificationModel.getNotificationsByUser(db, userID, page, extra)
      .then(Notifications => res.send(Notifications))
      .catch(next)
  }
})

router.get('/unread/getByUser/:page(\\d+)', (req, res, next) => {
  let extra = req.query.extra
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Not Found' })
  else {
    let userID = req.query.userID
    let db = req.app.locals.db
    NotificationModel.getUnreadNotificationsByUser(db, userID, page, extra)
      .then(Notifications => res.send(Notifications))
      .catch(next)
  }
})

router.put('/:notificationID([0-9a-fA-F]{24})/status', (req, res, next) => {
  let { notificationID } = req.params
  let { status } = req.body
  let { db } = req.app.locals
  NotificationModel.updateNotificationStatus(db, notificationID, status)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update notification status : _id = ${notificationID}`,
          Date.now(),
          1,
          req.body,
          'notification',
          notificationID,
        )
      }
    })
    .catch(next)
})

router.get('/filter', (req, res, next) => {
  let { db } = req.app.locals
  let { userID } = req.token
  let { sortBy, sortType, limit, page, extra } = req.query
  if (limit !== undefined) limit = Number(limit)
  if (page !== undefined) page = Number(page)
  NotificationModel.filterNotifications(db, userID, sortBy, sortType, limit, page, extra)
    .then((value) => {
      res.send(value)
    })
    .catch(next)
})

router.put('/', (req, res, next) => {
  let { db } = req.app.locals
  let notifications = req.body
  let arr = notifications.map(({ _id, ...obj }) => (
    NotificationModel.updateNotification(db, _id, obj)
      .then(({ matchedCount }) => {
        if (matchedCount === 1) {
          LogModel.createLog(
            db,
            req.token ? req.token.userID : null,
            req.headers['user-agent'],
            req.ip,
            `Update Notification : _id = ${_id}`,
            Date.now(),
            1,
            obj,
            'notification',
            _id,
          )
          return { _id, message: 'OK' }
        }
        return { _id, message: 'Not Found' }
      })
  ))
  Promise.all(arr)
    .then((value) => {
      res.send(value)
    })
    .catch(next)
})

module.exports = router

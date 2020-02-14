const express = require('express')
const router = express.Router()

const UserModel = require('./../models/User')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { username, password, image, name, phone, email, userType } = req.body
  let { db } = req.app.locals
  UserModel.createUser(db, username, password, image, name, phone, email, userType)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create user : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'user',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let result = {}
  UserModel.getUsers(db, 1)
    .then((data) => {
      result.data = data
      return UserModel.countUsers(db)
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
    UserModel.getUsers(db, page)
      .then((data) => {
        result.data = data
        return UserModel.countUsers(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:userID([0-9a-fA-F]{24})', (req, res, next) => {
  let { userID } = req.params
  let { db } = req.app.locals
  UserModel.getUserByID(db, userID)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:userID([0-9a-fA-F]{24})', (req, res, next) => {
  let { userID } = req.params
  let { image, name, phone, email } = req.body
  let obj = {}
  if (image !== undefined) obj.image = image
  if (name !== undefined) obj.name = name
  if (phone !== undefined) obj.phone = phone
  if (email !== undefined) obj.email = email
  let { db } = req.app.locals
  UserModel.updateUser(db, userID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update user : _id = ${userID}`,
          Date.now(),
          1,
          req.body,
          'user',
          userID,
        )
      }
    })
    .catch(next)
})

router.delete('/:userID([0-9a-fA-F]{24})', (req, res, next) => {
  let { userID } = req.params
  let { db } = req.app.locals
  UserModel.deleteUser(db, userID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete user : _id = ${userID}`,
          Date.now(),
          2,
          null,
          'user',
          userID,
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
  LogModel.getLogsByObjectType(db, 'user', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:userID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { userID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'user', userID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.put('/:userID([0-9a-fA-F]{24})/block', (req, res, next) => {
  let { userID } = req.params
  let { blockedReason } = req.body
  let blockedBy = req.token ? req.token.userID : null
  let { db } = req.app.locals
  UserModel.blockUser(db, userID, blockedBy, blockedReason)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send({ error: false, message: 'Block success' })
        return LogModel.createLog(
          db,
          blockedBy,
          req.headers['user-agent'],
          req.ip,
          `Block user : _id = ${userID}`,
          Date.now(),
          1,
          req.body,
          'user',
          userID,
        )
      }
    })
    .catch(next)
})

router.put('/:userID([0-9a-fA-F]{24})/unblock', (req, res, next) => {
  let { userID } = req.params
  let { db } = req.app.locals
  UserModel.unblockUser(db, userID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send({ error: false, message: 'UnBlock success' })
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Unblock user : _id = ${userID}`,
          Date.now(),
          1,
          null,
          'user',
          userID,
        )
      }
    })
    .catch(next)
})

router.put('/password', (req, res, next) => {
  let { userID } = req.token
  let { password } = req.body
  let { db } = req.app.locals
  UserModel.updateUserPassword(db, userID, password)
    .then(() => {
      res.send()
      return LogModel.createLog(
        db,
        userID,
        req.headers['user-agent'],
        req.ip,
        `Update user password : _id = ${userID}`,
        Date.now(),
        1,
        req.body,
        'user',
        userID,
      )
    })
    .catch(next)
})

router.put('/:userID([0-9a-fA-F]{24})/password', (req, res, next) => {
  let { userID } = req.params
  let { password } = req.body
  let { db } = req.app.locals
  UserModel.updateUserPassword(db, userID, password)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update user password : _id = ${userID}`,
          Date.now(),
          1,
          req.body,
          'user',
          userID,
        )
      }
    })
    .catch(next)
})

module.exports = router

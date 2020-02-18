const express = require('express')
const router = express.Router()
const {
  deleteTokensByID,
  deleteTokensByToken,
  getAccessTokens,
  getTokens,
  getTokenByUserID,
  getTokenByID
} = require('./../models/Token')

router.delete('/byID', (req, res, next) => {
  const {
    db
  } = req.app.locals
  const {
    _id
  } = req.body
  deleteTokensByID(db, _id)
    .then(() => res.send())
    .catch(next)
})

router.delete('/byToken', (req, res, next) => {
  const {
    db
  } = req.app.locals
  const {
    token
  } = req.body
  deleteTokensByID(db, token)
    .then(() => res.send())
    .catch(next)
})

router.delete('/logout', (req, res, next) => {
  const {
    db
  } = req.app.locals
  let token =req.token;
  deleteTokensByID(db, token._id)
    .then(() => res.send({message: 'success'}))
    .catch(next)
})

router.get('/:id([0-9a-fA-F]{24})', (req, res, next) => {
  const {
    db
  } = req.app.locals
  let {
    id
  } = req.params
  getTokenByID(db, id)
    .then(result => {
      if (!result) res.status(404).send({
        message: 'Not found'
      })
      else res.send(result)
    })
    .catch(next)
})

router.get('/byUser/:userID([0-9a-fA-F]{24})', (req, res, next) => {
  const {
    db
  } = req.app.locals
  let {
    userID
  } = req.params
  getTokenByUserID(db, userID)
    .then(result => {
      if (result && result.length) res.send(result)
      else res.status(404).send({
        message: 'Not found'
      })
    })
    .catch(next)
})

router.get('/access_token', (req, res, next) => {
  let {
    db
  } = req.app.locals
  let {
    userType,
    userPhone
  } = req.query
  userType = Number(userType)
  getAccessTokens(db, userType, userPhone)
    .then((value) => {
      if (value === null) res.status(400).send({
        message: 'not found'
      })
      else res.send(value)
    })
    .catch(next)
})

router.get('/filter', (req, res, next) => {
  let {
    db
  } = req.app.locals
  let {
    userID,
    username,
    type,
    expires_at_start,
    expires_at_end,
    phone,
    sortBy,
    sortType,
    limit,
    page,
  } = req.query
  if (type !== undefined) {
    type = type.split(',').map(Number)
  }
  if (limit !== undefined) {
    limit = Number(limit)
  }
  if (page !== undefined) {
    page = Number(page)
  }
  getTokens(db, userID, username, type, expires_at_start, expires_at_end, phone, sortBy, sortType, limit, page)
    .then((value) => {
      res.send(value)
    })
    .catch(next)
})

module.exports = router

const express = require('express')
const router = express.Router()

const LogModel = require('./../models/Log')

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { extra } = req.query
  let result = {}
  LogModel.getLogs(db, 1, extra)
    .then((data) => {
      result.data = data
      return LogModel.countLogs(db)
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
    LogModel.getLogs(db, page, extra)
      .then((data) => {
        result.data = data
        return LogModel.countLogs(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:logID([0-9a-fA-F]{24})', (req, res, next) => {
  let { logID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  LogModel.getLogByID(db, logID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

module.exports = router

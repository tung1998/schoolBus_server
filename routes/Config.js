const express = require('express')
const router = express.Router()

const ConfigModel = require('./../models/Config')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { name, value } = req.body
  let { db } = req.app.locals
  ConfigModel.createConfig(db, name, value)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create config : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'config',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let result = {}
  ConfigModel.getConfigs(db, 1)
    .then((data) => {
      result.data = data
      return ConfigModel.countConfigs(db)
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
    ConfigModel.getConfigs(db, page)
      .then((data) => {
        result.data = data
        return ConfigModel.countConfigs(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:configID([0-9a-fA-F]{24})', (req, res, next) => {
  let { configID } = req.params
  let { db } = req.app.locals
  ConfigModel.getConfigByID(db, configID)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:configID([0-9a-fA-F]{24})', (req, res, next) => {
  let { configID } = req.params
  let { name, value } = req.body
  let obj = {}
  if (name !== undefined) obj.name = name
  if (value !== undefined) obj.value = value
  let { db } = req.app.locals
  ConfigModel.updateConfig(db, configID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update config : _id = ${configID}`,
          Date.now(),
          1,
          req.body,
          'config',
          configID,
        )
      }
    })
    .catch(next)
})

router.delete('/:configID([0-9a-fA-F]{24})', (req, res, next) => {
  let { configID } = req.params
  let { db } = req.app.locals
  ConfigModel.deleteConfig(db, configID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete config : _id = ${configID}`,
          Date.now(),
          2,
          null,
          'config',
          configID,
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
  LogModel.getLogsByObjectType(db, 'config', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:configID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { configID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'config', configID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

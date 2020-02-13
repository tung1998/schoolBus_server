const express = require('express')
const router = express.Router()

const ModuleModel = require('./../models/Module')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { name, description, route, level, parent, icon, permission } = req.body
  let { db } = req.app.locals
  ModuleModel.createModule(db, name, description, route, level, parent, icon, permission)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create module : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'module',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let result = {}
  ModuleModel.getModules(db, 1)
    .then((data) => {
      result.data = data
      return ModuleModel.countModules(db)
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
    ModuleModel.getModules(db, page)
      .then((data) => {
        result.data = data
        return ModuleModel.countModules(db)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/:moduleID([0-9a-fA-F]{24})', (req, res, next) => {
  let { moduleID } = req.params
  let { db } = req.app.locals
  ModuleModel.getModuleByID(db, moduleID)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:moduleID([0-9a-fA-F]{24})', (req, res, next) => {
  let { moduleID } = req.params
  let { name, description, route, level, parent, icon, permission } = req.body
  let obj = {}
  if (name !== undefined) obj.name = name
  if (description !== undefined) obj.description = description
  if (route !== undefined) obj.route = route
  if (level !== undefined) obj.level = level
  if (parent !== undefined) obj.parent = parent
  if (icon !== undefined) obj.icon = icon
  if (permission !== undefined) obj.permission = permission
  let { db } = req.app.locals
  ModuleModel.updateModule(db, moduleID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update module : _id = ${moduleID}`,
          Date.now(),
          1,
          req.body,
          'module',
          moduleID,
        )
      }
    })
    .catch(next)
})

router.delete('/:moduleID([0-9a-fA-F]{24})', (req, res, next) => {
  let { moduleID } = req.params
  let { db } = req.app.locals
  ModuleModel.deleteModule(db, moduleID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete module : _id = ${moduleID}`,
          Date.now(),
          2,
          null,
          'module',
          moduleID,
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
  LogModel.getLogsByObjectType(db, 'module', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:moduleID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { moduleID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'module', moduleID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

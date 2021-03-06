const express = require('express')
const router = express.Router()

const ParentModel = require('./../models/Parent')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { username, password, image, name, phone, email, studentIDs, address, dateOfBirth } = req.body
  let { db } = req.app.locals
  ParentModel.createParent(db, username, password, image, name, phone, email, studentIDs, address, dateOfBirth)
    .then(({ insertedId }) => {
      res.send({ _id: insertedId })
      return LogModel.createLog(
        db,
        req.token ? req.token.userID : null,
        req.headers['user-agent'],
        req.ip,
        `Create parent : _id = ${insertedId}`,
        Date.now(),
        0,
        req.body,
        'parent',
        String(insertedId),
      )
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { limit, extra, ...query } = req.query
  limit = Number(limit)
  if (req.schoolID !== undefined) {
    let result = {}
    return ParentModel.getParentsBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return ParentModel.countParentsBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  ParentModel.getParents(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return ParentModel.countParents(db, query)
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
    if (req.schoolID !== undefined) {
      let result = {}
      return ParentModel.getParentsBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return ParentModel.countParentsBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    ParentModel.getParents(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return ParentModel.countParents(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/byClass', (req, res, next) => {
  let { classID, limit, page, extra, ...query } = req.query
  limit = Number(limit)
  page = Number(page)
  let { db } = req.app.locals
  ParentModel.getParentsByClass(db, classID, query, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:parentID([0-9a-fA-F]{24})', (req, res, next) => {
  let { parentID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  ParentModel.getParentByID(db, parentID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:parentID([0-9a-fA-F]{24})', (req, res, next) => {
  let { parentID } = req.params
  let { studentIDs, address, image, name, phone, email, dateOfBirth } = req.body
  let obj = {}
  if (studentIDs !== undefined) obj.studentIDs = studentIDs
  if (address !== undefined) obj.address = address
  let obj1 = {}
  if (image !== undefined) obj1.image = image
  if (name !== undefined) obj1.name = name
  if (phone !== undefined) obj1.phone = phone
  if (email !== undefined) obj1.email = email
  if (dateOfBirth !== undefined) obj1.dateOfBirth = dateOfBirth
  let { db } = req.app.locals
  ParentModel.updateParent(db, parentID, obj, obj1)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update parent : _id = ${parentID}`,
          Date.now(),
          1,
          req.body,
          'parent',
          parentID,
        )
      }
    })
    .catch(next)
})

router.delete('/:parentID([0-9a-fA-F]{24})', (req, res, next) => {
  let { parentID } = req.params
  let { db } = req.app.locals
  ParentModel.deleteParent(db, parentID)
    .then(({ lastErrorObject: { updatedExisting } }) => {
      if (!updatedExisting) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete parent : _id = ${parentID}`,
          Date.now(),
          2,
          null,
          'parent',
          parentID,
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
  LogModel.getLogsByObjectType(db, 'parent', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:parentID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { parentID } = req.params
  let { sortBy, sortType, limit, page, extra } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'parent', parentID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

module.exports = router

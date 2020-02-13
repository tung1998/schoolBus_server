const { ObjectID } = require('mongodb')

/**
 * Creats log.
 * @param {Object} db
 * @param {string} userID
 * @param {string} browser
 * @param {string} IP
 * @param {string} action
 * @param {number} time
 * @param {number} type
 * @param {Object} data
 * @param {string} objectType
 * @param {string} objectId
 * @returns {Object}
 */
function createLog (db, userID, browser, IP, action, time, type, data, objectType, objectId) {
  return db.collection(process.env.LOG_COLLECTION)
    .insertOne({
      userID,
      browser,
      IP,
      action,
      time,
      type,
      data,
      objectType,
      objectId,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count logs.
 * @param {Object} db
 * @returns {Object}
 */
function countLogs (db) {
  return db.collection(process.env.LOG_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get logs.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getLogs (db, page, extra = 'user') {
  return db.collection(process.env.LOG_COLLECTION)
    .find({ isDeleted: false })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get log by id.
 * @param {Object} db
 * @param {string} logID
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getLogByID (db, logID, extra = 'user') {
  return db.collection(process.env.LOG_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(logID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get logs by ids.
 * @param {Object} db
 * @param {Array} logIDs
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getLogsByIDs (db, logIDs, extra = 'user') {
  return db.collection(process.env.LOG_COLLECTION)
    .find({ isDeleted: false, _id: { $in: logIDs } })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Get logs by objectType.
 * @param {Object} db
 * @param {string} objectType
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra='user'
 * @param {number} start
 * @param {number} finish
 * @param {number} type
 * @returns {Object}
 */
function getLogsByObjectType (db, objectType, sortBy, sortType, limit, page, extra = 'user', start, finish, type) {
  if (!limit) limit = Number(process.env.LIMIT_DOCUMENT_PER_PAGE)
  if (!page) page = 1
  let query = { isDeleted: false, objectType }
  if (start && finish) query.createdTime = { $gte: start, $lt: finish }
  if (type) query.type = { $in: type.split(',').map(Number) }
  let sort = {}
  if (sortBy) {
    sortBy = sortBy.split(',')
    sortType = sortType ? sortType.split(',') : []
    sortBy.forEach((e, i) => {
      sort[e] = Number(sortType[i]) || 1
    })
  }
  let p1 = db.collection(process.env.LOG_COLLECTION)
    .find(query)
    .sort(sort)
    .skip(limit * (page - 1))
    .limit(limit)
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
  let p2 = db.collection(process.env.LOG_COLLECTION).count(query)
  return Promise.all([p1, p2])
    .then(([data, count]) => ({ data, count, page }))
}

/**
 * Get logs by object.
 * @param {Object} db
 * @param {string} objectType
 * @param {string} objectId
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra='user'
 * @returns {Object}
 */
function getLogsByObject (db, objectType, objectId, sortBy, sortType, limit, page, extra = 'user') {
  if (!limit) limit = Number(process.env.LIMIT_DOCUMENT_PER_PAGE)
  if (!page) page = 1
  let sort = {}
  if (sortBy) {
    sortBy = sortBy.split(',')
    sortType = sortType ? sortType.split(',') : []
    sortBy.forEach((e, i) => {
      sort[e] = Number(sortType[i]) || 1
    })
  }
  let c = db.collection(process.env.LOG_COLLECTION)
    .find({ isDeleted: false, objectType, objectId })
  let p1 = c.sort(sort)
    .skip(limit * (page - 1))
    .limit(limit)
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
  let p2 = c.count()
  return Promise.all([p1, p2])
    .then(([data, count]) => ({ data, count, page }))
}

/**
 * Add extra.
 * @param {Object} db
 * @param {(Array|Object)} docs
 * @param {string} extra
 * @returns {Object}
 */
function addExtra (db, docs, extra) {
  let e = extra.split(',')
  if (Array.isArray(docs)) {
    let userIDs = []
    docs.forEach(({ userID }) => {
      if (e.includes('user') && userID != null) {
        userIDs.push(ObjectID(userID))
      }
    })
    let users
    let arr = []
    if (userIDs.length > 0) {
      let p = getUsersByIDs(db, userIDs)
        .then((v) => {
          users = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { userID } = c
          if (users !== undefined && userID != null) {
            c.user = users[userID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { userID } = doc
  let arr = []
  if (e.includes('user') && userID != null) {
    let p = getUserByID(db, userID)
      .then((v) => {
        doc.user = v
      })
    arr.push(p)
  }
  return Promise.all(arr)
    .then(() => doc)
}

/**
 * Update log.
 * @param {Object} db
 * @param {string} logID
 * @param {Object} obj
 * @returns {Object}
 */
function updateLog (db, logID, obj) {
  return db.collection(process.env.LOG_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(logID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete log.
 * @param {Object} db
 * @param {string} logID
 * @returns {Object}
 */
function deleteLog (db, logID) {
  return db.collection(process.env.LOG_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(logID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createLog,
  countLogs,
  getLogs,
  getLogByID,
  getLogsByIDs,
  getLogsByObjectType,
  getLogsByObject,
  updateLog,
  deleteLog,
}

const { getUsersByIDs, getUserByID } = require('./User')

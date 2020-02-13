const { ObjectID } = require('mongodb')

/**
 * Creats driver.
 * @param {Object} db
 * @param {string} userID
 * @param {string} address
 * @param {string} image
 * @param {string} IDNumber
 * @param {number} IDIssueDate
 * @param {string} IDIssueBy
 * @param {string} DLNumber
 * @param {number} DLIssueDate
 * @param {number} status
 * @returns {Object}
 */
function createDriver (db, userID, address, image, IDNumber, IDIssueDate, IDIssueBy, DLNumber, DLIssueDate, status) {
  return db.collection(process.env.DRIVER_COLLECTION)
    .insertOne({
      userID,
      address,
      image,
      IDNumber,
      IDIssueDate,
      IDIssueBy,
      DLNumber,
      DLIssueDate,
      status,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count drivers.
 * @param {Object} db
 * @returns {Object}
 */
function countDrivers (db) {
  return db.collection(process.env.DRIVER_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get drivers.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getDrivers (db, page, extra = 'user') {
  return db.collection(process.env.DRIVER_COLLECTION)
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
 * Get driver by id.
 * @param {Object} db
 * @param {string} driverID
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getDriverByID (db, driverID, extra = 'user') {
  return db.collection(process.env.DRIVER_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(driverID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get drivers by ids.
 * @param {Object} db
 * @param {Array} driverIDs
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getDriversByIDs (db, driverIDs, extra = 'user') {
  return db.collection(process.env.DRIVER_COLLECTION)
    .find({ isDeleted: false, _id: { $in: driverIDs } })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
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
 * Update driver.
 * @param {Object} db
 * @param {string} driverID
 * @param {Object} obj
 * @returns {Object}
 */
function updateDriver (db, driverID, obj) {
  return db.collection(process.env.DRIVER_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(driverID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete driver.
 * @param {Object} db
 * @param {string} driverID
 * @returns {Object}
 */
function deleteDriver (db, driverID) {
  return db.collection(process.env.DRIVER_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(driverID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createDriver,
  countDrivers,
  getDrivers,
  getDriverByID,
  getDriversByIDs,
  updateDriver,
  deleteDriver,
}

const { getUsersByIDs, getUserByID } = require('./User')

const { ObjectID } = require('mongodb')

const USER_TYPE_DRIVER = 4

/**
 * Creats driver.
 * @param {Object} db
 * @param {string} username
 * @param {string} password
 * @param {string} image
 * @param {string} name
 * @param {string} phone
 * @param {string} email
 * @param {string} address
 * @param {string} IDNumber
 * @param {number} IDIssueDate
 * @param {string} IDIssueBy
 * @param {string} DLNumber
 * @param {number} DLIssueDate
 * @param {number} status
 * @param {string} schoolID
 * @param {string} dateOfBirth
 * @returns {Object}
 */
function createDriver (db, username, password, image, name, phone, email, address, IDNumber, IDIssueDate, IDIssueBy, DLNumber, DLIssueDate, status, schoolID, dateOfBirth) {
  return createUser(db, username, password, image, name, phone, email, USER_TYPE_DRIVER, schoolID, dateOfBirth)
    .then(({ insertedId }) => (
      db.collection(process.env.DRIVER_COLLECTION)
        .insertOne({
          userID: String(insertedId),
          address,
          IDNumber,
          IDIssueDate,
          IDIssueBy,
          DLNumber,
          DLIssueDate,
          status,
          schoolID,
          createdTime: Date.now(),
          updatedTime: Date.now(),
          isDeleted: false,
        })
    ))
}

/**
 * Count drivers.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countDrivers (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.DRIVER_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count drivers by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countDriversBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.DRIVER_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get drivers.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getDrivers (db, query, limit, page, extra = 'user,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.DRIVER_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .skip((limit || process.env.LIMIT_DOCUMENT_PER_PAGE) * (page - 1))
        .limit(limit || Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
        .toArray()
        .then((v) => {
          if (v.length === 0) return []
          if (!extra) return v
          return addExtra(db, v, extra)
        })
    ))
}

/**
 * Get drivers by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getDriversBySchool (db, schoolID, query, limit, page, extra = 'user,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.DRIVER_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .skip((limit || process.env.LIMIT_DOCUMENT_PER_PAGE) * (page - 1))
        .limit(limit || Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
        .toArray()
        .then((v) => {
          if (v.length === 0) return []
          if (!extra) return v
          return addExtra(db, v, extra)
        })
    ))
}

/**
 * Get driver by id.
 * @param {Object} db
 * @param {string} driverID
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getDriverByID (db, driverID, extra = 'user,school') {
  return db.collection(process.env.DRIVER_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(driverID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get driver by user.
 * @param {Object} db
 * @param {string} userID
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getDriverByUser (db, userID, extra = 'user,school') {
  return db.collection(process.env.DRIVER_COLLECTION)
    .findOne({ isDeleted: false, userID })
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
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getDriversByIDs (db, driverIDs, extra = 'user,school') {
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
    let schoolIDs = []
    docs.forEach(({ userID, schoolID }) => {
      if (e.includes('user') && userID != null) {
        userIDs.push(ObjectID(userID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let users
    let schools
    let arr = []
    if (userIDs.length > 0) {
      let p = getUsersByIDs(db, userIDs)
        .then((v) => {
          users = v
        })
      arr.push(p)
    }
    if (schoolIDs.length > 0) {
      let p = getSchoolsByIDs(db, schoolIDs)
        .then((v) => {
          schools = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { userID, schoolID } = c
          if (users !== undefined && userID != null) {
            c.user = users[userID]
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { userID, schoolID } = doc
  let arr = []
  if (e.includes('user') && userID != null) {
    let p = getUserByID(db, userID)
      .then((v) => {
        doc.user = v
      })
    arr.push(p)
  }
  if (e.includes('school') && schoolID != null) {
    let p = getSchoolByID(db, schoolID)
      .then((v) => {
        doc.school = v
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
 * @param {Object} obj1
 * @returns {Object}
 */
function updateDriver (db, driverID, obj, obj1) {
  return db.collection(process.env.DRIVER_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(driverID) },
      null,
      { $set: { updatedTime: Date.now(), ...obj } },
      { fields: { _id: 0, userID: 1 } },
    )
    .then((v) => {
      if (v.lastErrorObject.updatedExisting) {
        return updateUser(db, v.value.userID, obj1)
          .then(() => v)
      }
      return v
    })
}

/**
 * Delete driver.
 * @param {Object} db
 * @param {string} driverID
 * @returns {Object}
 */
function deleteDriver (db, driverID) {
  let p = db.collection(process.env.DRIVER_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(driverID) },
      null,
      { $set: { isDeleted: true } },
      { fields: { _id: 0, userID: 1 } },
    )
  p.then(({ lastErrorObject: { updatedExisting }, value }) => {
    if (updatedExisting) {
      deleteUser(db, value.userID, false)
    }
  })
  return p
}

/**
 * Delete driver by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function deleteDriverByUser (db, userID) {
  return db.collection(process.env.DRIVER_COLLECTION)
    .updateOne(
      { isDeleted: false, userID },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete drivers by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteDriversBySchool (db, schoolID) {
  return db.collection(process.env.DRIVER_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteDriver(db, String(_id))
      })
    })
}

module.exports = {
  createDriver,
  countDrivers,
  countDriversBySchool,
  getDrivers,
  getDriversBySchool,
  getDriverByID,
  getDriverByUser,
  getDriversByIDs,
  updateDriver,
  deleteDriver,
  deleteDriverByUser,
  deleteDriversBySchool,
}

const parseQuery = require('./parseQuery')
const { createUser, getUsersByIDs, getUserByID, updateUser, deleteUser } = require('./User')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

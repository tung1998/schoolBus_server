const { ObjectID } = require('mongodb')

const USER_TYPE_ADMINISTRATOR = 0

const ADMINISTRATOR_TYPE_ROOT = 0
const ADMINISTRATOR_TYPE_SCHOOL = 1

/**
 * Creats administrator.
 * @param {Object} db
 * @param {string} username
 * @param {string} password
 * @param {string} image
 * @param {string} name
 * @param {string} phone
 * @param {string} email
 * @param {number} adminType
 * @param {string} permission
 * @param {string} schoolID
 * @param {string} dateOfBirth
 * @returns {Object}
 */
function createAdministrator (db, username, password, image, name, phone, email, adminType, permission, schoolID, dateOfBirth) {
  return createUser(db, username, password, image, name, phone, email, USER_TYPE_ADMINISTRATOR, schoolID, dateOfBirth)
    .then(({ insertedId }) => (
      db.collection(process.env.ADMINISTRATOR_COLLECTION)
        .insertOne({
          userID: String(insertedId),
          adminType,
          permission,
          schoolID,
          createdTime: Date.now(),
          updatedTime: Date.now(),
          isDeleted: false,
        })
    ))
}

/**
 * Count administrators.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countAdministrators (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.ADMINISTRATOR_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count administrators by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countAdministratorsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.ADMINISTRATOR_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get administrators.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getAdministrators (db, query, limit, page, extra = 'user,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.ADMINISTRATOR_COLLECTION)
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
 * Get administrators by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getAdministratorsBySchool (db, schoolID, query, limit, page, extra = 'user,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.ADMINISTRATOR_COLLECTION)
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
 * Get administrator by id.
 * @param {Object} db
 * @param {string} administratorID
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getAdministratorByID (db, administratorID, extra = 'user,school') {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(administratorID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get administrator by user.
 * @param {Object} db
 * @param {string} userID
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getAdministratorByUser (db, userID, extra = 'user,school') {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .findOne({ isDeleted: false, userID })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get administrators by ids.
 * @param {Object} db
 * @param {Array} administratorIDs
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getAdministratorsByIDs (db, administratorIDs, extra = 'user,school') {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .find({ isDeleted: false, _id: { $in: administratorIDs } })
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
 * Update administrator.
 * @param {Object} db
 * @param {string} administratorID
 * @param {Object} obj
 * @param {Object} obj1
 * @returns {Object}
 */
function updateAdministrator (db, administratorID, obj, obj1) {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(administratorID) },
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
 * Delete administrator.
 * @param {Object} db
 * @param {string} administratorID
 * @returns {Object}
 */
function deleteAdministrator (db, administratorID) {
  let p = db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(administratorID) },
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
 * Delete administrator by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function deleteAdministratorByUser (db, userID) {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .updateOne(
      { isDeleted: false, userID },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete administrators by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteAdministratorsBySchool (db, schoolID) {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteAdministrator(db, String(_id))
      })
    })
}

module.exports = {
  createAdministrator,
  countAdministrators,
  countAdministratorsBySchool,
  getAdministrators,
  getAdministratorsBySchool,
  getAdministratorByID,
  getAdministratorByUser,
  getAdministratorsByIDs,
  updateAdministrator,
  deleteAdministrator,
  deleteAdministratorByUser,
  deleteAdministratorsBySchool,
}

const parseQuery = require('./parseQuery')
const { createUser, getUsersByIDs, getUserByID, updateUser, deleteUser } = require('./User')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

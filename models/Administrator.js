const { ObjectID } = require('mongodb')

/**
 * Creats administrator.
 * @param {Object} db
 * @param {string} userID
 * @param {number} adminType
 * @param {string} permission
 * @returns {Object}
 */
function createAdministrator (db, userID, adminType, permission) {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .insertOne({
      userID,
      adminType,
      permission,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count administrators.
 * @param {Object} db
 * @returns {Object}
 */
function countAdministrators (db) {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get administrators.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getAdministrators (db, page, extra = 'user') {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
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
 * Get administrator by id.
 * @param {Object} db
 * @param {string} administratorID
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getAdministratorByID (db, administratorID, extra = 'user') {
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
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getAdministratorByUser (db, userID, extra = 'user') {
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
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getAdministratorsByIDs (db, administratorIDs, extra = 'user') {
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
 * Update administrator.
 * @param {Object} db
 * @param {string} administratorID
 * @param {Object} obj
 * @returns {Object}
 */
function updateAdministrator (db, administratorID, obj) {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(administratorID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
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

module.exports = {
  createAdministrator,
  countAdministrators,
  getAdministrators,
  getAdministratorByID,
  getAdministratorByUser,
  getAdministratorsByIDs,
  updateAdministrator,
  deleteAdministrator,
  deleteAdministratorByUser,
}

const { getUsersByIDs, getUserByID, deleteUser } = require('./User')

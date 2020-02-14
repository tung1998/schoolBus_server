const { ObjectID } = require('mongodb')

/**
 * Creats nanny.
 * @param {Object} db
 * @param {string} userID
 * @param {string} address
 * @param {string} image
 * @param {string} IDNumber
 * @param {number} IDIssueDate
 * @param {string} IDIssueBy
 * @param {number} status
 * @returns {Object}
 */
function createNanny (db, userID, address, image, IDNumber, IDIssueDate, IDIssueBy, status) {
  return db.collection(process.env.NANNY_COLLECTION)
    .insertOne({
      userID,
      address,
      image,
      IDNumber,
      IDIssueDate,
      IDIssueBy,
      status,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count nannies.
 * @param {Object} db
 * @returns {Object}
 */
function countNannies (db) {
  return db.collection(process.env.NANNY_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get nannies.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getNannies (db, page, extra = 'user') {
  return db.collection(process.env.NANNY_COLLECTION)
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
 * Get nanny by id.
 * @param {Object} db
 * @param {string} nannyID
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getNannyByID (db, nannyID, extra = 'user') {
  return db.collection(process.env.NANNY_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(nannyID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get nanny by user.
 * @param {Object} db
 * @param {string} userID
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getNannyByUser (db, userID, extra = 'user') {
  return db.collection(process.env.NANNY_COLLECTION)
    .findOne({ isDeleted: false, userID })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get nannies by ids.
 * @param {Object} db
 * @param {Array} nannyIDs
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getNanniesByIDs (db, nannyIDs, extra = 'user') {
  return db.collection(process.env.NANNY_COLLECTION)
    .find({ isDeleted: false, _id: { $in: nannyIDs } })
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
 * Update nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @param {Object} obj
 * @returns {Object}
 */
function updateNanny (db, nannyID, obj) {
  return db.collection(process.env.NANNY_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(nannyID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @returns {Object}
 */
function deleteNanny (db, nannyID) {
  return db.collection(process.env.NANNY_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(nannyID) },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete nanny by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function deleteNannyByUser (db, userID) {
  return db.collection(process.env.NANNY_COLLECTION)
    .updateOne(
      { isDeleted: false, userID },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createNanny,
  countNannies,
  getNannies,
  getNannyByID,
  getNannyByUser,
  getNanniesByIDs,
  updateNanny,
  deleteNanny,
  deleteNannyByUser,
}

const { getUsersByIDs, getUserByID } = require('./User')

const { ObjectID } = require('mongodb')

/**
 * Creats SMS.
 * @param {Object} db
 * @param {string} userID
 * @param {string} phoneNumber
 * @param {string} content
 * @param {number} status
 * @param {number} price
 * @returns {Object}
 */
function createSMS (db, userID, phoneNumber, content, status, price) {
  return db.collection(process.env.SMS_COLLECTION)
    .insertOne({
      userID,
      phoneNumber,
      content,
      status,
      price,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count SMS.
 * @param {Object} db
 * @returns {Object}
 */
function countSMS (db) {
  return db.collection(process.env.SMS_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get SMS.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getSMS (db, page, extra = 'user') {
  return db.collection(process.env.SMS_COLLECTION)
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
 * Get SMS by id.
 * @param {Object} db
 * @param {string} SMSID
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getSMSByID (db, SMSID, extra = 'user') {
  return db.collection(process.env.SMS_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(SMSID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get SMS by ids.
 * @param {Object} db
 * @param {Array} SMSIDs
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getSMSByIDs (db, SMSIDs, extra = 'user') {
  return db.collection(process.env.SMS_COLLECTION)
    .find({ isDeleted: false, _id: { $in: SMSIDs } })
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
 * Update SMS.
 * @param {Object} db
 * @param {string} SMSID
 * @param {Object} obj
 * @returns {Object}
 */
function updateSMS (db, SMSID, obj) {
  return db.collection(process.env.SMS_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(SMSID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete SMS.
 * @param {Object} db
 * @param {string} SMSID
 * @returns {Object}
 */
function deleteSMS (db, SMSID) {
  return db.collection(process.env.SMS_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(SMSID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createSMS,
  countSMS,
  getSMS,
  getSMSByID,
  getSMSByIDs,
  updateSMS,
  deleteSMS,
}

const { getUsersByIDs, getUserByID } = require('./User')

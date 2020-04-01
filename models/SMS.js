const { ObjectID } = require('mongodb')

const SMS_STATUS_CREATED = 0
const SMS_STATUS_SENT = 1

/**
 * Creats SMS.
 * @param {Object} db
 * @param {string} userID
 * @param {string} phoneNumber
 * @param {string} content
 * @param {number} [status=SMS_STATUS_CREATED]
 * @param {number} price
 * @param {string} schoolID
 * @returns {Object}
 */
function createSMS (db, userID, phoneNumber, content, status = SMS_STATUS_CREATED, price, schoolID) {
  return db.collection(process.env.SMS_COLLECTION)
    .insertOne({
      userID,
      phoneNumber,
      content,
      status,
      price,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count SMS.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countSMS (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.SMS_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count SMS by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countSMSBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.SMS_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get SMS.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getSMS (db, query, limit, page, extra = 'user,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.SMS_COLLECTION)
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
 * Get SMS by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getSMSBySchool (db, schoolID, query, limit, page, extra = 'user,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.SMS_COLLECTION)
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
 * Get unsent SMS.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getUnsentSMS (db, page, extra = 'user,school') {
  return db.collection(process.env.SMS_COLLECTION)
    .find({ isDeleted: false, status: SMS_STATUS_CREATED })
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
 * Get sent SMS.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getSentSMS (db, page, extra = 'user,school') {
  return db.collection(process.env.SMS_COLLECTION)
    .find({ isDeleted: false, status: SMS_STATUS_SENT })
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
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getSMSByID (db, SMSID, extra = 'user,school') {
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
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getSMSByIDs (db, SMSIDs, extra = 'user,school') {
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
 * Get SMS by user.
 * @param {Object} db
 * @param {string} userID
 * @param {number} [page=1]
 * @returns {Object}
 */
function getSMSByUser (db, userID, page = 1) {
  return db.collection(process.env.SMS_COLLECTION)
    .find({ isDeleted: false, userID })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
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
 * Cập nhật trạng thái SMS.
 * @param {Object} db
 * @param {string} smsID
 * @param {string} SMSStatus
 * @returns {Object}
 */
function updateSMSStatus (db, smsID, SMSStatus) {
  return db.collection(process.env.SMS_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(smsID) },
      { $set: { updatedTime: Date.now(), status: SMSStatus } },
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

/**
 * Delete SMS by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteSMSBySchool (db, schoolID) {
  return db.collection(process.env.SMS_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteSMS(db, String(_id))
      })
    })
}

module.exports = {
  createSMS,
  countSMS,
  countSMSBySchool,
  getSMS,
  getSMSBySchool,
  getUnsentSMS,
  getSentSMS,
  getSMSByID,
  getSMSByUser,
  getSMSByIDs,
  updateSMS,
  updateSMSStatus,
  deleteSMS,
  deleteSMSBySchool,
}

const parseQuery = require('./parseQuery')
const { getUsersByIDs, getUserByID } = require('./User')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

const { ObjectID } = require('mongodb')

const USER_TYPE_NANNY = 2

/**
 * Creats nanny.
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
 * @param {number} status
 * @param {string} schoolID
 * @param {string} dateOfBirth
 * @returns {Object}
 */
function createNanny (db, username, password, image, name, phone, email, address, IDNumber, IDIssueDate, IDIssueBy, status, schoolID, dateOfBirth) {
  return createUser(db, username, password, image, name, phone, email, USER_TYPE_NANNY, schoolID, dateOfBirth)
    .then(({ insertedId }) => (
      db.collection(process.env.NANNY_COLLECTION)
        .insertOne({
          userID: String(insertedId),
          address,
          IDNumber,
          IDIssueDate,
          IDIssueBy,
          status,
          schoolID,
          createdTime: Date.now(),
          updatedTime: Date.now(),
          isDeleted: false,
        })
    ))
}

/**
 * Count nannies.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countNannies (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.NANNY_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count nannies by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countNanniesBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.NANNY_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get nannies.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getNannies (db, query, limit, page, extra = 'user,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.NANNY_COLLECTION)
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
 * Get nannies by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getNanniesBySchool (db, schoolID, query, limit, page, extra = 'user,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.NANNY_COLLECTION)
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
 * Get nanny by id.
 * @param {Object} db
 * @param {string} nannyID
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getNannyByID (db, nannyID, extra = 'user,school') {
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
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getNannyByUser (db, userID, extra = 'user,school') {
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
 * @param {string} [extra='user,school']
 * @returns {Object}
 */
function getNanniesByIDs (db, nannyIDs, extra = 'user,school') {
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
 * Update nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @param {Object} obj
 * @param {Object} obj1
 * @returns {Object}
 */
function updateNanny (db, nannyID, obj, obj1) {
  return db.collection(process.env.NANNY_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(nannyID) },
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
 * Delete nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @returns {Object}
 */
function deleteNanny (db, nannyID) {
  let p = db.collection(process.env.NANNY_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(nannyID) },
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

/**
 * Delete nannies by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteNanniesBySchool (db, schoolID) {
  return db.collection(process.env.NANNY_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteNanny(db, String(_id))
      })
    })
}

module.exports = {
  createNanny,
  countNannies,
  countNanniesBySchool,
  getNannies,
  getNanniesBySchool,
  getNannyByID,
  getNannyByUser,
  getNanniesByIDs,
  updateNanny,
  deleteNanny,
  deleteNannyByUser,
  deleteNanniesBySchool,
}

const parseQuery = require('./parseQuery')
const { createUser, getUsersByIDs, getUserByID, updateUser, deleteUser } = require('./User')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

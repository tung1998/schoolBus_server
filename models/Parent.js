const { ObjectID } = require('mongodb')

const USER_TYPE_PARENT = 3

/**
 * Creats parent.
 * @param {Object} db
 * @param {string} username
 * @param {string} password
 * @param {string} image
 * @param {string} name
 * @param {string} phone
 * @param {string} email
 * @param {Array} studentIDs
 * @param {string} schoolID
 * @returns {Object}
 */
function createParent (db, username, password, image, name, phone, email, studentIDs, schoolID) {
  return createUser(db, username, password, image, name, phone, email, USER_TYPE_PARENT, schoolID)
    .then(({ insertedId }) => (
      db.collection(process.env.PARENT_COLLECTION)
        .insertOne({
          userID: String(insertedId),
          studentIDs,
          schoolID,
          createdTime: Date.now(),
          updatedTime: Date.now(),
          isDeleted: false,
        })
    ))
}

/**
 * Count parents.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countParents (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count parents by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countParentsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get parents.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,student,school']
 * @returns {Object}
 */
function getParents (db, query, limit, page, extra = 'user,student,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_COLLECTION)
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
 * Get parents by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,student,school']
 * @returns {Object}
 */
function getParentsBySchool (db, schoolID, query, limit, page, extra = 'user,student,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_COLLECTION)
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
 * Get parent by id.
 * @param {Object} db
 * @param {string} parentID
 * @param {string} [extra='user,student,school']
 * @returns {Object}
 */
function getParentByID (db, parentID, extra = 'user,student,school') {
  return db.collection(process.env.PARENT_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(parentID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get parent by user.
 * @param {Object} db
 * @param {string} userID
 * @param {string} [extra='user,student,school']
 * @returns {Object}
 */
function getParentByUser (db, userID, extra = 'user,student,school') {
  return db.collection(process.env.PARENT_COLLECTION)
    .findOne({ isDeleted: false, userID })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get parents by ids.
 * @param {Object} db
 * @param {Array} parentIDs
 * @param {string} [extra='user,student,school']
 * @returns {Object}
 */
function getParentsByIDs (db, parentIDs, extra = 'user,student,school') {
  return db.collection(process.env.PARENT_COLLECTION)
    .find({ isDeleted: false, _id: { $in: parentIDs } })
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
    let studentIDs = []
    let schoolIDs = []
    docs.forEach(({ userID, studentIDs: sIDs, schoolID }) => {
      if (e.includes('user') && userID != null) {
        userIDs.push(ObjectID(userID))
      }
      if (e.includes('student') && Array.isArray(sIDs)) {
        studentIDs.push(...sIDs.map(ObjectID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let users
    let students
    let schools
    let arr = []
    if (userIDs.length > 0) {
      let p = getUsersByIDs(db, userIDs)
        .then((v) => {
          users = v
        })
      arr.push(p)
    }
    if (studentIDs.length > 0) {
      let p = getStudentsByIDs(db, studentIDs)
        .then((v) => {
          students = v
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
          let { userID, studentIDs: sIDs, schoolID } = c
          if (users !== undefined && userID != null) {
            c.user = users[userID]
          }
          if (students !== undefined && Array.isArray(sIDs)) {
            c.students = sIDs.map(c => students[c])
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { userID, studentIDs, schoolID } = doc
  let arr = []
  if (e.includes('user') && userID != null) {
    let p = getUserByID(db, userID)
      .then((v) => {
        doc.user = v
      })
    arr.push(p)
  }
  if (e.includes('student') && Array.isArray(studentIDs)) {
    let p = getStudentsByIDs(db, studentIDs.map(ObjectID))
      .then((v) => {
        doc.students = studentIDs.map(c => v[c])
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
 * Update parent.
 * @param {Object} db
 * @param {string} parentID
 * @param {Object} obj
 * @param {Object} obj1
 * @returns {Object}
 */
function updateParent (db, parentID, obj, obj1) {
  return db.collection(process.env.PARENT_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(parentID) },
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
 * Delete parent.
 * @param {Object} db
 * @param {string} parentID
 * @returns {Object}
 */
function deleteParent (db, parentID) {
  let p = db.collection(process.env.PARENT_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(parentID) },
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
 * Delete parent by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function deleteParentByUser (db, userID) {
  return db.collection(process.env.PARENT_COLLECTION)
    .updateOne(
      { isDeleted: false, userID },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete parents by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteParentsBySchool (db, schoolID) {
  return db.collection(process.env.PARENT_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteParent(db, String(_id))
      })
    })
}

module.exports = {
  createParent,
  countParents,
  countParentsBySchool,
  getParents,
  getParentsBySchool,
  getParentByID,
  getParentByUser,
  getParentsByIDs,
  updateParent,
  deleteParent,
  deleteParentByUser,
  deleteParentsBySchool,
}

const parseQuery = require('./parseQuery')
const { createUser, getUsersByIDs, getUserByID, updateUser, deleteUser } = require('./User')
const { getStudentsByIDs } = require('./Student')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

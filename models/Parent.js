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
 * @param {string} address
 * @param {string} dateOfBirth
 * @returns {Object}
 */
function createParent (db, username, password, image, name, phone, email, studentIDs, address, dateOfBirth) {
  return createUser(db, username, password, image, name, phone, email, USER_TYPE_PARENT, null, dateOfBirth)
    .then(({ insertedId }) => (
      db.collection(process.env.PARENT_COLLECTION)
        .insertOne({
          userID: String(insertedId),
          studentIDs,
          address,
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
  return Promise.all([
    getStudentIDsBySchool(db, schoolID),
    parseQuery(db, query),
  ])
    .then(([studentIDs]) => (
      db.collection(process.env.PARENT_COLLECTION)
        .find({ $and: [{ isDeleted: false, studentIDs: { $in: studentIDs } }, query] })
        .count()
    ))
}

/**
 * Get parents.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,student']
 * @returns {Object}
 */
function getParents (db, query, limit, page, extra = 'user,student') {
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
 * @param {string} [extra='user,student']
 * @returns {Object}
 */
function getParentsBySchool (db, schoolID, query, limit, page, extra = 'user,student') {
  return Promise.all([
    getStudentIDsBySchool(db, schoolID),
    parseQuery(db, query),
  ])
    .then(([studentIDs]) => (
      db.collection(process.env.PARENT_COLLECTION)
        .find({ $and: [{ isDeleted: false, studentIDs: { $in: studentIDs } }, query] })
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
 * @param {string} [extra='user,student']
 * @returns {Object}
 */
function getParentByID (db, parentID, extra = 'user,student') {
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
 * @param {string} [extra='user,student']
 * @returns {Object}
 */
function getParentByUser (db, userID, extra = 'user,student') {
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
 * @param {string} [extra='user,student']
 * @returns {Object}
 */
function getParentsByIDs (db, parentIDs, extra = 'user,student') {
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
 * Get parents by class.
 * @param {Object} db
 * @param {string} classID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,student']
 * @returns {Object}
 */
function getParentsByClass (db, classID, query, limit, page, extra = 'user,student') {
  return Promise.all([
    getStudentIDsByClass(db, classID),
    parseQuery(db, query),
  ])
    .then(([studentIDs]) => (
      db.collection(process.env.PARENT_COLLECTION)
        .find({ $and: [{ isDeleted: false, studentIDs: { $in: studentIDs } }, query] })
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
 * Get parents by student.
 * @param {Object} db
 * @param {string} studentID
 * @param {string} [extra='user,student']
 * @returns {Object}
 */
function getParentsByStudent (db, studentID, extra = 'user,student') {
  return db.collection(process.env.PARENT_COLLECTION)
    .find({ isDeleted: false, studentIDs: { $elemMatch: { $eq: studentID } } })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get parents by students.
 * @param {Object} db
 * @param {Array} studentIDs
 * @param {string} [extra='user,student']
 * @returns {Object}
 */
function getParentsByStudents (db, studentIDs, extra = 'user,student') {
  return db.collection(process.env.PARENT_COLLECTION)
    .find({ isDeleted: false, studentIDs: { $elemMatch: { $in: studentIDs } } })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
    .then(v => (
      v.reduce((a, c) => {
        c.studentIDs.forEach((studentID) => {
          a[studentID] = (a[studentID] || []).concat(c)
        })
        return a
      }, {})
    ))
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
    docs.forEach(({ userID, studentIDs: sIDs }) => {
      if (e.includes('user') && userID != null) {
        userIDs.push(ObjectID(userID))
      }
      if (e.includes('student') && Array.isArray(sIDs)) {
        studentIDs.push(...sIDs.map(ObjectID))
      }
    })
    let users
    let students
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
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { userID, studentIDs: sIDs } = c
          if (users !== undefined && userID != null) {
            c.user = users[userID]
          }
          if (students !== undefined && Array.isArray(sIDs)) {
            c.students = sIDs.map(c => students[c])
          }
        })
        return docs
      })
  }
  let doc = docs
  let { userID, studentIDs } = doc
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

module.exports = {
  createParent,
  countParents,
  countParentsBySchool,
  getParents,
  getParentsBySchool,
  getParentByID,
  getParentByUser,
  getParentsByIDs,
  getParentsByClass,
  getParentsByStudent,
  getParentsByStudents,
  updateParent,
  deleteParent,
  deleteParentByUser,
}

const parseQuery = require('./parseQuery')
const { createUser, getUsersByIDs, getUserByID, updateUser, deleteUser } = require('./User')
const { getStudentsByIDs, getStudentIDsBySchool, getStudentIDsByClass } = require('./Student')

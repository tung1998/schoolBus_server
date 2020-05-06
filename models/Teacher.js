const { ObjectID } = require('mongodb')

const USER_TYPE_TEACHER = 5

/**
 * Creats teacher.
 * @param {Object} db
 * @param {string} username
 * @param {string} password
 * @param {string} image
 * @param {string} name
 * @param {string} phone
 * @param {string} email
 * @param {string} schoolID
 * @returns {Object}
 */
function createTeacher (db, username, password, image, name, phone, email, schoolID) {
  return createUser(db, username, password, image, name, phone, email, USER_TYPE_TEACHER, schoolID)
    .then(({ insertedId }) => (
      db.collection(process.env.TEACHER_COLLECTION)
        .insertOne({
          schoolID,
          userID: String(insertedId),
          createdTime: Date.now(),
          updatedTime: Date.now(),
          isDeleted: false,
        })
    ))
}

/**
 * Count teachers.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countTeachers (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TEACHER_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count teachers by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countTeachersBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TEACHER_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get teachers.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='school,user']
 * @returns {Object}
 */
function getTeachers (db, query, limit, page, extra = 'school,user') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TEACHER_COLLECTION)
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
 * Get teachers by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='school,user']
 * @returns {Object}
 */
function getTeachersBySchool (db, schoolID, query, limit, page, extra = 'school,user') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TEACHER_COLLECTION)
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
 * Get teacher by id.
 * @param {Object} db
 * @param {string} teacherID
 * @param {string} [extra='school,user']
 * @returns {Object}
 */
function getTeacherByID (db, teacherID, extra = 'school,user') {
  return db.collection(process.env.TEACHER_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(teacherID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get teacher by user.
 * @param {Object} db
 * @param {string} userID
 * @param {string} [extra='school,user']
 * @returns {Object}
 */
function getTeacherByUser (db, userID, extra = 'school,user') {
  return db.collection(process.env.TEACHER_COLLECTION)
    .findOne({ isDeleted: false, userID })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get teachers by ids.
 * @param {Object} db
 * @param {Array} teacherIDs
 * @param {string} [extra='school,user']
 * @returns {Object}
 */
function getTeachersByIDs (db, teacherIDs, extra = 'school,user') {
  return db.collection(process.env.TEACHER_COLLECTION)
    .find({ isDeleted: false, _id: { $in: teacherIDs } })
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
    let schoolIDs = []
    let userIDs = []
    docs.forEach(({ schoolID, userID }) => {
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
      if (e.includes('user') && userID != null) {
        userIDs.push(ObjectID(userID))
      }
    })
    let schools
    let users
    let arr = []
    if (schoolIDs.length > 0) {
      let p = getSchoolsByIDs(db, schoolIDs)
        .then((v) => {
          schools = v
        })
      arr.push(p)
    }
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
          let { schoolID, userID } = c
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
          if (users !== undefined && userID != null) {
            c.user = users[userID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { schoolID, userID } = doc
  let arr = []
  if (e.includes('school') && schoolID != null) {
    let p = getSchoolByID(db, schoolID)
      .then((v) => {
        doc.school = v
      })
    arr.push(p)
  }
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
 * Update teacher.
 * @param {Object} db
 * @param {string} teacherID
 * @param {Object} obj
 * @param {Object} obj1
 * @returns {Object}
 */
function updateTeacher (db, teacherID, obj, obj1) {
  return db.collection(process.env.TEACHER_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(teacherID) },
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
 * Delete teacher.
 * @param {Object} db
 * @param {string} teacherID
 * @returns {Object}
 */
function deleteTeacher (db, teacherID) {
  let p = db.collection(process.env.TEACHER_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(teacherID) },
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
 * Delete teacher by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function deleteTeacherByUser (db, userID) {
  return db.collection(process.env.TEACHER_COLLECTION)
    .updateOne(
      { isDeleted: false, userID },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete teachers by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteTeachersBySchool (db, schoolID) {
  return db.collection(process.env.TEACHER_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteTeacher(db, String(_id))
      })
    })
}

module.exports = {
  createTeacher,
  countTeachers,
  countTeachersBySchool,
  getTeachers,
  getTeachersBySchool,
  getTeacherByID,
  getTeacherByUser,
  getTeachersByIDs,
  updateTeacher,
  deleteTeacher,
  deleteTeacherByUser,
  deleteTeachersBySchool,
}

const parseQuery = require('./parseQuery')
const { getSchoolsByIDs, getSchoolByID } = require('./School')
const { createUser, getUsersByIDs, getUserByID, updateUser, deleteUser } = require('./User')

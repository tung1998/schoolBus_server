const { ObjectID } = require('mongodb')

const USER_TYPE_STUDENT = 1

/**
 * Creats student.
 * @param {Object} db
 * @param {string} username
 * @param {string} password
 * @param {string} image
 * @param {string} name
 * @param {string} phone
 * @param {string} email
 * @param {string} address
 * @param {string} IDStudent
 * @param {string} classID
 * @param {number} status
 * @param {string} carStopID
 * @param {string} schoolID
 * @returns {Object}
 */
function createStudent (db, username, password, image, name, phone, email, address, IDStudent, classID, status, carStopID, schoolID) {
  return createUser(db, username, password, image, name, phone, email, USER_TYPE_STUDENT, schoolID)
    .then(({ insertedId }) => (
      db.collection(process.env.STUDENT_COLLECTION)
        .insertOne({
          userID: String(insertedId),
          address,
          IDStudent,
          classID,
          status,
          carStopID,
          schoolID,
          createdTime: Date.now(),
          updatedTime: Date.now(),
          isDeleted: false,
        })
    ))
}

/**
 * Count students.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countStudents (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count students by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countStudentsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Count students by class.
 * @param {Object} db
 * @param {string} classID
 * @param {Object} query
 * @returns {Object}
 */
function countStudentsByClass (db, classID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
        .find({ $and: [{ isDeleted: false, classID }, query] })
        .count()
    ))
}

/**
 * Get students.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,class,carStop,school']
 * @returns {Object}
 */
function getStudents (db, query, limit, page, extra = 'user,class,carStop,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
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
 * Get students by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,class,carStop,school']
 * @returns {Object}
 */
function getStudentsBySchool (db, schoolID, query, limit, page, extra = 'user,class,carStop,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
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
 * Get students by class.
 * @param {Object} db
 * @param {string} classID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,class,carStop,school']
 * @returns {Object}
 */
function getStudentsByClass (db, classID, query, limit, page, extra = 'user,class,carStop,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
        .find({ $and: [{ isDeleted: false, classID }, query] })
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
 * Get student by id.
 * @param {Object} db
 * @param {string} studentID
 * @param {string} [extra='user,class,carStop,school']
 * @returns {Object}
 */
function getStudentByID (db, studentID, extra = 'user,class,carStop,school') {
  return db.collection(process.env.STUDENT_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(studentID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get student by user.
 * @param {Object} db
 * @param {string} userID
 * @param {string} [extra='user,class,carStop,school']
 * @returns {Object}
 */
function getStudentByUser (db, userID, extra = 'user,class,carStop,school') {
  return db.collection(process.env.STUDENT_COLLECTION)
    .findOne({ isDeleted: false, userID })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get students by ids.
 * @param {Object} db
 * @param {Array} studentIDs
 * @param {string} [extra='user,class,carStop,school']
 * @returns {Object}
 */
function getStudentsByIDs (db, studentIDs, extra = 'user,class,carStop,school') {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, _id: { $in: studentIDs } })
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
    let classIDs = []
    let carStopIDs = []
    let schoolIDs = []
    docs.forEach(({ userID, classID, carStopID, schoolID }) => {
      if (e.includes('user') && userID != null) {
        userIDs.push(ObjectID(userID))
      }
      if (e.includes('class') && classID != null) {
        classIDs.push(ObjectID(classID))
      }
      if (e.includes('carStop') && carStopID != null) {
        carStopIDs.push(ObjectID(carStopID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let users
    let classes
    let carStops
    let schools
    let arr = []
    if (userIDs.length > 0) {
      let p = getUsersByIDs(db, userIDs)
        .then((v) => {
          users = v
        })
      arr.push(p)
    }
    if (classIDs.length > 0) {
      let p = getClassesByIDs(db, classIDs)
        .then((v) => {
          classes = v
        })
      arr.push(p)
    }
    if (carStopIDs.length > 0) {
      let p = getCarStopsByIDs(db, carStopIDs)
        .then((v) => {
          carStops = v
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
          let { userID, classID, carStopID, schoolID } = c
          if (users !== undefined && userID != null) {
            c.user = users[userID]
          }
          if (classes !== undefined && classID != null) {
            c.class = classes[classID]
          }
          if (carStops !== undefined && carStopID != null) {
            c.carStop = carStops[carStopID]
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { userID, classID, carStopID, schoolID } = doc
  let arr = []
  if (e.includes('user') && userID != null) {
    let p = getUserByID(db, userID)
      .then((v) => {
        doc.user = v
      })
    arr.push(p)
  }
  if (e.includes('class') && classID != null) {
    let p = getClassByID(db, classID)
      .then((v) => {
        doc.class = v
      })
    arr.push(p)
  }
  if (e.includes('carStop') && carStopID != null) {
    let p = getCarStopByID(db, carStopID)
      .then((v) => {
        doc.carStop = v
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
 * Update student.
 * @param {Object} db
 * @param {string} studentID
 * @param {Object} obj
 * @param {Object} obj1
 * @returns {Object}
 */
function updateStudent (db, studentID, obj, obj1) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(studentID) },
      null,
      { $set: { updatedTime: Date.now(), ...obj } },
      { fields: { _id: 0, userID: 1, carStopID: 1 } },
    )
    .then((v) => {
      if (v.lastErrorObject.updatedExisting) {
        if (obj.carStopID !== undefined && obj.carStopID !== v.value.carStopID) updateStudentListsReplaceCarStop(db, studentID, v.value.carStopID, obj.carStopID)
        return updateUser(db, v.value.userID, obj1)
          .then(() => v)
      }
      return v
    })
}

/**
 * Delete student.
 * @param {Object} db
 * @param {string} studentID
 * @returns {Object}
 */
function deleteStudent (db, studentID) {
  let p = db.collection(process.env.STUDENT_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(studentID) },
      null,
      { $set: { isDeleted: true } },
      { fields: { _id: 0, userID: 1, carStopID: 1 } },
    )
  p.then(({ lastErrorObject: { updatedExisting }, value }) => {
    if (updatedExisting) {
      deleteUser(db, value.userID, false)
      updateStudentListsRemoveStudentCarStop(db, studentID, value.carStopID)
      updateTripsRemoveStudent(db, studentID)
    }
  })
  return p
}

/**
 * Delete student by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function deleteStudentByUser (db, userID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .findAndModify(
      { isDeleted: false, userID },
      null,
      { $set: { isDeleted: true } },
      { fields: { carStopID: 1 } },
    )
    .then(({ lastErrorObject: { updatedExisting }, value }) => {
      if (updatedExisting) {
        updateStudentListsRemoveStudentCarStop(db, String(value._id), value.carStopID)
        updateTripsRemoveStudent(db, String(value._id))
      }
    })
}

/**
 * Delete students by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteStudentsBySchool (db, schoolID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteStudent(db, String(_id))
      })
    })
}

/**
 * Delete students by class.
 * @param {Object} db
 * @param {string} classID
 * @returns {Object}
 */
function deleteStudentsByClass (db, classID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, classID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteStudent(db, String(_id))
      })
    })
}

/**
 * Get students carStopIDs.
 * @param {Object} db
 * @param {Array} studentIDs
 * @returns {Object}
 */
function getStudentsCarStopIDs (db, studentIDs) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, _id: { $in: studentIDs.map(ObjectID) }, carStopID: { $ne: null } })
    .project({ _id: 0, carStopID: 1 })
    .toArray()
    .then((v) => {
      let t = {}
      let carStopIDs = []
      v.forEach(({ carStopID }) => {
        if (!(carStopID in t)) {
          t[carStopID] = null
          carStopIDs.push(carStopID)
        }
      })
      return carStopIDs
    })
}

/**
 * Update students delete carStop.
 * @param {Object} db
 * @param {string} carStopID
 * @returns {Object}
 */
function updateStudentsDeleteCarStop (db, carStopID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .updateMany(
      { isDeleted: false, carStopID },
      { $set: { updatedTime: Date.now(), carStopID: null } },
    )
}

/**
 * Get studentIDs by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function getStudentIDsBySchool (db, schoolID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then(v => v.map(({ _id }) => String(_id)))
}

/**
 * Get studentIDs by class.
 * @param {Object} db
 * @param {string} classID
 * @returns {Object}
 */
function getStudentIDsByClass (db, classID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, classID })
    .project({ _id: 1 })
    .toArray()
    .then(v => v.map(({ _id }) => String(_id)))
}

module.exports = {
  createStudent,
  countStudents,
  countStudentsBySchool,
  countStudentsByClass,
  getStudents,
  getStudentsBySchool,
  getStudentsByClass,
  getStudentByID,
  getStudentByUser,
  getStudentsByIDs,
  updateStudent,
  deleteStudent,
  deleteStudentByUser,
  deleteStudentsBySchool,
  deleteStudentsByClass,
  getStudentsCarStopIDs,
  updateStudentsDeleteCarStop,
  getStudentIDsBySchool,
  getStudentIDsByClass,
}

const parseQuery = require('./parseQuery')
const { createUser, getUsersByIDs, getUserByID, updateUser, deleteUser } = require('./User')
const { getClassesByIDs, getClassByID } = require('./Class')
const { getCarStopsByIDs, getCarStopByID } = require('./CarStop')
const { getSchoolsByIDs, getSchoolByID } = require('./School')
const { updateStudentListsRemoveStudentCarStop, updateStudentListsReplaceCarStop } = require('./StudentList')
const { updateTripsRemoveStudent } = require('./Trip')

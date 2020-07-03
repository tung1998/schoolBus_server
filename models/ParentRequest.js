const { ObjectID } = require('mongodb')

/**
 * Creats parentRequest.
 * @param {Object} db
 * @param {string} studentID
 * @param {string} tripID
 * @param {number} time
 * @param {number} type
 * @param {number} [status=0]
 * @param {string} parentID
 * @param {string} teacherID
 * @param {string} note
 * @param {string} schoolID
 * @returns {Object}
 */
function createParentRequest (db, studentID, tripID, time, type, status = 0, parentID, teacherID, note, schoolID) {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .insertOne({
      studentID,
      tripID,
      time,
      type,
      status,
      parentID,
      teacherID,
      note,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count parentRequests.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countParentRequests (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_REQUEST_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count parentRequests by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countParentRequestsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_REQUEST_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Count parentRequests by parent.
 * @param {Object} db
 * @param {string} parentID
 * @param {Object} query
 * @returns {Object}
 */
function countParentRequestsByParent (db, parentID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_REQUEST_COLLECTION)
        .find({ $and: [{ isDeleted: false, parentID }, query] })
        .count()
    ))
}

/**
 * Count parentRequests by teacher.
 * @param {Object} db
 * @param {string} teacherID
 * @param {Object} query
 * @returns {Object}
 */
function countParentRequestsByTeacher (db, teacherID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_REQUEST_COLLECTION)
        .find({ $and: [{ isDeleted: false, teacherID }, query] })
        .count()
    ))
}

/**
 * Get parentRequests.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='student,trip,parent,teacher,school']
 * @returns {Object}
 */
function getParentRequests (db, query, limit, page, extra = 'student,trip,parent,teacher,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_REQUEST_COLLECTION)
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
 * Get parentRequests by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='student,trip,parent,teacher,school']
 * @returns {Object}
 */
function getParentRequestsBySchool (db, schoolID, query, limit, page, extra = 'student,trip,parent,teacher,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_REQUEST_COLLECTION)
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
 * Get parentRequests by school.
 * @param {Object} db
 * @param {string} parentID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='student,trip,parent,teacher,school']
 * @returns {Object}
 */
function getParentRequestsByParent (db, parentID, query, limit, page, extra = 'student,trip,parent,teacher,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_REQUEST_COLLECTION)
        .find({ $and: [{ isDeleted: false, parentID }, query] })
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
 * Get parentRequests by teacher.
 * @param {Object} db
 * @param {string} teacherID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='student,trip,parent,teacher,school']
 * @returns {Object}
 */
function getParentRequestsByTeacher (db, teacherID, query, limit, page, extra = 'student,trip,parent,teacher,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.PARENT_REQUEST_COLLECTION)
        .find({ $and: [{ isDeleted: false, teacherID }, query] })
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
 * Get parentRequest by id.
 * @param {Object} db
 * @param {string} parentRequestID
 * @param {string} [extra='student,trip,parent,teacher,school']
 * @returns {Object}
 */
function getParentRequestByID (db, parentRequestID, extra = 'student,trip,parent,teacher,school') {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(parentRequestID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get parentRequests by ids.
 * @param {Object} db
 * @param {Array} parentRequestIDs
 * @param {string} [extra='student,trip,parent,teacher,school']
 * @returns {Object}
 */
function getParentRequestsByIDs (db, parentRequestIDs, extra = 'student,trip,parent,teacher,school') {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .find({ isDeleted: false, _id: { $in: parentRequestIDs } })
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
    let studentIDs = []
    let tripIDs = []
    let parentIDs = []
    let teacherIDs = []
    let schoolIDs = []
    docs.forEach(({ studentID, tripID, parentID, teacherID, schoolID }) => {
      if (e.includes('student') && studentID != null) {
        studentIDs.push(ObjectID(studentID))
      }
      if (e.includes('trip') && tripID != null) {
        tripIDs.push(ObjectID(tripID))
      }
      if (e.includes('parent') && parentID != null) {
        parentIDs.push(ObjectID(parentID))
      }
      if (e.includes('teacher') && teacherID != null) {
        teacherIDs.push(ObjectID(teacherID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let students
    let trips
    let parents
    let teachers
    let schools
    let arr = []
    if (studentIDs.length > 0) {
      let p = getStudentsByIDs(db, studentIDs)
        .then((v) => {
          students = v
        })
      arr.push(p)
    }
    if (tripIDs.length > 0) {
      let p = getTripsByIDs(db, tripIDs)
        .then((v) => {
          trips = v
        })
      arr.push(p)
    }
    if (parentIDs.length > 0) {
      let p = getParentsByIDs(db, parentIDs)
        .then((v) => {
          parents = v
        })
      arr.push(p)
    }
    if (teacherIDs.length > 0) {
      let p = getTeachersByIDs(db, teacherIDs)
        .then((v) => {
          teachers = v
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
          let { studentID, tripID, parentID, teacherID, schoolID } = c
          if (students !== undefined && studentID != null) {
            c.student = students[studentID]
          }
          if (trips !== undefined && tripID != null) {
            c.trip = trips[tripID]
          }
          if (parents !== undefined && parentID != null) {
            c.parent = parents[parentID]
          }
          if (teachers !== undefined && teacherID != null) {
            c.teacher = teachers[teacherID]
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { studentID, tripID, parentID, teacherID, schoolID } = doc
  let arr = []
  if (e.includes('student') && studentID != null) {
    let p = getStudentByID(db, studentID)
      .then((v) => {
        doc.student = v
      })
    arr.push(p)
  }
  if (e.includes('trip') && tripID != null) {
    let p = getTripByID(db, tripID)
      .then((v) => {
        doc.trip = v
      })
    arr.push(p)
  }
  if (e.includes('parent') && parentID != null) {
    let p = getParentByID(db, parentID)
      .then((v) => {
        doc.parent = v
      })
    arr.push(p)
  }
  if (e.includes('teacher') && teacherID != null) {
    let p = getTeacherByID(db, teacherID)
      .then((v) => {
        doc.teacher = v
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
 * Update parentRequest.
 * @param {Object} db
 * @param {string} parentRequestID
 * @param {Object} obj
 * @returns {Object}
 */
function updateParentRequest (db, parentRequestID, obj) {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(parentRequestID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete parentRequest.
 * @param {Object} db
 * @param {string} parentRequestID
 * @returns {Object}
 */
function deleteParentRequest (db, parentRequestID) {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(parentRequestID) },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete parentRequests by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteParentRequestsBySchool (db, schoolID) {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteParentRequest(db, String(_id))
      })
    })
}

/**
 * Confirm parentRequest.
 * @param {Object} db
 * @param {string} parentRequestID
 * @returns {Object}
 */
function confirmParentRequest (db, parentRequestID) {
  let p = db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(parentRequestID) },
      null,
      { $set: { updatedTime: Date.now(), status: 2 } },
      { fields: { _id: 0, tripID: 1, time: 1, studentID: 1 } },
    )
  p.then(({ lastErrorObject: { updatedExisting }, value }) => {
    if (updatedExisting) {
      updateTripsParentRequestByTime (db, value.tripID, value.time, value.studentID)
    }
  })
  return p
}

module.exports = {
  createParentRequest,
  countParentRequests,
  countParentRequestsBySchool,
  countParentRequestsByParent,
  countParentRequestsByTeacher,
  getParentRequests,
  getParentRequestsBySchool,
  getParentRequestsByParent,
  getParentRequestsByTeacher,
  getParentRequestByID,
  getParentRequestsByIDs,
  updateParentRequest,
  deleteParentRequest,
  deleteParentRequestsBySchool,
  confirmParentRequest,
}

const parseQuery = require('./parseQuery')
const { getStudentsByIDs, getStudentByID } = require('./Student')
const { getTripsByIDs, getTripByID, updateTripsParentRequestByTime } = require('./Trip')
const { getParentsByIDs, getParentByID } = require('./Parent')
const { getTeachersByIDs, getTeacherByID } = require('./Teacher')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

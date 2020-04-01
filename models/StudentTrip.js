const { ObjectID } = require('mongodb')

const STUDENT_TRIP_STATUS_WAITING = 0 // dang doi
const STUDENT_TRIP_STATUS_RUNNING = 1 // dang thuc hien
const STUDENT_TRIP_STATUS_END = 2 // bi nha xe tu choi

/**
 * Creats studentTrip.
 * @param {Object} db
 * @param {string} tripID
 * @param {string} studentID
 * @param {number} [status=STUDENT_TRIP_STATUS_WAITING]
 * @param {string} schoolID
 * @returns {Object}
 */
function createStudentTrip (db, tripID, studentID, status = STUDENT_TRIP_STATUS_WAITING, schoolID) {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .insertOne({
      tripID,
      studentID,
      status,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count studentTrips.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countStudentTrips (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count studentTrips by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countStudentTripsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get studentTrips.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='trip,student,school']
 * @returns {Object}
 */
function getStudentTrips (db, query, limit, page, extra = 'trip,student,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_TRIP_COLLECTION)
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
 * Get studentTrips by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='trip,student,school']
 * @returns {Object}
 */
function getStudentTripsBySchool (db, schoolID, query, limit, page, extra = 'trip,student,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_TRIP_COLLECTION)
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
 * Get studentTrip by id.
 * @param {Object} db
 * @param {string} studentTripID
 * @param {string} [extra='trip,student,school']
 * @returns {Object}
 */
function getStudentTripByID (db, studentTripID, extra = 'trip,student,school') {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(studentTripID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get studentTrips by ids.
 * @param {Object} db
 * @param {Array} studentTripIDs
 * @param {string} [extra='trip,student,school']
 * @returns {Object}
 */
function getStudentTripsByIDs (db, studentTripIDs, extra = 'trip,student,school') {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .find({ isDeleted: false, _id: { $in: studentTripIDs } })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Get studentTrips by trip.
 * @param {Object} db
 * @param {Array} tripID
 * @param {string} [extra='trip,student,school']
 * @returns {Object}
 */
function getStudentTripsByTrip (db, tripID, extra = 'trip,student,school') {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .find({ isDeleted: false, tripID })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get studentTrips by student.
 * @param {Object} db
 * @param {Array} studentID
 * @param {string} [extra='trip,student,school']
 * @returns {Object}
 */
function getStudentTripsByStudent (db, studentID, extra = 'trip,student,school') {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .find({ isDeleted: false, studentID })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
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
    let tripIDs = []
    let studentIDs = []
    let schoolIDs = []
    docs.forEach(({ tripID, studentID, schoolID }) => {
      if (e.includes('trip') && tripID != null) {
        tripIDs.push(ObjectID(tripID))
      }
      if (e.includes('student') && studentID != null) {
        studentIDs.push(ObjectID(studentID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let trips
    let students
    let schools
    let arr = []
    if (tripIDs.length > 0) {
      let p = getTripsByIDs(db, tripIDs)
        .then((v) => {
          trips = v
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
          let { tripID, studentID, schoolID } = c
          if (trips !== undefined && tripID != null) {
            c.trip = trips[tripID]
          }
          if (students !== undefined && studentID != null) {
            c.student = students[studentID]
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { tripID, studentID, schoolID } = doc
  let arr = []
  if (e.includes('trip') && tripID != null) {
    let p = getTripByID(db, tripID)
      .then((v) => {
        doc.trip = v
      })
    arr.push(p)
  }
  if (e.includes('student') && studentID != null) {
    let p = getStudentByID(db, studentID)
      .then((v) => {
        doc.student = v
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
 * Update studentTrip.
 * @param {Object} db
 * @param {string} studentTripID
 * @param {Object} obj
 * @returns {Object}
 */
function updateStudentTrip (db, studentTripID, obj) {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(studentTripID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Update studentTrip status.
 * @param {Object} db
 * @param {string} studentTripID
 * @param {number} status
 * @returns {Object}
 */
function updateStudentTripStatus (db, studentTripID, status) {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(studentTripID) },
      { $set: { updatedTime: Date.now(), status } },
    )
}

/**
 * Delete studentTrip.
 * @param {Object} db
 * @param {string} studentTripID
 * @returns {Object}
 */
function deleteStudentTrip (db, studentTripID) {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(studentTripID) },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete studentTrips by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteStudentTripsBySchool (db, schoolID) {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteStudentTrip(db, String(_id))
      })
    })
}

/**
 * Delete studentTrips.
 * @param {Object} db
 * @param {string} key
 * @param {(string|Array)} value
 * @returns {Object}
 */
function deleteStudentTrips (db, key, value) {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .updateMany(
      { isDeleted: false, [key]: Array.isArray(value) ? { $in: value } : value },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createStudentTrip,
  countStudentTrips,
  countStudentTripsBySchool,
  getStudentTrips,
  getStudentTripsBySchool,
  getStudentTripByID,
  getStudentTripsByIDs,
  getStudentTripsByTrip,
  getStudentTripsByStudent,
  updateStudentTrip,
  updateStudentTripStatus,
  deleteStudentTrip,
  deleteStudentTripsBySchool,
  deleteStudentTrips,
}

const parseQuery = require('./parseQuery')
const { getTripsByIDs, getTripByID } = require('./Trip')
const { getStudentsByIDs, getStudentByID } = require('./Student')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

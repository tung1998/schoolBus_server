const { ObjectID } = require('mongodb')

/**
 * Creats studentTrip.
 * @param {Object} db
 * @param {string} tripID
 * @param {string} studentID
 * @param {number} status
 * @returns {Object}
 */
function createStudentTrip (db, tripID, studentID, status) {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .insertOne({
      tripID,
      studentID,
      status,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count studentTrips.
 * @param {Object} db
 * @returns {Object}
 */
function countStudentTrips (db) {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get studentTrips.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='trip,student']
 * @returns {Object}
 */
function getStudentTrips (db, page, extra = 'trip,student') {
  return db.collection(process.env.STUDENT_TRIP_COLLECTION)
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
 * Get studentTrip by id.
 * @param {Object} db
 * @param {string} studentTripID
 * @param {string} [extra='trip,student']
 * @returns {Object}
 */
function getStudentTripByID (db, studentTripID, extra = 'trip,student') {
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
 * @param {string} [extra='trip,student']
 * @returns {Object}
 */
function getStudentTripsByIDs (db, studentTripIDs, extra = 'trip,student') {
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
    docs.forEach(({ tripID, studentID }) => {
      if (e.includes('trip') && tripID != null) {
        tripIDs.push(ObjectID(tripID))
      }
      if (e.includes('student') && studentID != null) {
        studentIDs.push(ObjectID(studentID))
      }
    })
    let trips
    let students
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
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { tripID, studentID } = c
          if (trips !== undefined && tripID != null) {
            c.trip = trips[tripID]
          }
          if (students !== undefined && studentID != null) {
            c.student = students[studentID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { tripID, studentID } = doc
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

module.exports = {
  createStudentTrip,
  countStudentTrips,
  getStudentTrips,
  getStudentTripByID,
  getStudentTripsByIDs,
  updateStudentTrip,
  deleteStudentTrip,
}

const { getTripsByIDs, getTripByID } = require('./Trip')
const { getStudentsByIDs, getStudentByID } = require('./Student')

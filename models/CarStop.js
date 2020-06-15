const { ObjectID } = require('mongodb')

/**
 * Creats carStop.
 * @param {Object} db
 * @param {number} stopType
 * @param {string} name
 * @param {string} address
 * @param {Array} location
 * @param {string} schoolID
 * @returns {Object}
 */
function createCarStop (db, stopType, name, address, location, schoolID) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .insertOne({
      stopType,
      name,
      address,
      location,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carStops.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countCarStops (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_STOP_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count carStops by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countCarStopsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_STOP_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get carStops.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getCarStops (db, query, limit, page, extra = 'school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_STOP_COLLECTION)
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
 * Get carStops by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getCarStopsBySchool (db, schoolID, query, limit, page, extra = 'school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_STOP_COLLECTION)
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
 * Get carStop by id.
 * @param {Object} db
 * @param {string} carStopID
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getCarStopByID (db, carStopID, extra = 'school') {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(carStopID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get carStops by ids.
 * @param {Object} db
 * @param {Array} carStopIDs
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getCarStopsByIDs (db, carStopIDs, extra = 'school') {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .find({ isDeleted: false, _id: { $in: carStopIDs } })
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
    docs.forEach(({ schoolID }) => {
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let schools
    let arr = []
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
          let { schoolID } = c
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { schoolID } = doc
  let arr = []
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
 * Update carStop.
 * @param {Object} db
 * @param {string} carStopID
 * @param {Object} obj
 * @returns {Object}
 */
function updateCarStop (db, carStopID, obj) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carStopID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete carStop.
 * @param {Object} db
 * @param {string} carStopID
 * @returns {Object}
 */
function deleteCarStop (db, carStopID) {
  let p = db.collection(process.env.CAR_STOP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carStopID) },
      { $set: { isDeleted: true } },
    )
  p.then(({ matchedCount }) => {
    if (matchedCount === 1) {
      updateStudentsDeleteCarStop(db, carStopID)
      updateStudentListsRemoveCarStop(db, carStopID)
      updateRoutesRemoveCarStop(db, carStopID)
      updateTripsRemoveCarStop(db, carStopID)
    }
  })
  return p
}

/**
 * Delete carStops by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteCarStopsBySchool (db, schoolID) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteCarStop(db, String(_id))
      })
    })
}

module.exports = {
  createCarStop,
  countCarStops,
  countCarStopsBySchool,
  getCarStops,
  getCarStopsBySchool,
  getCarStopByID,
  getCarStopsByIDs,
  updateCarStop,
  deleteCarStop,
  deleteCarStopsBySchool,
}

const parseQuery = require('./parseQuery')
const { getSchoolsByIDs, getSchoolByID } = require('./School')
const { updateStudentsDeleteCarStop } = require('./Student')
const { updateStudentListsRemoveCarStop } = require('./StudentList')
const { updateRoutesRemoveCarStop } = require('./Route')
const { updateTripsRemoveCarStop } = require('./Trip')

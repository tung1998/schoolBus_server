const { ObjectID } = require('mongodb')

/**
 * Creats carStop.
 * @param {Object} db
 * @param {number} stopType
 * @param {string} name
 * @param {string} address
 * @param {Array} location
 * @returns {Object}
 */
function createCarStop (db, stopType, name, address, location) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .insertOne({
      stopType,
      name,
      address,
      location,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carStops.
 * @param {Object} db
 * @returns {Object}
 */
function countCarStops (db) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get carStops.
 * @param {Object} db
 * @param {number} limit
 * @param {number} page
 * @returns {Object}
 */
function getCarStops (db, limit, page) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .find({ isDeleted: false })
    .skip((limit || process.env.LIMIT_DOCUMENT_PER_PAGE) * (page - 1))
    .limit(limit || Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
}

/**
 * Get carStop by id.
 * @param {Object} db
 * @param {string} carStopID
 * @returns {Object}
 */
function getCarStopByID (db, carStopID) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(carStopID) })
}

/**
 * Get carStops by ids.
 * @param {Object} db
 * @param {Array} carStopIDs
 * @returns {Object}
 */
function getCarStopsByIDs (db, carStopIDs) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .find({ isDeleted: false, _id: { $in: carStopIDs } })
    .toArray()
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
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
    }
  })
  return p
}

module.exports = {
  createCarStop,
  countCarStops,
  getCarStops,
  getCarStopByID,
  getCarStopsByIDs,
  updateCarStop,
  deleteCarStop,
}

const { updateStudentsDeleteCarStop } = require('./Student')
const { updateStudentListsRemoveCarStop } = require('./StudentList')

const { ObjectID } = require('mongodb')

/**
 * Creats school.
 * @param {Object} db
 * @param {string} name
 * @param {string} address
 * @param {number} status
 * @returns {Object}
 */
function createSchool (db, name, address, status) {
  return db.collection(process.env.SCHOOL_COLLECTION)
    .insertOne({
      name,
      address,
      status,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count schools.
 * @param {Object} db
 * @returns {Object}
 */
function countSchools (db) {
  return db.collection(process.env.SCHOOL_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get schools.
 * @param {Object} db
 * @param {number} page
 * @returns {Object}
 */
function getSchools (db, page) {
  return db.collection(process.env.SCHOOL_COLLECTION)
    .find({ isDeleted: false })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
}

/**
 * Get school by id.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function getSchoolByID (db, schoolID) {
  return db.collection(process.env.SCHOOL_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(schoolID) })
}

/**
 * Get schools by ids.
 * @param {Object} db
 * @param {Array} schoolIDs
 * @returns {Object}
 */
function getSchoolsByIDs (db, schoolIDs) {
  return db.collection(process.env.SCHOOL_COLLECTION)
    .find({ isDeleted: false, _id: { $in: schoolIDs } })
    .toArray()
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Update school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} obj
 * @returns {Object}
 */
function updateSchool (db, schoolID, obj) {
  return db.collection(process.env.SCHOOL_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(schoolID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteSchool (db, schoolID) {
  let p = db.collection(process.env.SCHOOL_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(schoolID) },
      { $set: { isDeleted: true } },
    )
  p.then(({ matchedCount }) => {
    if (matchedCount === 1) {
      deleteAdministratorsBySchool(db, schoolID)
      deleteCarsBySchool(db, schoolID)
      deleteCarFuelsBySchool(db, schoolID)
      deleteCarMaintenancesBySchool(db, schoolID)
      deleteCarModelsBySchool(db, schoolID)
      deleteCarStopsBySchool(db, schoolID)
      deleteCarStopTripsBySchool(db, schoolID)
      deleteClassesBySchool(db, schoolID)
      deleteConfigsBySchool(db, schoolID)
      deleteDriversBySchool(db, schoolID)
      deleteFeedbacksBySchool(db, schoolID)
      deleteParentRequestsBySchool(db, schoolID)
      deleteRoutesBySchool(db, schoolID)
      deleteStudentsBySchool(db, schoolID)
      deleteTeachersBySchool(db, schoolID)
      deleteTripsBySchool(db, schoolID)
    }
  })
  return p
}

module.exports = {
  createSchool,
  countSchools,
  getSchools,
  getSchoolByID,
  getSchoolsByIDs,
  updateSchool,
  deleteSchool,
}

const { deleteAdministratorsBySchool } = require('./Administrator')
const { deleteCarsBySchool } = require('./Car')
const { deleteCarFuelsBySchool } = require('./CarFuel')
const { deleteCarMaintenancesBySchool } = require('./CarMaintenance')
const { deleteCarModelsBySchool } = require('./CarModel')
const { deleteCarStopsBySchool } = require('./CarStop')
const { deleteCarStopTripsBySchool } = require('./CarStopTrip')
const { deleteClassesBySchool } = require('./Class')
const { deleteConfigsBySchool } = require('./Config')
const { deleteDriversBySchool } = require('./Driver')
const { deleteFeedbacksBySchool } = require('./Feedback')
const { deleteParentRequestsBySchool } = require('./ParentRequest')
const { deleteRoutesBySchool } = require('./Route')
const { deleteStudentsBySchool } = require('./Student')
const { deleteTeachersBySchool } = require('./Teacher')
const { deleteTripsBySchool } = require('./Trip')

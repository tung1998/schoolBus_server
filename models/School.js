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
  return db.collection(process.env.SCHOOL_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(schoolID) },
      { $set: { isDeleted: true } },
    )
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
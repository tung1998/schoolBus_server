const { ObjectID } = require('mongodb')

/**
 * Creats studentList.
 * @param {Object} db
 * @param {string} name
 * @param {Array} studentIDs
 * @returns {Object}
 */
function createStudentList (db, name, studentIDs) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .insertOne({
      name,
      studentIDs,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count studentLists.
 * @param {Object} db
 * @returns {Object}
 */
function countStudentLists (db) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get studentLists.
 * @param {Object} db
 * @param {number} page
 * @returns {Object}
 */
function getStudentLists (db, page) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .find({ isDeleted: false })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
}

/**
 * Get studentList by id.
 * @param {Object} db
 * @param {string} studentListID
 * @returns {Object}
 */
function getStudentListByID (db, studentListID) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(studentListID) })
}

/**
 * Get studentLists by ids.
 * @param {Object} db
 * @param {Array} studentListIDs
 * @returns {Object}
 */
function getStudentListsByIDs (db, studentListIDs) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .find({ isDeleted: false, _id: { $in: studentListIDs } })
    .toArray()
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Update studentList.
 * @param {Object} db
 * @param {string} studentListID
 * @param {Object} obj
 * @returns {Object}
 */
function updateStudentList (db, studentListID, obj) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(studentListID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete studentList.
 * @param {Object} db
 * @param {string} studentListID
 * @returns {Object}
 */
function deleteStudentList (db, studentListID) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(studentListID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createStudentList,
  countStudentLists,
  getStudentLists,
  getStudentListByID,
  getStudentListsByIDs,
  updateStudentList,
  deleteStudentList,
}

const { ObjectID } = require('mongodb')

/**
 * Creats studentList.
 * @param {Object} db
 * @param {string} name
 * @param {Array} [studentIDs=[]]
 * @returns {Object}
 */
function createStudentList (db, name, studentIDs = []) {
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
 * @param {string} [extra='student']
 * @returns {Object}
 */
function getStudentLists (db, page, extra = 'student') {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
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
 * Get studentList by id.
 * @param {Object} db
 * @param {string} studentListID
 * @param {string} [extra='student']
 * @returns {Object}
 */
function getStudentListByID (db, studentListID, extra = 'student') {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(studentListID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get studentLists by ids.
 * @param {Object} db
 * @param {Array} studentListIDs
 * @param {string} [extra='student']
 * @returns {Object}
 */
function getStudentListsByIDs (db, studentListIDs, extra = 'student') {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .find({ isDeleted: false, _id: { $in: studentListIDs } })
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
    docs.forEach((c) => {
      if (e.includes('student') && Array.isArray(c.studentIDs)) {
        studentIDs.push(...c.studentIDs.map(ObjectID))
      }
    })
    let students
    let arr = []
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
          if (students !== undefined && Array.isArray(c.studentIDs)) {
            c.students = c.studentIDs.map(e => students[e])
          }
        })
        return docs
      })
  }
  let doc = docs
  let { studentIDs } = doc
  let arr = []
  if (e.includes('student') && Array.isArray(studentIDs)) {
    let p = getStudentsByIDs(db, studentIDs.map(ObjectID))
      .then((v) => {
        doc.students = doc.studentIDs.map(c => v[c])
      })
    arr.push(p)
  }
  return Promise.all(arr)
    .then(() => doc)
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
 * Update studentList add studentIDs.
 * @param {Object} db
 * @param {string} studentListID
 * @param {(Array|string)} studentIDs
 * @returns {Object}
 */
function updateStudentListAddStudentIDs (db, studentListID, studentIDs) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(studentListID) },
      { $set: { updatedTime: Date.now() }, $addToSet: { studentIDs: Array.isArray(studentIDs) ? { $each: studentIDs } : studentIDs } },
    )
}

/**
 * Update studentList remove studentIDs.
 * @param {Object} db
 * @param {string} studentListID
 * @param {(Array|string)} studentIDs
 * @returns {Object}
 */
function updateStudentListRemoveStudentIDs (db, studentListID, studentIDs) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(studentListID) },
      { $set: { updatedTime: Date.now() }, $pullAll: { studentIDs: Array.isArray(studentIDs) ? studentIDs : [studentIDs] } },
    )
}

/**
 * Update studentLists remove studentIDs.
 * @param {Object} db
 * @param {(Array|string)} studentIDs
 * @returns {Object}
 */
function updateStudentListsRemoveStudentIDs (db, studentIDs) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .updateMany(
      { isDeleted: false },
      { $set: { updatedTime: Date.now() }, $pullAll: { studentIDs: Array.isArray(studentIDs) ? studentIDs : [studentIDs] } },
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
  updateStudentListAddStudentIDs,
  updateStudentListRemoveStudentIDs,
  updateStudentListsRemoveStudentIDs,
  deleteStudentList,
}

const { getStudentsByIDs } = require('./Student')

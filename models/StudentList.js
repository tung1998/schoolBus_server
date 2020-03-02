const { ObjectID } = require('mongodb')

/**
 * Creats studentList.
 * @param {Object} db
 * @param {string} name
 * @param {Array} [studentIDs=[]]
 * @param {Array} carStopIDs
 * @returns {Object}
 */
function createStudentList (db, name, studentIDs = [], carStopIDs) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .insertOne({
      name,
      studentIDs,
      carStopIDs,
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
 * @param {string} [extra='student,carStop']
 * @returns {Object}
 */
function getStudentLists (db, page, extra = 'student,carStop') {
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
 * @param {string} [extra='student,carStop']
 * @returns {Object}
 */
function getStudentListByID (db, studentListID, extra = 'student,carStop') {
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
 * @param {string} [extra='student,carStop']
 * @returns {Object}
 */
function getStudentListsByIDs (db, studentListIDs, extra = 'student,carStop') {
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
    let carStopIDs = []
    docs.forEach((c) => {
      if (e.includes('student') && Array.isArray(c.studentIDs)) {
        studentIDs.push(...c.studentIDs.map(ObjectID))
      }
      if (e.includes('carStop') && Array.isArray(c.carStopIDs)) {
        carStopIDs.push(...c.carStopIDs.map(ObjectID))
      }
    })
    let students
    let carStops
    let arr = []
    if (studentIDs.length > 0) {
      let p = getStudentsByIDs(db, studentIDs)
        .then((v) => {
          students = v
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
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          if (students !== undefined && Array.isArray(c.studentIDs)) {
            c.students = c.studentIDs.map(e => students[e])
          }
          if (carStops !== undefined && Array.isArray(c.carStopIDs)) {
            c.carStops = c.carStopIDs.map(e => carStops[e])
          }
        })
        return docs
      })
  }
  let doc = docs
  let { studentIDs, carStopIDs } = doc
  let arr = []
  if (e.includes('student') && Array.isArray(studentIDs)) {
    let p = getStudentsByIDs(db, studentIDs.map(ObjectID))
      .then((v) => {
        doc.students = studentIDs.map(c => v[c])
      })
    arr.push(p)
  }
  if (e.includes('carStop') && Array.isArray(carStopIDs)) {
    let p = getCarStopsByIDs(db, carStopIDs.map(ObjectID))
      .then((v) => {
        doc.carStops = carStopIDs.map(c => v[c])
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
 * @param {(Array|string)} carStopIDs
 * @returns {Object}
 */
function updateStudentListAddStudentIDsCarStopIDs (db, studentListID, studentIDs, carStopIDs) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(studentListID) },
      {
        $set: { updatedTime: Date.now() },
        $addToSet: {
          studentIDs: Array.isArray(studentIDs) ? { $each: studentIDs } : studentIDs,
          carStopIDs: Array.isArray(carStopIDs) ? { $each: carStopIDs } : carStopIDs,
        },
      },
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

/**
 * Update studentLists replace carStop.
 * @param {Object} db
 * @param {string} studentID
 * @param {string} carStopID
 * @param {string} newCarStopID
 * @returns {Object}
 */
function updateStudentListsReplaceCarStop (db, studentID, carStopID, newCarStopID) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .find({ isDeleted: false, studentIDs: studentID, carStopIDs: { $elemMatch: { $exists: true } } })
    .toArray()
    .then(v => addExtra(db, v, 'student'))
    .then((v) => {
      v.forEach(({ _id, students, carStopIDs }) => {
        let b = false
        if (carStopID !== null && !students.some(e => e.carStopID === carStopID) && carStopIDs.includes(carStopID)) {
          b = true
          carStopIDs.splice(carStopIDs.indexOf(carStopID), 1)
        }
        if (newCarStopID !== null && !carStopIDs.includes(newCarStopID)) {
          b = true
          carStopIDs.push(newCarStopID)
        }
        if (b) {
          db.collection(process.env.STUDENT_LIST_COLLECTION)
            .updateOne(
              { isDeleted: false, _id },
              { $set: { updatedTime: Date.now(), carStopIDs } },
            )
        }
      })
    })
}

module.exports = {
  createStudentList,
  countStudentLists,
  getStudentLists,
  getStudentListByID,
  getStudentListsByIDs,
  updateStudentList,
  updateStudentListAddStudentIDsCarStopIDs,
  updateStudentListRemoveStudentIDs,
  updateStudentListsRemoveStudentIDs,
  deleteStudentList,
  updateStudentListsReplaceCarStop,
}

const { getStudentsByIDs } = require('./Student')
const { getCarStopsByIDs } = require('./CarStop')

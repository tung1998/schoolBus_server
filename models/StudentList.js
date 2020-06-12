const { ObjectID } = require('mongodb')

/**
 * Creats studentList.
 * @param {Object} db
 * @param {string} name
 * @param {Array} [studentIDs=[]]
 * @param {Array} carStopIDs
 * @param {string} schoolID
 * @returns {Object}
 */
function createStudentList (db, name, studentIDs = [], carStopIDs, schoolID) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .insertOne({
      name,
      studentIDs,
      carStopIDs,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count studentLists.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countStudentLists (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_LIST_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count studentLists by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countStudentListsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_LIST_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get studentLists.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='student,carStop,school']
 * @returns {Object}
 */
function getStudentLists (db, query, limit, page, extra = 'student,carStop,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_LIST_COLLECTION)
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
 * Get studentLists by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='student,carStop,school']
 * @returns {Object}
 */
function getStudentListsBySchool (db, schoolID, query, limit, page, extra = 'student,carStop,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_LIST_COLLECTION)
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
 * Get studentList by id.
 * @param {Object} db
 * @param {string} studentListID
 * @param {string} [extra='student,carStop,school']
 * @returns {Object}
 */
function getStudentListByID (db, studentListID, extra = 'student,carStop,school') {
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
 * @param {string} [extra='student,carStop,school']
 * @returns {Object}
 */
function getStudentListsByIDs (db, studentListIDs, extra = 'student,carStop,school') {
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
    let schoolIDs = []
    docs.forEach((c) => {
      if (e.includes('student') && Array.isArray(c.studentIDs)) {
        studentIDs.push(...c.studentIDs.map(ObjectID))
      }
      if (e.includes('carStop') && Array.isArray(c.carStopIDs)) {
        carStopIDs.push(...c.carStopIDs.map(ObjectID))
      }
      if (e.includes('school') && c.schoolID != null) {
        schoolIDs.push(ObjectID(c.schoolID))
      }
    })
    let students
    let carStops
    let schools
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
          if (students !== undefined && Array.isArray(c.studentIDs)) {
            c.students = c.studentIDs.map(e => students[e])
          }
          if (carStops !== undefined && Array.isArray(c.carStopIDs)) {
            c.carStops = c.carStopIDs.map(e => carStops[e])
          }
          if (schools !== undefined && c.schoolID != null) {
            c.school = schools[c.schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { studentIDs, carStopIDs, schoolID } = doc
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
 * Update studentList.
 * @param {Object} db
 * @param {string} studentListID
 * @param {Object} obj
 * @returns {Object}
 */
function updateStudentList (db, studentListID, obj) {
  let p = db.collection(process.env.STUDENT_LIST_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(studentListID) },
      null,
      { $set: { updatedTime: Date.now(), ...obj } },
      { fields: { _id: 0, carStopIDs: 1 } },
    )
  p.then(({ lastErrorObject: { updatedExisting }, value }) => {
    if (updatedExisting) {

    }
  })
  return p
}

/**
 * Update studentLists remove student carStop.
 * @param {Object} db
 * @param {string} studentID
 * @param {string} carStopID
 * @returns {Object}
 */
function updateStudentListsRemoveStudentCarStop (db, studentID, carStopID) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .find({ isDeleted: false, studentIDs: { $elemMatch: { $eq: studentID } } })
    .toArray()
    .then(v => addExtra(db, v, 'student'))
    .then((v) => {
      v.forEach(({ _id, studentIDs, students, carStopIDs }) => {
        studentIDs.splice(studentIDs.indexOf(studentID), 1)
        if (
          carStopID !== null
          && !students.some(e => e != null && e.carStopID === carStopID && String(e._id) !== studentID)
          && Array.isArray(carStopIDs)
          && carStopIDs.includes(carStopID)
        ) {
          carStopIDs.splice(carStopIDs.indexOf(carStopID), 1)
        }
        db.collection(process.env.STUDENT_LIST_COLLECTION)
          .updateOne(
            { isDeleted: false, _id },
            { $set: { updatedTime: Date.now(), carStopIDs, studentIDs } },
          )
      })
    })
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
 * Delete studentLists by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteStudentListsBySchool (db, schoolID) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteStudentList(db, String(_id))
      })
    })
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
    .find({ isDeleted: false, studentIDs: { $elemMatch: { $eq: studentID } }, carStopIDs: { $ne: null } })
    .toArray()
    .then(v => addExtra(db, v, 'student'))
    .then((v) => {
      v.forEach(({ _id, students, carStopIDs }) => {
        let b = false
        if (carStopID !== null && !students.some(e => e != null && e.carStopID === carStopID) && carStopIDs.includes(carStopID)) {
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

/**
 * Update studentLists remove carStop.
 * @param {Object} db
 * @param {string} carStopID
 * @returns {Object}
 */
function updateStudentListsRemoveCarStop (db, carStopID) {
  return db.collection(process.env.STUDENT_LIST_COLLECTION)
    .updateMany(
      { isDeleted: false, carStopIDs: carStopID },
      { $set: { updatedTime: Date.now() }, $pullAll: { carStopIDs: [carStopID] } },
    )
}

module.exports = {
  createStudentList,
  countStudentLists,
  countStudentListsBySchool,
  getStudentLists,
  getStudentListsBySchool,
  getStudentListByID,
  getStudentListsByIDs,
  updateStudentList,
  updateStudentListsRemoveStudentCarStop,
  deleteStudentList,
  deleteStudentListsBySchool,
  updateStudentListsReplaceCarStop,
  updateStudentListsRemoveCarStop,
}

const parseQuery = require('./parseQuery')
const { getStudentsByIDs } = require('./Student')
const { getCarStopsByIDs } = require('./CarStop')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

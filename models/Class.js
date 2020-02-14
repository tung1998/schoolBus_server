const { ObjectID } = require('mongodb')

/**
 * Creats class.
 * @param {Object} db
 * @param {string} name
 * @param {string} schoolID
 * @param {string} teacherID
 * @returns {Object}
 */
function createClass (db, name, schoolID, teacherID) {
  return db.collection(process.env.CLASS_COLLECTION)
    .insertOne({
      name,
      schoolID,
      teacherID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count classes.
 * @param {Object} db
 * @returns {Object}
 */
function countClasses (db) {
  return db.collection(process.env.CLASS_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get classes.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='school,teacher']
 * @returns {Object}
 */
function getClasses (db, page, extra = 'school,teacher') {
  return db.collection(process.env.CLASS_COLLECTION)
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
 * Get class by id.
 * @param {Object} db
 * @param {string} classID
 * @param {string} [extra='school,teacher']
 * @returns {Object}
 */
function getClassByID (db, classID, extra = 'school,teacher') {
  return db.collection(process.env.CLASS_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(classID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get classes by ids.
 * @param {Object} db
 * @param {Array} classIDs
 * @param {string} [extra='school,teacher']
 * @returns {Object}
 */
function getClassesByIDs (db, classIDs, extra = 'school,teacher') {
  return db.collection(process.env.CLASS_COLLECTION)
    .find({ isDeleted: false, _id: { $in: classIDs } })
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
    let teacherIDs = []
    docs.forEach(({ schoolID, teacherID }) => {
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
      if (e.includes('teacher') && teacherID != null) {
        teacherIDs.push(ObjectID(teacherID))
      }
    })
    let schools
    let teachers
    let arr = []
    if (schoolIDs.length > 0) {
      let p = getSchoolsByIDs(db, schoolIDs)
        .then((v) => {
          schools = v
        })
      arr.push(p)
    }
    if (teacherIDs.length > 0) {
      let p = getTeachersByIDs(db, teacherIDs)
        .then((v) => {
          teachers = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { schoolID, teacherID } = c
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
          if (teachers !== undefined && teacherID != null) {
            c.teacher = teachers[teacherID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { schoolID, teacherID } = doc
  let arr = []
  if (e.includes('school') && schoolID != null) {
    let p = getSchoolByID(db, schoolID)
      .then((v) => {
        doc.school = v
      })
    arr.push(p)
  }
  if (e.includes('teacher') && teacherID != null) {
    let p = getTeacherByID(db, teacherID)
      .then((v) => {
        doc.teacher = v
      })
    arr.push(p)
  }
  return Promise.all(arr)
    .then(() => doc)
}

/**
 * Update class.
 * @param {Object} db
 * @param {string} classID
 * @param {Object} obj
 * @returns {Object}
 */
function updateClass (db, classID, obj) {
  return db.collection(process.env.CLASS_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(classID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete class.
 * @param {Object} db
 * @param {string} classID
 * @returns {Object}
 */
function deleteClass (db, classID) {
  return db.collection(process.env.CLASS_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(classID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createClass,
  countClasses,
  getClasses,
  getClassByID,
  getClassesByIDs,
  updateClass,
  deleteClass,
}

const { getSchoolsByIDs, getSchoolByID } = require('./School')
const { getTeachersByIDs, getTeacherByID } = require('./Teacher')
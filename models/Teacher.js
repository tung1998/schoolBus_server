const { ObjectID } = require('mongodb')

/**
 * Creats teacher.
 * @param {Object} db
 * @param {string} schoolID
 * @param {string} name
 * @returns {Object}
 */
function createTeacher (db, schoolID, name) {
  return db.collection(process.env.TEACHER_COLLECTION)
    .insertOne({
      schoolID,
      name,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count teachers.
 * @param {Object} db
 * @returns {Object}
 */
function countTeachers (db) {
  return db.collection(process.env.TEACHER_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get teachers.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getTeachers (db, page, extra = 'school') {
  return db.collection(process.env.TEACHER_COLLECTION)
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
 * Get teacher by id.
 * @param {Object} db
 * @param {string} teacherID
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getTeacherByID (db, teacherID, extra = 'school') {
  return db.collection(process.env.TEACHER_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(teacherID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get teachers by ids.
 * @param {Object} db
 * @param {Array} teacherIDs
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getTeachersByIDs (db, teacherIDs, extra = 'school') {
  return db.collection(process.env.TEACHER_COLLECTION)
    .find({ isDeleted: false, _id: { $in: teacherIDs } })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Get teachers by school.
 * @param {Object} db
 * @param {Array} schoolID
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getTeachersBySchool (db, schoolID, extra = 'school') {
  return db.collection(process.env.TEACHER_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
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
 * Update teacher.
 * @param {Object} db
 * @param {string} teacherID
 * @param {Object} obj
 * @returns {Object}
 */
function updateTeacher (db, teacherID, obj) {
  return db.collection(process.env.TEACHER_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(teacherID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete teacher.
 * @param {Object} db
 * @param {string} teacherID
 * @returns {Object}
 */
function deleteTeacher (db, teacherID) {
  return db.collection(process.env.TEACHER_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(teacherID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createTeacher,
  countTeachers,
  getTeachers,
  getTeacherByID,
  getTeachersByIDs,
  getTeachersBySchool,
  updateTeacher,
  deleteTeacher,
}

const { getSchoolsByIDs, getSchoolByID } = require('./School')

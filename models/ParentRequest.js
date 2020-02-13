const { ObjectID } = require('mongodb')

/**
 * Creats parentRequest.
 * @param {Object} db
 * @param {string} requestID
 * @param {string} studentID
 * @param {string} content
 * @param {boolean} approve
 * @returns {Object}
 */
function createParentRequest (db, requestID, studentID, content, approve) {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .insertOne({
      requestID,
      studentID,
      content,
      approve,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count parentRequests.
 * @param {Object} db
 * @returns {Object}
 */
function countParentRequests (db) {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get parentRequests.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='student']
 * @returns {Object}
 */
function getParentRequests (db, page, extra = 'student') {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
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
 * Get parentRequest by id.
 * @param {Object} db
 * @param {string} parentRequestID
 * @param {string} [extra='student']
 * @returns {Object}
 */
function getParentRequestByID (db, parentRequestID, extra = 'student') {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(parentRequestID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get parentRequests by ids.
 * @param {Object} db
 * @param {Array} parentRequestIDs
 * @param {string} [extra='student']
 * @returns {Object}
 */
function getParentRequestsByIDs (db, parentRequestIDs, extra = 'student') {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .find({ isDeleted: false, _id: { $in: parentRequestIDs } })
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
    docs.forEach(({ studentID }) => {
      if (e.includes('student') && studentID != null) {
        studentIDs.push(ObjectID(studentID))
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
          let { studentID } = c
          if (students !== undefined && studentID != null) {
            c.student = students[studentID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { studentID } = doc
  let arr = []
  if (e.includes('student') && studentID != null) {
    let p = getStudentByID(db, studentID)
      .then((v) => {
        doc.student = v
      })
    arr.push(p)
  }
  return Promise.all(arr)
    .then(() => doc)
}

/**
 * Update parentRequest.
 * @param {Object} db
 * @param {string} parentRequestID
 * @param {Object} obj
 * @returns {Object}
 */
function updateParentRequest (db, parentRequestID, obj) {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(parentRequestID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete parentRequest.
 * @param {Object} db
 * @param {string} parentRequestID
 * @returns {Object}
 */
function deleteParentRequest (db, parentRequestID) {
  return db.collection(process.env.PARENT_REQUEST_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(parentRequestID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createParentRequest,
  countParentRequests,
  getParentRequests,
  getParentRequestByID,
  getParentRequestsByIDs,
  updateParentRequest,
  deleteParentRequest,
}

const { getStudentsByIDs, getStudentByID } = require('./Student')

const { ObjectID } = require('mongodb')

/**
 * Creats feedback.
 * @param {Object} db
 * @param {string} userID
 * @param {number} type
 * @param {string} title
 * @param {string} content
 * @param {number} [status=0]
 * @param {string} schoolID
 * @returns {Object}
 */
function createFeedback (db, userID, type, title, content, status = 0, schoolID) {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .insertOne({
      userID,
      type,
      title,
      content,
      status,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count feedbacks.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countFeedbacks (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.FEEDBACK_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count feedbacks by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countFeedbacksBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.FEEDBACK_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Count feedbacks by user.
 * @param {Object} db
 * @param {string} userID
 * @param {Object} query
 * @returns {Object}
 */
function countFeedbacksByUser (db, userID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.FEEDBACK_COLLECTION)
        .find({ $and: [{ isDeleted: false, userID }, query] })
        .count()
    ))
}

/**
 * Get feedbacks.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,responseUser,school']
 * @returns {Object}
 */
function getFeedbacks (db, query, limit, page, extra = 'user,responseUser,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.FEEDBACK_COLLECTION)
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
 * Get feedbacks by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,responseUser,school']
 * @returns {Object}
 */
function getFeedbacksBySchool (db, schoolID, query, limit, page, extra = 'user,responseUser,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.FEEDBACK_COLLECTION)
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
 * Get feedbacks by user.
 * @param {Object} db
 * @param {string} userID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,responseUser,school']
 * @returns {Object}
 */
function getFeedbacksByUser (db, userID, query, limit, page, extra = 'user,responseUser,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.FEEDBACK_COLLECTION)
        .find({ $and: [{ isDeleted: false, userID }, query] })
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
 * Get feedback by id.
 * @param {Object} db
 * @param {string} feedbackID
 * @param {string} [extra='user,responseUser,school']
 * @returns {Object}
 */
function getFeedbackByID (db, feedbackID, extra = 'user,responseUser,school') {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(feedbackID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get feedbacks by ids.
 * @param {Object} db
 * @param {Array} feedbackIDs
 * @param {string} [extra='user,responseUser,school']
 * @returns {Object}
 */
function getFeedbacksByIDs (db, feedbackIDs, extra = 'user,responseUser,school') {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .find({ isDeleted: false, _id: { $in: feedbackIDs } })
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
    let userIDs = []
    let responseUserIDs = []
    let schoolIDs = []
    docs.forEach(({ userID, responseUserID, schoolID }) => {
      if (e.includes('user') && userID != null) {
        userIDs.push(ObjectID(userID))
      }
      if (e.includes('responseUser') && responseUserID != null) {
        responseUserIDs.push(ObjectID(responseUserID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let users
    let responseUsers
    let schools
    let arr = []
    if (userIDs.length > 0) {
      let p = getUsersByIDs(db, userIDs)
        .then((v) => {
          users = v
        })
      arr.push(p)
    }
    if (responseUserIDs.length > 0) {
      let p = getUsersByIDs(db, responseUserIDs)
        .then((v) => {
          responseUsers = v
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
          let { userID, responseUserID, schoolID } = c
          if (users !== undefined && userID != null) {
            c.user = users[userID]
          }
          if (responseUsers !== undefined && responseUserID != null) {
            c.responseUser = responseUsers[responseUserID]
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { userID, responseUserID, schoolID } = doc
  let arr = []
  if (e.includes('user') && userID != null) {
    let p = getUserByID(db, userID)
      .then((v) => {
        doc.user = v
      })
    arr.push(p)
  }
  if (e.includes('responseUser') && responseUserID != null) {
    let p = getUserByID(db, responseUserID)
      .then((v) => {
        doc.responseUser = v
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
 * Update feedback.
 * @param {Object} db
 * @param {string} feedbackID
 * @param {Object} obj
 * @returns {Object}
 */
function updateFeedback (db, feedbackID, obj) {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(feedbackID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Update feedback.
 * @param {Object} db
 * @param {string} feedbackID
 * @param {string} responseUserID
 * @param {string} responseContent
 * @returns {Object}
 */
function updateFeedbackResponse (db, feedbackID, responseUserID, responseContent) {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(feedbackID) },
      { $set: { updatedTime: Date.now(), status: 2, responseUserID, responseContent, responseTime: Date.now() } },
    )
}

/**
 * Delete feedback.
 * @param {Object} db
 * @param {string} feedbackID
 * @returns {Object}
 */
function deleteFeedback (db, feedbackID) {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(feedbackID) },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete feedbacks by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteFeedbacksBySchool (db, schoolID) {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteFeedback(db, String(_id))
      })
    })
}

/**
 * Delete feedbacks by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function deleteFeedbacksByUser (db, userID) {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .find({ isDeleted: false, userID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteFeedback(db, String(_id))
      })
    })
}

module.exports = {
  createFeedback,
  countFeedbacks,
  countFeedbacksBySchool,
  countFeedbacksByUser,
  getFeedbacks,
  getFeedbacksBySchool,
  getFeedbacksByUser,
  getFeedbackByID,
  getFeedbacksByIDs,
  updateFeedback,
  updateFeedbackResponse,
  deleteFeedback,
  deleteFeedbacksBySchool,
  deleteFeedbacksByUser,
}

const parseQuery = require('./parseQuery')
const { getUsersByIDs, getUserByID } = require('./User')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

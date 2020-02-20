const { ObjectID } = require('mongodb')

const FEEDBACK_TYPE_FEEDBACK = 0
const FEEDBACK_TYPE_REPORT = 1
const FEEDBACK_TYPE_SUPPORT = 2

const FEEDBACK_STATUS_CREATED = 0
const FEEDBACK_STATUS_RESPONSED = 1

/**
 * Creats feedback.
 * @param {Object} db
 * @param {string} userID
 * @param {number} type
 * @param {string} feedback
 * @returns {Object}
 */
function createFeedback (db, userID, type, feedback) {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .insertOne({
      userID,
      type,
      feedback,
      status: FEEDBACK_STATUS_CREATED,
      responseBy: null,
      responseTime: null,
      response: null,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count feedbacks.
 * @param {Object} db
 * @returns {Object}
 */
function countFeedbacks (db) {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get feedbacks.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='user,responseUser']
 * @returns {Object}
 */
function getFeedbacks (db, page, extra = 'user,responseUser') {
  return db.collection(process.env.FEEDBACK_COLLECTION)
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
 * Get feedback by id.
 * @param {Object} db
 * @param {string} feedbackID
 * @param {string} [extra='user,responseUser']
 * @returns {Object}
 */
function getFeedbackByID (db, feedbackID, extra = 'user,responseUser') {
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
 * @param {string} [extra='user,responseUser']
 * @returns {Object}
 */
function getFeedbacksByIDs (db, feedbackIDs, extra = 'user,responseUser') {
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
    docs.forEach(({ userID, responseBy }) => {
      if (e.includes('user') && userID != null) {
        userIDs.push(ObjectID(userID))
      }
      if (e.includes('responseUser') && responseBy != null) {
        responseUserIDs.push(ObjectID(responseBy))
      }
    })
    let users
    let responseUsers
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
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { userID, responseBy } = c
          if (users !== undefined && userID != null) {
            c.user = users[userID]
          }
          if (responseUsers !== undefined && responseBy != null) {
            c.responseUser = responseUsers[responseBy]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { userID, responseBy } = doc
  let arr = []
  if (e.includes('user') && userID != null) {
    let p = getUserByID(db, userID)
      .then((v) => {
        doc.user = v
      })
    arr.push(p)
  }
  if (e.includes('responseUser') && responseBy != null) {
    let p = getUserByID(db, responseBy)
      .then((v) => {
        doc.responseUser = v
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
 * Update feedback response.
 * @param {Object} db
 * @param {string} feedbackID
 * @param {string} responseBy
 * @param {string} response
 * @returns {Object}
 */
function updateFeedbackResponse (db, feedbackID, responseBy, response) {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(feedbackID) },
      { $set: { updatedTime: Date.now(), status: FEEDBACK_STATUS_RESPONSED, responseBy, responseTime: Date.now(), response } },
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

module.exports = {
  createFeedback,
  countFeedbacks,
  getFeedbacks,
  getFeedbackByID,
  getFeedbacksByIDs,
  updateFeedback,
  updateFeedbackResponse,
  deleteFeedback,
}

const { getUsersByIDs, getUserByID } = require('./User')

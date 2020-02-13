const { ObjectID } = require('mongodb')

/**
 * Creats feedback.
 * @param {Object} db
 * @param {string} userID
 * @param {number} type
 * @param {string} feedback
 * @param {number} status
 * @param {string} responseBy
 * @param {number} responseTime
 * @param {number} response
 * @returns {Object}
 */
function createFeedback (db, userID, type, feedback, status, responseBy, responseTime, response) {
  return db.collection(process.env.FEEDBACK_COLLECTION)
    .insertOne({
      userID,
      type,
      feedback,
      status,
      responseBy,
      responseTime,
      response,
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
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getFeedbacks (db, page, extra = 'user') {
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
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getFeedbackByID (db, feedbackID, extra = 'user') {
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
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getFeedbacksByIDs (db, feedbackIDs, extra = 'user') {
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
    docs.forEach(({ userID }) => {
      if (e.includes('user') && userID != null) {
        userIDs.push(ObjectID(userID))
      }
    })
    let users
    let arr = []
    if (userIDs.length > 0) {
      let p = getUsersByIDs(db, userIDs)
        .then((v) => {
          users = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { userID } = c
          if (users !== undefined && userID != null) {
            c.user = users[userID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { userID } = doc
  let arr = []
  if (e.includes('user') && userID != null) {
    let p = getUserByID(db, userID)
      .then((v) => {
        doc.user = v
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
  deleteFeedback,
}

const { getUsersByIDs, getUserByID } = require('./User')

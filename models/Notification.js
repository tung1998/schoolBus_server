const { ObjectID } = require('mongodb')

const NOTIFICATION_STATUS_UN_READ = 0
const NOTIFICATION_STATUS_READ = 1

/**
 * Creats notification.
 * @param {Object} db
 * @param {number} type
 * @param {string} userID
 * @param {string} title
 * @param {string} content
 * @param {number} [status=NOTIFICATION_STATUS_UN_READ]
 * @param {string} createdBy
 * @returns {Object}
 */
function createNotification (db, type, userID, title, content, status = NOTIFICATION_STATUS_UN_READ, createdBy) {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .insertOne({
      type,
      userID,
      title,
      content,
      status,
      createdBy,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count notifications.
 * @param {Object} db
 * @returns {Object}
 */
function countNotifications (db) {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Count notifications by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function countNotificationsByUser (db, userID) {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .find({ isDeleted: false, userID })
    .count()
}

/**
 * Get notifications.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getNotifications (db, page, extra = 'user') {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
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
 * Get notification by id.
 * @param {Object} db
 * @param {string} notificationID
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getNotificationByID (db, notificationID, extra = 'user') {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(notificationID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get notifications by ids.
 * @param {Object} db
 * @param {Array} notificationIDs
 * @param {string} [extra='user']
 * @returns {Object}
 */
function getNotificationsByIDs (db, notificationIDs, extra = 'user') {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .find({ isDeleted: false, _id: { $in: notificationIDs } })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Hàm lấy tất cả Notification theo User theo page
 * @param {Object} db
 * @param {String} userID
 * @param {Number} page
 * @param {Sring} extra
 * @return {Object}
 */
function getNotificationsByUser (db, userID, page = 1, extra = 'user') {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .find({ isDeleted: false, userID })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE) * 10)
    .sort({ _id: -1 })
    .toArray()
    .then(notifications => {
      if (notifications.length === 0) return []
      if (!extra) return notifications
      return addExtra(db, notifications, extra)
    })
}

/**
 * Hàm lấy tất cả Notification chưa đọc của User theo page
 * @param {Object} db
 * @param {String} userID
 * @param {Number} page
 * @param {String} extra
 * @return {Object}
 */
function getUnreadNotificationsByUser (db, userID, page = 1, extra = 'user') {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .find({ isDeleted: false, userID, status: NOTIFICATION_STATUS_UN_READ })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
    .then(notifications => {
      if (notifications.length === 0) return []
      if (!extra) return notifications
      return addExtra(db, notifications, extra)
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
 * Update notification.
 * @param {Object} db
 * @param {string} notificationID
 * @param {Object} obj
 * @returns {Object}
 */
function updateNotification (db, notificationID, obj) {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(notificationID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Cập nhật trạng thái Notification
 * @param {Object} db
 * @param {String} notificationID
 * @param {Number} status
 */
function updateNotificationStatus (db, notificationID, status) {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .updateOne(
      { _id: ObjectID(notificationID), isDeleted: false },
      { $set: { status, updatedTime: Date.now() } },
    )
}

/**
 * Delete notification.
 * @param {Object} db
 * @param {string} notificationID
 * @returns {Object}
 */
function deleteNotification (db, notificationID) {
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(notificationID) },
      { $set: { isDeleted: true } },
    )
}

/**
 * Filter notifications
 * @param {Object} db
 * @param {string} userID
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @returns {Object}
 */
function filterNotifications (db, userID, sortBy, sortType, limit, page, extra = 'user') {
  let keyOnList = {}
  if (sortBy !== undefined) {
    sortBy = sortBy.split(',')
    if (sortType !== undefined) {
      sortType = sortType.split(',')
    }
    sortBy.forEach((cur, i) => {
      keyOnList[cur] = sortType === undefined || sortType[i] === undefined
        ? 1
        : Number(sortType[i])
    })
  }
  if (limit === undefined) limit = Number(process.env.LIMIT_DOCUMENT_PER_PAGE)
  if (page === undefined) page = 1
  return db.collection(process.env.NOTIFICATION_COLLECTION)
    .find({ isDeleted: false, userID })
    .sort(keyOnList)
    .skip(limit * (page - 1))
    .limit(limit)
    .toArray()
    .then((notifications) => {
      if (notifications.length === 0) return []
      if (!extra) return notifications
      return addExtra(db, notifications, extra)
    })
}

module.exports = {
  createNotification,
  countNotifications,
  countNotificationsByUser,
  getNotifications,
  getNotificationByID,
  getNotificationsByIDs,
  getNotificationsByUser,
  getUnreadNotificationsByUser,
  updateNotification,
  updateNotificationStatus,
  deleteNotification,
  filterNotifications,
}

const { getUsersByIDs, getUserByID } = require('./User')

const { ObjectID } = require('mongodb')

/**
 * Creats user.
 * @param {Object} db
 * @param {string} username
 * @param {string} password
 * @param {string} salt
 * @param {string} image
 * @param {string} name
 * @param {string} phone
 * @param {string} email
 * @param {number} userType
 * @param {boolean} isBlocked
 * @param {string} bolockedBy
 * @param {string} blockedReason
 * @param {number} liftTime
 * @returns {Object}
 */
function createUser (db, username, password, salt, image, name, phone, email, userType, isBlocked, bolockedBy, blockedReason, liftTime) {
  return db.collection(process.env.USER_COLLECTION)
    .insertOne({
      username,
      password,
      salt,
      image,
      name,
      phone,
      email,
      userType,
      isBlocked,
      bolockedBy,
      blockedReason,
      liftTime,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count users.
 * @param {Object} db
 * @returns {Object}
 */
function countUsers (db) {
  return db.collection(process.env.USER_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get users.
 * @param {Object} db
 * @param {number} page
 * @returns {Object}
 */
function getUsers (db, page) {
  return db.collection(process.env.USER_COLLECTION)
    .find({ isDeleted: false })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
}

/**
 * Get user by id.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function getUserByID (db, userID) {
  return db.collection(process.env.USER_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(userID) })
}

/**
 * Get users by ids.
 * @param {Object} db
 * @param {Array} userIDs
 * @returns {Object}
 */
function getUsersByIDs (db, userIDs) {
  return db.collection(process.env.USER_COLLECTION)
    .find({ isDeleted: false, _id: { $in: userIDs } })
    .toArray()
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Update user.
 * @param {Object} db
 * @param {string} userID
 * @param {Object} obj
 * @returns {Object}
 */
function updateUser (db, userID, obj) {
  return db.collection(process.env.USER_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(userID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function deleteUser (db, userID) {
  return db.collection(process.env.USER_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(userID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createUser,
  countUsers,
  getUsers,
  getUserByID,
  getUsersByIDs,
  updateUser,
  deleteUser,
}

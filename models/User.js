const { ObjectID } = require('mongodb')
const crypto = require('crypto')

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
  if (salt === undefined) salt = randomSalt()
  password = hashPassword(password, salt)
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

/**
 * Hash password.
 * @param {string} password
 * @param {string} salt
 * @returns {string}
 */
function hashPassword (password, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex')
}

/**
 * Random salt.
 * @param {number} len
 * @returns {string}
 */
function randomSalt (len = 5) {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < len; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

/**
 * Login by username.
 * @param {Object} db
 * @param {string} username
 * @param {string} password
 * @param {string} scope
 * @returns {Object}
 */
function loginByUsername (db, username, password, scope) {
  return new Promise((resolve, reject) => {
    let query = { isDeleted: false, username }
    if (scope !== undefined) query.userType = Number(scope)
    db.collection(process.env.USER_COLLECTION).findOne(query).then(user => {
      if (user === null) {
        reject()
      } else {
        const checkPassword = hashPassword(password, user.salt)
        if (checkPassword === user.password) {
          resolve(user) // OK
        } else {
          reject() // sai pass
        }
      }
    }).catch(reject)
  })
}

module.exports = {
  createUser,
  countUsers,
  getUsers,
  getUserByID,
  getUsersByIDs,
  updateUser,
  deleteUser,
  loginByUsername,
}

const { ObjectID } = require('mongodb')
const crypto = require('crypto')

/**
 * Creats user.
 * @param {Object} db
 * @param {string} username
 * @param {string} password
 * @param {string} image
 * @param {string} name
 * @param {string} phone
 * @param {string} email
 * @param {number} userType
 * @returns {Object}
 */
function createUser (db, username, password, image, name, phone, email, userType) {
  let salt = randomSalt()
  return db.collection(process.env.USER_COLLECTION)
    .insertOne({
      username,
      password: hashPassword(password, salt),
      salt,
      image,
      name,
      phone,
      email,
      userType,
      isBlocked: false,
      blockedBy: null,
      blockedReason: null,
      liftTime: null,
      isVerify: false,
      resetCode: null,
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

/**
 * Block user.
 * @param {Object} db
 * @param {string} userID
 * @param {string} blockedBy
 * @param {string} blockedReason
 * @returns {Object}
 */
function blockUser (db, userID, blockedBy, blockedReason) {
  let p = db.collection(process.env.USER_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(userID) },
      { $set: { isBlocked: true, blockedBy, blockedReason, liftTime: Date.now() } },
    )
  p.then(({ matchedCount }) => {
    if (matchedCount === 1) {
      deleteTokensByUser(db, userID)
    }
  })
  return p
}

/**
 * Unblock user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function unblockUser (db, userID) {
  return db.collection(process.env.USER_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(userID) },
      { $set: { isBlocked: false, blockedBy: null, blockedReason: null, liftTime: null } },
    )
}

/**
 * Delete tokens by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {undefined}
 */
function deleteTokensByUser (db, userID) {
  db.collection(process.env.OAUTH2_TOKEN_COLLECTION).deleteMany({ userID })
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
  blockUser,
  unblockUser,
}

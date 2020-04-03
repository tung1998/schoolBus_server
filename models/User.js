const { ObjectID } = require('mongodb')
const crypto = require('crypto')

const USER_TYPE_ADMINISTRATOR = 0
const USER_TYPE_STUDENT = 1
const USER_TYPE_NANNY = 2
const USER_TYPE_PARENT = 3
const USER_TYPE_DRIVER = 4
const USER_TYPE_TEACHER = 5

/**
 * Creats user.
 * @param {Object} db
 * @param {string} username
 * @param {string} [password='12345678']
 * @param {string} image
 * @param {string} name
 * @param {string} phone
 * @param {string} email
 * @param {number} userType
 * @param {string} schoolID
 * @returns {Object}
 */
function createUser (db, username, password = '12345678', image, name, phone, email, userType, schoolID) {
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
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count users.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countUsers (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.USER_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count users by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countUsersBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.USER_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get users.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getUsers (db, query, limit, page, extra = 'school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.USER_COLLECTION)
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
 * Get users by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getUsersBySchool (db, schoolID, query, limit, page, extra = 'school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.USER_COLLECTION)
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
 * Get user by id.
 * @param {Object} db
 * @param {string} userID
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getUserByID (db, userID, extra = 'school') {
  return db.collection(process.env.USER_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(userID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get users by ids.
 * @param {Object} db
 * @param {Array} userIDs
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getUsersByIDs (db, userIDs, extra = 'school') {
  return db.collection(process.env.USER_COLLECTION)
    .find({ isDeleted: false, _id: { $in: userIDs } })
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
 * @param {boolean} [deleteOption=true]
 * @returns {Object}
 */
function deleteUser (db, userID, deleteOption = true) {
  let p = db.collection(process.env.USER_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(userID) },
      null,
      { $set: { isDeleted: true } },
      { fields: { _id: 0, userType: 1 } },
    )
  p.then(({ lastErrorObject: { updatedExisting }, value }) => {
    if (updatedExisting) {
      if (deleteOption) {
        switch (value.userType) {
          case USER_TYPE_ADMINISTRATOR:
            deleteAdministratorByUser(db, userID)
            break
          case USER_TYPE_STUDENT:
            deleteStudentByUser(db, userID)
            break
          case USER_TYPE_NANNY:
            deleteNannyByUser(db, userID)
            break
          case USER_TYPE_PARENT:
            deleteParentByUser(db, userID)
            break
          case USER_TYPE_DRIVER:
            deleteDriverByUser(db, userID)
            break
          case USER_TYPE_TEACHER:
            deleteTeacherByUser(db, userID)
            break
        }
      }
      deleteTokensByUser(db, userID)
      deleteFeedbacksByUser(db, userID)
    }
  })
  return p
}

/**
 * Delete users by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteUsersBySchool (db, schoolID) {
  return db.collection(process.env.USER_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteUser(db, String(_id))
      })
    })
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
      { $set: { updatedTime: Date.now(), isBlocked: true, blockedBy, blockedReason, liftTime: Date.now() } },
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
      { $set: { updatedTime: Date.now(), isBlocked: false, blockedBy: null, blockedReason: null, liftTime: null } },
    )
}

/**
 * Delete tokens by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function deleteTokensByUser (db, userID) {
  return db.collection(process.env.OAUTH2_TOKEN_COLLECTION).deleteMany({ userID })
}

/**
 * Update user password.
 * @param {Object} db
 * @param {string} userID
 * @param {string} password
 * @returns {Object}
 */
function updateUserPassword (db, userID, password) {
  const salt = randomSalt()
  let p = db.collection(process.env.USER_COLLECTION).updateOne(
    { isDeleted: false, _id: ObjectID(userID) },
    { $set: { updatedTime: Date.now(), password: hashPassword(password, salt), salt } },
  )
  p.then(({ matchedCount }) => {
    if (matchedCount === 1) {
      deleteTokensByUser(db, userID)
    }
  })
  return p
}

/**
 * Get user by phone.
 * @param {Object} db
 * @param {string} phone
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getUserByPhone (db, phone, extra = 'school') {
  return db.collection(process.env.USER_COLLECTION).findOne({ isDeleted: false, phone })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get user by email.
 * @param {Object} db
 * @param {string} email
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getUserByEmail (db, email, extra = 'school') {
  return db.collection(process.env.USER_COLLECTION).findOne({ isDeleted: false, email })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get user by accessToken.
 * @param {Object} db
 * @param {string} accessToken
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getUserByAccessToken (db, accessToken, extra = 'school') {
  return db.collection(process.env.OAUTH2_TOKEN_COLLECTION)
    .findOne({ access_token: accessToken }, { fields: { _id: 0, userID: 1 } })
    .then((v) => {
      if (v === null) return null
      return getUserByID(db, v.userID, extra)
    })
}

/**
 * Check user is super admin.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function checkUserIsSuperAdmin (db, userID) {
  return db.collection(process.env.ADMINISTRATOR_COLLECTION)
    .findOne({ isDeleted: false, userID, adminType: 0 }, { fields: { _id: 1 } })
    .then(v => v !== null)
}

module.exports = {
  createUser,
  countUsers,
  countUsersBySchool,
  getUsers,
  getUsersBySchool,
  getUserByID,
  getUsersByIDs,
  updateUser,
  deleteUser,
  deleteUsersBySchool,
  loginByUsername,
  blockUser,
  unblockUser,
  updateUserPassword,
  getUserByPhone,
  getUserByEmail,
  getUserByAccessToken,
  checkUserIsSuperAdmin,
}

const parseQuery = require('./parseQuery')
const { getSchoolsByIDs, getSchoolByID } = require('./School')
const { deleteAdministratorByUser } = require('./Administrator')
const { deleteStudentByUser } = require('./Student')
const { deleteNannyByUser } = require('./Nanny')
const { deleteParentByUser } = require('./Parent')
const { deleteDriverByUser } = require('./Driver')
const { deleteTeacherByUser } = require('./Teacher')
const { deleteFeedbacksByUser } = require('./Feedback')

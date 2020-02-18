/**
 * Delete tokens..
 * @param {Object} db
 * @param {(string|Array<string>)} _id
 * @returns {Object}
 */
function deleteTokensByID (db, _id) {
  let filter = !Array.isArray(_id)
    ? { _id: ObjectID(_id) }
    : { _id: { $in: _id.map(ObjectID) } }
  return db.collection(process.env.OAUTH2_TOKEN_COLLECTION)
    .deleteMany(filter)
}

function deleteTokensByToken (db, token) {
  let filter = !Array.isArray(token)
    ? { access_token: token }
    : { access_token: { $in: token } }
  return db.collection(process.env.OAUTH2_TOKEN_COLLECTION)
    .deleteMany(filter)
}

function getTokenByID (db, _id){
  return db.collection(process.env.OAUTH2_TOKEN_COLLECTION)
    .findOne({ _id: ObjectID(_id) })
}

function getTokenByUserID (db, userID){
  let query = {
    userID
  }
  return db.collection(process.env.OAUTH2_TOKEN_COLLECTION)
    .find(query)
    .toArray()
}

/**
 * Get access_tokens
 * @param {Object} db
 * @param {number} userType
 * @param {string} userPhone
 * @returns {Object}
 */
function getAccessTokens (db, userType, userPhone) {
  return db.collection(process.env.USER_COLLECTION)
    .findOne({ isDeleted: false, userType, phone: userPhone  }, { fields: { _id: 1 } })
    .then((user) => {
      if (user === null) return null

      return db.collection(process.env.OAUTH2_TOKEN_COLLECTION)
        .find({ userID: String(user._id) })
        .project({ _id: 0, access_token: 1 })
        .map(({ access_token }) => access_token)
        .toArray()
    })
}

/**
 * Get tokens.
 * @param {Object} db
 * @param {string} userID
 * @param {string} username
 * @param {number} type
 * @param {string} expires_at_start
 * @param {string} expires_at_end
 * @param {string} phone
 * @param {string} sortBy
 * @param {string} sortType
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @returns {Object}
 */
function getTokens (db, userID, username, type, expires_at_start, expires_at_end, phone, sortBy, sortType, limit, page) {
  let query = {}
  if (userID !== undefined) {
    query.userID = userID
  }
  if (username !== undefined) {
    query.username = username
  }
  if (type !== undefined) {
    query.type = {$in: type}
  }
  if (expires_at_start !== undefined && expires_at_end !== undefined) {
    query.expires_at = { $gte: expires_at_start, $lt: expires_at_end }
  }
  let keyOnList = {}
  if (sortBy !== undefined) {
    sortBy = sortBy.split(',')
    if (sortType !== undefined) {
      sortType = sortType.split(',')
    }
    sortBy.forEach((cur, i) => {
      keyOnList[cur] = sortType !== undefined
        ? Number(sortType[i]) || 1
        : 1
    })
  }
  if (limit === undefined) {
    limit = Number(process.env.LIMIT_DOCUMENT_PER_PAGE)
  }
  if (page === undefined) {
    page = 1
  }
  let p0 = Promise.resolve()
  if (phone !== undefined) {
    p0 = db.collection(process.env.USER_COLLECTION)
      .find({ isDeleted: false, phone })
      .project({ _id: 1 })
      .toArray()
      .then((users) => {
        query = {
          $and: [
            query,
            { userID: { $in: users.map(({ _id }) => String(_id)) } },
          ],
        }
      })
  }
  let p1 =  p0.then(() => (
    db.collection(process.env.OAUTH2_TOKEN_COLLECTION)
      .find(query)
      .sort(keyOnList)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()
      .then((tokens) => {
        if (tokens.length === 0) {
          return []
        }

        let userIDs = tokens.map(({ userID }) => ObjectID(userID))
        return getUsersByIDs(db, userIDs)
          .then((users) => {
            tokens.forEach((cur) => {
              cur.user = users[cur.userID]
            })
            return tokens
          })
      })
  ))
  let p2 = p0.then(() => (
    db.collection(process.env.OAUTH2_TOKEN_COLLECTION)
      .count(query)
  ))
  return Promise.all([p1, p2])
    .then(([data, count]) => ({ data, count }))
}

module.exports = {
  deleteTokensByID,
  deleteTokensByToken,
  getTokenByID,
  getTokenByUserID,
  getAccessTokens,
  getTokens,
}

const { ObjectID } = require('mongodb')
const { getUsersByIDs } = require('./User')

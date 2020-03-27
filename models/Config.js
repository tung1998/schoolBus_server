const { ObjectID } = require('mongodb')

/**
 * Creats config.
 * @param {Object} db
 * @param {string} name
 * @param {*} value
 * @param {string} schoolID
 * @returns {Object}
 */
function createConfig (db, name, value, schoolID) {
  return db.collection(process.env.CONFIG_COLLECTION)
    .insertOne({
      name,
      value,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count configs.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countConfigs (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CONFIG_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count configs by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countConfigsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CONFIG_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get configs.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getConfigs (db, query, limit, page, extra = 'school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CONFIG_COLLECTION)
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
 * Get configs by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getConfigsBySchool (db, schoolID, query, limit, page, extra = 'school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CONFIG_COLLECTION)
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
 * Get config by id.
 * @param {Object} db
 * @param {string} configID
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getConfigByID (db, configID, extra = 'school') {
  return db.collection(process.env.CONFIG_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(configID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get configs by ids.
 * @param {Object} db
 * @param {Array} configIDs
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getConfigsByIDs (db, configIDs, extra = 'school') {
  return db.collection(process.env.CONFIG_COLLECTION)
    .find({ isDeleted: false, _id: { $in: configIDs } })
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
 * Update config.
 * @param {Object} db
 * @param {string} configID
 * @param {Object} obj
 * @returns {Object}
 */
function updateConfig (db, configID, obj) {
  return db.collection(process.env.CONFIG_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(configID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete config.
 * @param {Object} db
 * @param {string} configID
 * @returns {Object}
 */
function deleteConfig (db, configID) {
  return db.collection(process.env.CONFIG_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(configID) },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete configs by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteConfigsBySchool (db, schoolID) {
  return db.collection(process.env.CONFIG_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteConfig(db, String(_id))
      })
    })
}

module.exports = {
  createConfig,
  countConfigs,
  countConfigsBySchool,
  getConfigs,
  getConfigsBySchool,
  getConfigByID,
  getConfigsByIDs,
  updateConfig,
  deleteConfig,
  deleteConfigsBySchool,
}

const parseQuery = require('./parseQuery')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

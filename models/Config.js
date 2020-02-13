const { ObjectID } = require('mongodb')

/**
 * Creats config.
 * @param {Object} db
 * @param {string} name
 * @param {*} value
 * @returns {Object}
 */
function createConfig (db, name, value) {
  return db.collection(process.env.CONFIG_COLLECTION)
    .insertOne({
      name,
      value,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count configs.
 * @param {Object} db
 * @returns {Object}
 */
function countConfigs (db) {
  return db.collection(process.env.CONFIG_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get configs.
 * @param {Object} db
 * @param {number} page
 * @returns {Object}
 */
function getConfigs (db, page) {
  return db.collection(process.env.CONFIG_COLLECTION)
    .find({ isDeleted: false })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
}

/**
 * Get config by id.
 * @param {Object} db
 * @param {string} configID
 * @returns {Object}
 */
function getConfigByID (db, configID) {
  return db.collection(process.env.CONFIG_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(configID) })
}

/**
 * Get configs by ids.
 * @param {Object} db
 * @param {Array} configIDs
 * @returns {Object}
 */
function getConfigsByIDs (db, configIDs) {
  return db.collection(process.env.CONFIG_COLLECTION)
    .find({ isDeleted: false, _id: { $in: configIDs } })
    .toArray()
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
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

module.exports = {
  createConfig,
  countConfigs,
  getConfigs,
  getConfigByID,
  getConfigsByIDs,
  updateConfig,
  deleteConfig,
}

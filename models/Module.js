const { ObjectID } = require('mongodb')

const initData = []

/**
 * Creats module.
 * @param {Object} db
 * @param {string} name
 * @param {string} description
 * @param {string} route
 * @param {number} level
 * @param {string} parent
 * @param {string} icon
 * @param {Array} permission
 * @returns {Object}
 */
function createModule (db, name, description, route, level, parent, icon, permission) {
  return db.collection(process.env.MODULE_COLLECTION)
    .insertOne({
      name,
      description,
      route,
      level,
      parent,
      icon,
      permission,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count modules.
 * @param {Object} db
 * @returns {Object}
 */
function countModules (db) {
  return db.collection(process.env.MODULE_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get modules.
 * @param {Object} db
 * @param {number} page
 * @returns {Object}
 */
function getModules (db, page) {
  return db.collection(process.env.MODULE_COLLECTION)
    .find({ isDeleted: false })
    // .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    // .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
}

/**
 * Get module by id.
 * @param {Object} db
 * @param {string} moduleID
 * @returns {Object}
 */
function getModuleByID (db, moduleID) {
  return db.collection(process.env.MODULE_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(moduleID) })
}

/**
 * Get modules by ids.
 * @param {Object} db
 * @param {Array} moduleIDs
 * @returns {Object}
 */
function getModulesByIDs (db, moduleIDs) {
  return db.collection(process.env.MODULE_COLLECTION)
    .find({ isDeleted: false, _id: { $in: moduleIDs } })
    .toArray()
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Update module.
 * @param {Object} db
 * @param {string} moduleID
 * @param {Object} obj
 * @returns {Object}
 */
function updateModule (db, moduleID, obj) {
  return db.collection(process.env.MODULE_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(moduleID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete module.
 * @param {Object} db
 * @param {string} moduleID
 * @returns {Object}
 */
function deleteModule (db, moduleID) {
  return db.collection(process.env.MODULE_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(moduleID) },
      { $set: { isDeleted: true } },
    )
}

function initModule (db) {
  console.log('Start Init')
  return new Promise((resolve, reject) => {
    db.createCollection(process.env.MODULE_COLLECTION, function (err, collection) {
      if (err) {
        console.log(err)
        reject(err.message)
      } else {
        console.log(collection)
      }
    })
    db.collection(process.env.MODULE_COLLECTION).ensureIndex({ route: 1 }, { unique: true })
    initData.forEach((item) => {
      db.collection(process.env.MODULE_COLLECTION).insert(item)
    })
    // db.collection(process.env.MODULE_COLLECTION).distinct("route")
    resolve()
  })
}

module.exports = {
  createModule,
  countModules,
  getModules,
  getModuleByID,
  getModulesByIDs,
  updateModule,
  deleteModule,
  initModule,
}

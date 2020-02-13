const { ObjectID } = require('mongodb')

/**
 * Creats route.
 * @param {Object} db
 * @param {Array} requireCarStop
 * @param {Array} pickupCarStop
 * @param {Array} takeoffCarStop
 * @param {number} toll
 * @returns {Object}
 */
function createRoute (db, requireCarStop, pickupCarStop, takeoffCarStop, toll) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .insertOne({
      requireCarStop,
      pickupCarStop,
      takeoffCarStop,
      toll,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count routes.
 * @param {Object} db
 * @returns {Object}
 */
function countRoutes (db) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get routes.
 * @param {Object} db
 * @param {number} page
 * @returns {Object}
 */
function getRoutes (db, page) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .find({ isDeleted: false })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
}

/**
 * Get route by id.
 * @param {Object} db
 * @param {string} routeID
 * @returns {Object}
 */
function getRouteByID (db, routeID) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(routeID) })
}

/**
 * Get routes by ids.
 * @param {Object} db
 * @param {Array} routeIDs
 * @returns {Object}
 */
function getRoutesByIDs (db, routeIDs) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .find({ isDeleted: false, _id: { $in: routeIDs } })
    .toArray()
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Update route.
 * @param {Object} db
 * @param {string} routeID
 * @param {Object} obj
 * @returns {Object}
 */
function updateRoute (db, routeID, obj) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(routeID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete route.
 * @param {Object} db
 * @param {string} routeID
 * @returns {Object}
 */
function deleteRoute (db, routeID) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(routeID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createRoute,
  countRoutes,
  getRoutes,
  getRouteByID,
  getRoutesByIDs,
  updateRoute,
  deleteRoute,
}

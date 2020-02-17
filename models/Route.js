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
 * @param {string} [extra='carStop']
 * @returns {Object}
 */
function getRoutes (db, page, extra = 'carStop') {
  return db.collection(process.env.ROUTE_COLLECTION)
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
 * Get route by id.
 * @param {Object} db
 * @param {string} routeID
 * @param {string} [extra='carStop']
 * @returns {Object}
 */
function getRouteByID (db, routeID, extra = 'carStop') {
  return db.collection(process.env.ROUTE_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(routeID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get routes by ids.
 * @param {Object} db
 * @param {Array} routeIDs
 * @param {string} [extra='carStop']
 * @returns {Object}
 */
function getRoutesByIDs (db, routeIDs, extra = 'carStop') {
  return db.collection(process.env.ROUTE_COLLECTION)
    .find({ isDeleted: false, _id: { $in: routeIDs } })
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
    let carStopIDs = []
    docs.forEach(({ requireCarStop, pickupCarStop, takeoffCarStop }) => {
      if (e.includes('carStop')) {
        if (Array.isArray(requireCarStop)) {
          requireCarStop.forEach(({ carStopID }) => {
            if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
          })
        }
        if (Array.isArray(pickupCarStop)) {
          pickupCarStop.forEach(({ carStopID }) => {
            if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
          })
        }
        if (Array.isArray(takeoffCarStop)) {
          takeoffCarStop.forEach(({ carStopID }) => {
            if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
          })
        }
      }
    })
    let carStops
    let arr = []
    if (carStopIDs.length > 0) {
      let p = getCarStopsByIDs(db, carStopIDs)
        .then((v) => {
          carStops = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach(({ requireCarStop, pickupCarStop, takeoffCarStop }) => {
          if (Array.isArray(requireCarStop)) {
            requireCarStop.forEach((c) => {
              if (c.carStopID != null) c.carStop = carStops[c.carStopID]
            })
          }
          if (Array.isArray(pickupCarStop)) {
            pickupCarStop.forEach((c) => {
              if (c.carStopID != null) c.carStop = carStops[c.carStopID]
            })
          }
          if (Array.isArray(takeoffCarStop)) {
            takeoffCarStop.forEach((c) => {
              if (c.carStopID != null) c.carStop = carStops[c.carStopID]
            })
          }
        })
        return docs
      })
  }
  let doc = docs
  let { requireCarStop, pickupCarStop, takeoffCarStop } = doc
  let arr = []
  if (e.includes('carStop')) {
    let carStopIDs = []
    if (Array.isArray(requireCarStop)) {
      requireCarStop.forEach(({ carStopID }) => {
        if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
      })
    }
    if (Array.isArray(pickupCarStop)) {
      pickupCarStop.forEach(({ carStopID }) => {
        if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
      })
    }
    if (Array.isArray(takeoffCarStop)) {
      takeoffCarStop.forEach(({ carStopID }) => {
        if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
      })
    }
    if (carStopIDs.length > 0) {
      let p = getCarStopsByIDs(db, carStopIDs)
        .then((v) => {
          if (Array.isArray(requireCarStop)) {
            requireCarStop.forEach((c) => {
              if (c.carStopID != null) c.carStop = v[c.carStopID]
            })
          }
          if (Array.isArray(pickupCarStop)) {
            pickupCarStop.forEach((c) => {
              if (c.carStopID != null) c.carStop = v[c.carStopID]
            })
          }
          if (Array.isArray(takeoffCarStop)) {
            takeoffCarStop.forEach((c) => {
              if (c.carStopID != null) c.carStop = v[c.carStopID]
            })
          }
        })
      arr.push(p)
    }
  }
  return Promise.all(arr)
    .then(() => doc)
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

const { getCarStopsByIDs } = require('./CarStop')

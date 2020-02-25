const { ObjectID } = require('mongodb')

/**
 * Creats carStop.
 * @param {Object} db
 * @param {number} stopType
 * @param {string} name
 * @param {string} address
 * @param {Array} location
 * @returns {Object}
 */
function createCarStop (db, stopType, name, address, location) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .insertOne({
      stopType,
      name,
      address,
      location,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carStops.
 * @param {Object} db
 * @returns {Object}
 */
function countCarStops (db) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get carStops.
 * @param {Object} db
 * @param {number} page
 * @returns {Object}
 */
function getCarStops (db, page) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .find({ isDeleted: false })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
}

/**
 * Get carStop by id.
 * @param {Object} db
 * @param {string} carStopID
 * @returns {Object}
 */
function getCarStopByID (db, carStopID) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(carStopID) })
}

/**
 * Get carStops by ids.
 * @param {Object} db
 * @param {Array} carStopIDs
 * @returns {Object}
 */
function getCarStopsByIDs (db, carStopIDs) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .find({ isDeleted: false, _id: { $in: carStopIDs } })
    .toArray()
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Update carStop.
 * @param {Object} db
 * @param {string} carStopID
 * @param {Object} obj
 * @returns {Object}
 */
function updateCarStop (db, carStopID, obj) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carStopID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete carStop.
 * @param {Object} db
 * @param {string} carStopID
 * @returns {Object}
 */
function deleteCarStop (db, carStopID) {
  return db.collection(process.env.CAR_STOP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carStopID) },
      { $set: { isDeleted: true } },
    )
}

/**
 * Trả về tất cả Carstops theo IDs
 * @param {Object} db
 * @param {Boolean} extra
 * @return {Object}
 */
function getCarStopsBySearch (db, name, address, extra = true) {
  return new Promise((resolve, reject) => {
    let condition = { isDeleted: false }
    if (name) {
      condition.name = { $regex: name, $options: 'i' }
    }
    if (address) {
      condition.address = { $regex: address, $options: 'i' }
    }
    db.collection(process.env.CAR_STOP_COLLECTION)
      .find(condition)
      .toArray()
      .then(carStops => {
        if (!carStops.length) resolve([])
        else {
          resolve(carStops)
        }
      })
      .catch(reject)
  })
}

/** Get carStops by type in route.
 * @param {string} type
 * @param {Object} db
 * @param {string} routeID
 * @returns {Promise}
 */
function getCarStopsByTypeInRoute (type, db, routeID) {
  switch (type) {
    case 'pickup':
      return getPickupCarStops(db, routeID)
    case 'takeoff':
      return getTakeoffCarStops(db, routeID)
    case 'require':
      return getRequireCarStopsByRoute(db, routeID)
    default:
      return Promise.resolve([])
  }
}

/**
 * Get pickup carStops.
 * @param {Object} db
 * @param {string} routeID
 * @returns {Promise}
 */
function getPickupCarStops (db, routeID) {
  const query = routeID === undefined
    ? { isDeleted: false, pickupCarStop: { $elemMatch: { $exists: true } } }
    : { isDeleted: false, pickupCarStop: { $elemMatch: { $exists: true } }, _id: ObjectID(routeID) }
  return db.collection(process.env.ROUTE_COLLECTION)
    .find(query)
    .project({
      _id: 0,
      requireCarStop: { $slice: [0, 1] },
      'requireCarStop.carStopID': 1,
      'requireCarStop.hide': 1,
      'pickupCarStop.carStopID': 1,
      'pickupCarStop.hide': 1,
    })
    .toArray()
    .then((routes) => {
      const carStopIDs = routes.reduce((accumulator, { requireCarStop, pickupCarStop }) => {
        // accumulator.push(ObjectID(requireCarStop[0].carStopID))
        pickupCarStop.forEach(({ carStopID, hide }) => {
          if (hide === false) accumulator.push(ObjectID(carStopID))
        })
        return accumulator
      }, [])
      return getCarStopsByIDs(db, carStopIDs).then(Object.values)
    })
}

/**
 * Get takeoff carStops.
 * @param {Object} db
 * @param {string} routeID
 * @returns {Promise}
 */
function getTakeoffCarStops (db, routeID) {
  const query = routeID === undefined
    ? { isDeleted: false, takeoffCarStop: { $elemMatch: { $exists: true } } }
    : { isDeleted: false, takeoffCarStop: { $elemMatch: { $exists: true } }, _id: ObjectID(routeID) }
  return db.collection(process.env.ROUTE_COLLECTION)
    .find(query)
    .project({
      _id: 0,
      requireCarStop: { $slice: [1, 1] },
      'requireCarStop.carStopID': 1,
      'requireCarStop.hide': 1,
      'takeoffCarStop.carStopID': 1,
      'takeoffCarStop.hide': 1,
    })
    .toArray()
    .then((routes) => {
      const carStopIDs = routes.reduce((accumulator, { requireCarStop, takeoffCarStop }) => {
        // accumulator.push(ObjectID(requireCarStop[0].carStopID))
        takeoffCarStop.forEach(({ carStopID, hide }) => {
          if (hide === false) accumulator.push(ObjectID(carStopID))
        })
        return accumulator
      }, [])
      return getCarStopsByIDs(db, carStopIDs).then(Object.values)
    })
}

/**
 * Get pickup carStops.
 * @param {Object} db
 * @param {string} routeID
 * @returns {Promise}
 */
function getRequireCarStopsByRoute (db, routeID) {
  const query = routeID === undefined
    ? { isDeleted: false, requireCarStop: { $elemMatch: { $exists: true } } }
    : { isDeleted: false, requireCarStop: { $elemMatch: { $exists: true } }, _id: ObjectID(routeID) }
  return db.collection(process.env.ROUTE_COLLECTION)
    .find(query)
    .project({
      _id: 0,
      requireCarStop: { $slice: [0, 2] },
    })
    .toArray()
    .then((routes) => {
      const carStopIDs = routes.reduce((accumulator, { requireCarStop }) => {
        requireCarStop.forEach(({ carStopID, hide }) => {
          if (hide === false) accumulator.push(ObjectID(carStopID))
        })
        return accumulator
      }, [])
      return getCarStopsByIDs(db, carStopIDs).then(Object.values)
    })
}

module.exports = {
  createCarStop,
  countCarStops,
  getCarStops,
  getCarStopByID,
  getCarStopsByIDs,
  updateCarStop,
  deleteCarStop,
  getCarStopsBySearch,
  getCarStopsByTypeInRoute,
}

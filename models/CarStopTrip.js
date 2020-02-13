const { ObjectID } = require('mongodb')

/**
 * Creats carStopTrip.
 * @param {Object} db
 * @param {string} carStopID
 * @param {string} tripID
 * @param {number} reachTime
 * @returns {Object}
 */
function createCarStopTrip (db, carStopID, tripID, reachTime) {
  return db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
    .insertOne({
      carStopID,
      tripID,
      reachTime,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carStopTrips.
 * @param {Object} db
 * @returns {Object}
 */
function countCarStopTrips (db) {
  return db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get carStopTrips.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='carStop,trip']
 * @returns {Object}
 */
function getCarStopTrips (db, page, extra = 'carStop,trip') {
  return db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
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
 * Get carStopTrip by id.
 * @param {Object} db
 * @param {string} carStopTripID
 * @param {string} [extra='carStop,trip']
 * @returns {Object}
 */
function getCarStopTripByID (db, carStopTripID, extra = 'carStop,trip') {
  return db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(carStopTripID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get carStopTrips by ids.
 * @param {Object} db
 * @param {Array} carStopTripIDs
 * @param {string} [extra='carStop,trip']
 * @returns {Object}
 */
function getCarStopTripsByIDs (db, carStopTripIDs, extra = 'carStop,trip') {
  return db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
    .find({ isDeleted: false, _id: { $in: carStopTripIDs } })
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
    let tripIDs = []
    docs.forEach(({ carStopID, tripID }) => {
      if (e.includes('carStop') && carStopID != null) {
        carStopIDs.push(ObjectID(carStopID))
      }
      if (e.includes('trip') && tripID != null) {
        tripIDs.push(ObjectID(tripID))
      }
    })
    let carStops
    let trips
    let arr = []
    if (carStopIDs.length > 0) {
      let p = getCarStopsByIDs(db, carStopIDs)
        .then((v) => {
          carStops = v
        })
      arr.push(p)
    }
    if (tripIDs.length > 0) {
      let p = getTripsByIDs(db, tripIDs)
        .then((v) => {
          trips = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { carStopID, tripID } = c
          if (carStops !== undefined && carStopID != null) {
            c.carStop = carStops[carStopID]
          }
          if (trips !== undefined && tripID != null) {
            c.trip = trips[tripID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { carStopID, tripID } = doc
  let arr = []
  if (e.includes('carStop') && carStopID != null) {
    let p = getCarStopByID(db, carStopID)
      .then((v) => {
        doc.carStop = v
      })
    arr.push(p)
  }
  if (e.includes('trip') && tripID != null) {
    let p = getTripByID(db, tripID)
      .then((v) => {
        doc.trip = v
      })
    arr.push(p)
  }
  return Promise.all(arr)
    .then(() => doc)
}

/**
 * Update carStopTrip.
 * @param {Object} db
 * @param {string} carStopTripID
 * @param {Object} obj
 * @returns {Object}
 */
function updateCarStopTrip (db, carStopTripID, obj) {
  return db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carStopTripID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete carStopTrip.
 * @param {Object} db
 * @param {string} carStopTripID
 * @returns {Object}
 */
function deleteCarStopTrip (db, carStopTripID) {
  return db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carStopTripID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createCarStopTrip,
  countCarStopTrips,
  getCarStopTrips,
  getCarStopTripByID,
  getCarStopTripsByIDs,
  updateCarStopTrip,
  deleteCarStopTrip,
}

const { getCarStopsByIDs, getCarStopByID } = require('./CarStop')
const { getTripsByIDs, getTripByID } = require('./Trip')

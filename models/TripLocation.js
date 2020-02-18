const { ObjectID } = require('mongodb')

/**
 * Creats tripLocation.
 * @param {Object} db
 * @param {string} tripID
 * @param {Array} location
 * @param {number} time
 * @returns {Object}
 */
function createTripLocation (db, tripID, location, time) {
  return db.collection(process.env.TRIP_LOCATION_COLLECTION)
    .insertOne({
      tripID,
      location,
      time,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count tripLocations.
 * @param {Object} db
 * @returns {Object}
 */
function countTripLocations (db) {
  return db.collection(process.env.TRIP_LOCATION_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get tripLocations.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='trip']
 * @returns {Object}
 */
function getTripLocations (db, page, extra = 'trip') {
  return db.collection(process.env.TRIP_LOCATION_COLLECTION)
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
 * Get tripLocations by trip.
 * @param {Object} db
 * @param {string} tripID
 * @param {number} [page=1]
 * @returns {Object}
 */
function getTripLocationsByTrip (db, tripID, page = 1) {
  return db.collection(process.env.TRIP_LOCATION_COLLECTION)
    .find({ isDeleted: false, tripID })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
}

/**
 * Get tripLocation by id.
 * @param {Object} db
 * @param {string} tripLocationID
 * @param {string} [extra='trip']
 * @returns {Object}
 */
function getTripLocationByID (db, tripLocationID, extra = 'trip') {
  return db.collection(process.env.TRIP_LOCATION_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(tripLocationID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get tripLocations by ids.
 * @param {Object} db
 * @param {Array} tripLocationIDs
 * @param {string} [extra='trip']
 * @returns {Object}
 */
function getTripLocationsByIDs (db, tripLocationIDs, extra = 'trip') {
  return db.collection(process.env.TRIP_LOCATION_COLLECTION)
    .find({ isDeleted: false, _id: { $in: tripLocationIDs } })
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
    let tripIDs = []
    docs.forEach(({ tripID }) => {
      if (e.includes('trip') && tripID != null) {
        tripIDs.push(ObjectID(tripID))
      }
    })
    let trips
    let arr = []
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
          let { tripID } = c
          if (trips !== undefined && tripID != null) {
            c.trip = trips[tripID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { tripID } = doc
  let arr = []
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
 * Update tripLocation.
 * @param {Object} db
 * @param {string} tripLocationID
 * @param {Object} obj
 * @returns {Object}
 */
function updateTripLocation (db, tripLocationID, obj) {
  return db.collection(process.env.TRIP_LOCATION_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(tripLocationID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete tripLocation.
 * @param {Object} db
 * @param {string} tripLocationID
 * @returns {Object}
 */
function deleteTripLocation (db, tripLocationID) {
  return db.collection(process.env.TRIP_LOCATION_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(tripLocationID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createTripLocation,
  countTripLocations,
  getTripLocations,
  getTripLocationByID,
  getTripLocationsByIDs,
  updateTripLocation,
  deleteTripLocation,
  getTripLocationsByTrip,
}

const { getTripsByIDs, getTripByID } = require('./Trip')

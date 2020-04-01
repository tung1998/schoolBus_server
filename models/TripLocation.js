const { ObjectID } = require('mongodb')

/**
 * Creats tripLocation.
 * @param {Object} db
 * @param {string} tripID
 * @param {Array} location
 * @param {number} time
 * @param {string} schoolID
 * @returns {Object}
 */
function createTripLocation (db, tripID, location, time, schoolID) {
  return db.collection(process.env.TRIP_LOCATION_COLLECTION)
    .insertOne({
      tripID,
      location,
      time,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count tripLocations.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countTripLocations (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_LOCATION_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count tripLocations by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countTripLocationsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_LOCATION_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get tripLocations.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='trip,school']
 * @returns {Object}
 */
function getTripLocations (db, query, limit, page, extra = 'trip,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_LOCATION_COLLECTION)
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
 * Get tripLocations by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='trip,school']
 * @returns {Object}
 */
function getTripLocationsBySchool (db, schoolID, query, limit, page, extra = 'trip,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_LOCATION_COLLECTION)
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
 * @param {string} [extra='trip,school']
 * @returns {Object}
 */
function getTripLocationByID (db, tripLocationID, extra = 'trip,school') {
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
 * @param {string} [extra='trip,school']
 * @returns {Object}
 */
function getTripLocationsByIDs (db, tripLocationIDs, extra = 'trip,school') {
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
    let schoolIDs = []
    docs.forEach(({ tripID, schoolID }) => {
      if (e.includes('trip') && tripID != null) {
        tripIDs.push(ObjectID(tripID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let trips
    let schools
    let arr = []
    if (tripIDs.length > 0) {
      let p = getTripsByIDs(db, tripIDs)
        .then((v) => {
          trips = v
        })
      arr.push(p)
    }
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
          let { tripID, schoolID } = c
          if (trips !== undefined && tripID != null) {
            c.trip = trips[tripID]
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { tripID, schoolID } = doc
  let arr = []
  if (e.includes('trip') && tripID != null) {
    let p = getTripByID(db, tripID)
      .then((v) => {
        doc.trip = v
      })
    arr.push(p)
  }
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

/**
 * Delete tripLocations by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteTripLocationsBySchool (db, schoolID) {
  return db.collection(process.env.TRIP_LOCATION_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteTripLocation(db, String(_id))
      })
    })
}

module.exports = {
  createTripLocation,
  countTripLocations,
  countTripLocationsBySchool,
  getTripLocations,
  getTripLocationsBySchool,
  getTripLocationsByTrip,
  getTripLocationByID,
  getTripLocationsByIDs,
  updateTripLocation,
  deleteTripLocation,
  deleteTripLocationsBySchool,
}

const parseQuery = require('./parseQuery')
const { getTripsByIDs, getTripByID } = require('./Trip')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

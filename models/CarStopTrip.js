const { ObjectID } = require('mongodb')

/**
 * Creats carStopTrip.
 * @param {Object} db
 * @param {string} carStopID
 * @param {string} tripID
 * @param {number} reachTime
 * @param {string} schoolID
 * @returns {Object}
 */
function createCarStopTrip (db, carStopID, tripID, reachTime, schoolID) {
  return db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
    .insertOne({
      carStopID,
      tripID,
      reachTime,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carStopTrips.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countCarStopTrips (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count carStopTrips by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countCarStopTripsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get carStopTrips.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='carStop,trip,school']
 * @returns {Object}
 */
function getCarStopTrips (db, query, limit, page, extra = 'carStop,trip,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
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
 * Get carStopTrips by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='carStop,trip,school']
 * @returns {Object}
 */
function getCarStopTripsBySchool (db, schoolID, query, limit, page, extra = 'carStop,trip,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
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
 * Get carStopTrip by id.
 * @param {Object} db
 * @param {string} carStopTripID
 * @param {string} [extra='carStop,trip,school']
 * @returns {Object}
 */
function getCarStopTripByID (db, carStopTripID, extra = 'carStop,trip,school') {
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
 * @param {string} [extra='carStop,trip,school']
 * @returns {Object}
 */
function getCarStopTripsByIDs (db, carStopTripIDs, extra = 'carStop,trip,school') {
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
 * Get carStopTrips by trip.
 * @param {Object} db
 * @param {string} tripID
 * @param {number} [page=1]
 * @param {string} [extra='carStop,trip,school']
 * @returns {Object}
 */
function getCarStopTripsByTrip (db, tripID, page = 1, extra = 'carStop,trip,school') {
  return db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
    .find({ isDeleted: false, tripID })
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
    let schoolIDs = []
    docs.forEach(({ carStopID, tripID, schoolID }) => {
      if (e.includes('carStop') && carStopID != null) {
        carStopIDs.push(ObjectID(carStopID))
      }
      if (e.includes('trip') && tripID != null) {
        tripIDs.push(ObjectID(tripID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let carStops
    let trips
    let schools
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
          let { carStopID, tripID, schoolID } = c
          if (carStops !== undefined && carStopID != null) {
            c.carStop = carStops[carStopID]
          }
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
  let { carStopID, tripID, schoolID } = doc
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

/**
 * Delete carStopTrips by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteCarStopTripsBySchool (db, schoolID) {
  return db.collection(process.env.CAR_STOP_TRIP_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteCarStopTrip(db, String(_id))
      })
    })
}

module.exports = {
  createCarStopTrip,
  countCarStopTrips,
  countCarStopTripsBySchool,
  getCarStopTrips,
  getCarStopTripsBySchool,
  getCarStopTripByID,
  getCarStopTripsByIDs,
  getCarStopTripsByTrip,
  updateCarStopTrip,
  deleteCarStopTrip,
  deleteCarStopTripsBySchool,
}

const parseQuery = require('./parseQuery')
const { getCarStopsByIDs, getCarStopByID } = require('./CarStop')
const { getTripsByIDs, getTripByID } = require('./Trip')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

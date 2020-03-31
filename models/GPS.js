const { ObjectID } = require('mongodb')

/**
 * Creats GPS.
 * @param {Object} db
 * @param {string} carID
 * @param {Array} location
 * @param {string} schoolID
 * @returns {Object}
 */
function createGPS (db, carID, location, schoolID) {
  return db.collection(process.env.GPS_COLLECTION)
    .insertOne({
      carID,
      location,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count GPS.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countGPS (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.GPS_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count GPS by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countGPSBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.GPS_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get GPS.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getGPS (db, query, limit, page, extra = 'car,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.GPS_COLLECTION)
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
 * Get GPS by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getGPSBySchool (db, schoolID, query, limit, page, extra = 'car,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.GPS_COLLECTION)
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
 * Get GPS by id.
 * @param {Object} db
 * @param {string} GPSID
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getGPSByID (db, GPSID, extra = 'car,school') {
  return db.collection(process.env.GPS_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(GPSID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get GPS by ids.
 * @param {Object} db
 * @param {Array} GPSIDs
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getGPSByIDs (db, GPSIDs, extra = 'car,school') {
  return db.collection(process.env.GPS_COLLECTION)
    .find({ isDeleted: false, _id: { $in: GPSIDs } })
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
    let carIDs = []
    let schoolIDs = []
    docs.forEach(({ carID, schoolID }) => {
      if (e.includes('car') && carID != null) {
        carIDs.push(ObjectID(carID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let cars
    let schools
    let arr = []
    if (carIDs.length > 0) {
      let p = getCarsByIDs(db, carIDs)
        .then((v) => {
          cars = v
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
          let { carID, schoolID } = c
          if (cars !== undefined && carID != null) {
            c.car = cars[carID]
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { carID, schoolID } = doc
  let arr = []
  if (e.includes('car') && carID != null) {
    let p = getCarByID(db, carID)
      .then((v) => {
        doc.car = v
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
 * Update GPS.
 * @param {Object} db
 * @param {string} GPSID
 * @param {Object} obj
 * @returns {Object}
 */
function updateGPS (db, GPSID, obj) {
  return db.collection(process.env.GPS_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(GPSID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete GPS.
 * @param {Object} db
 * @param {string} GPSID
 * @returns {Object}
 */
function deleteGPS (db, GPSID) {
  return db.collection(process.env.GPS_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(GPSID) },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete GPS by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteGPSBySchool (db, schoolID) {
  return db.collection(process.env.GPS_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteGPS(db, String(_id))
      })
    })
}

/**
 * Get GPS by car.
 * @param {Object} db
 * @param {string} carID
 * @param {number} page
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getGPSByCar (db, carID, page, extra = 'car,school') {
  return db.collection(process.env.GPS_COLLECTION)
    .find({ isDeleted: false, carID })
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
 * Get GPS last.
 * @param {Object} db
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getGPSLast (db, extra = 'car,school') {
  return db.collection(process.env.GPS_COLLECTION)
    .distinct('carID', { isDeleted: false })
    .then((v) => {
      let arr = v.map(c => (
        db.collection(process.env.GPS_COLLECTION)
          .find({ isDeleted: false, carID: c })
          .sort({ createdTime: -1 })
          .limit(1)
          .toArray()
          .then(([doc]) => doc)
      ))
      return Promise.all(arr)
    })
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

module.exports = {
  createGPS,
  countGPS,
  countGPSBySchool,
  getGPS,
  getGPSBySchool,
  getGPSByID,
  getGPSByIDs,
  updateGPS,
  deleteGPS,
  deleteGPSBySchool,
  getGPSByCar,
  getGPSLast,
}

const parseQuery = require('./parseQuery')
const { getCarsByIDs, getCarByID } = require('./Car')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

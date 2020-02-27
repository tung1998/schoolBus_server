const { ObjectID } = require('mongodb')

/**
 * Creats GPS.
 * @param {Object} db
 * @param {string} carID
 * @param {Array} location
 * @returns {Object}
 */
function createGPS (db, carID, location) {
  return db.collection(process.env.GPS_COLLECTION)
    .insertOne({
      carID,
      location,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count GPS.
 * @param {Object} db
 * @returns {Object}
 */
function countGPS (db) {
  return db.collection(process.env.GPS_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get GPS.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='car']
 * @returns {Object}
 */
function getGPS (db, page, extra = 'car') {
  return db.collection(process.env.GPS_COLLECTION)
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
 * Get GPS by id.
 * @param {Object} db
 * @param {string} GPSID
 * @param {string} [extra='car']
 * @returns {Object}
 */
function getGPSByID (db, GPSID, extra = 'car') {
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
 * @param {string} [extra='car']
 * @returns {Object}
 */
function getGPSByIDs (db, GPSIDs, extra = 'car') {
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
    docs.forEach(({ carID }) => {
      if (e.includes('car') && carID != null) {
        carIDs.push(ObjectID(carID))
      }
    })
    let cars
    let arr = []
    if (carIDs.length > 0) {
      let p = getCarsByIDs(db, carIDs)
        .then((v) => {
          cars = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { carID } = c
          if (cars !== undefined && carID != null) {
            c.car = cars[carID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { carID } = doc
  let arr = []
  if (e.includes('car') && carID != null) {
    let p = getCarByID(db, carID)
      .then((v) => {
        doc.car = v
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
 * Get GPS by car.
 * @param {Object} db
 * @param {string} carID
 * @param {number} page
 * @param {string} [extra='car']
 * @returns {Object}
 */
function getGPSByCar (db, carID, page, extra = 'car') {
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

module.exports = {
  createGPS,
  countGPS,
  getGPS,
  getGPSByID,
  getGPSByIDs,
  updateGPS,
  deleteGPS,
  getGPSByCar,
}

const { getCarsByIDs, getCarByID } = require('./Car')

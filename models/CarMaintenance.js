const { ObjectID } = require('mongodb')

/**
 * Creats carMaintenance.
 * @param {Object} db
 * @param {string} carID
 * @param {number} type
 * @param {string} description
 * @param {number} price
 * @returns {Object}
 */
function createCarMaintenance (db, carID, type, description, price) {
  return db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
    .insertOne({
      carID,
      type,
      description,
      price,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carMaintenances.
 * @param {Object} db
 * @returns {Object}
 */
function countCarMaintenances (db) {
  return db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get carMaintenances.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='car']
 * @returns {Object}
 */
function getCarMaintenances (db, page, extra = 'car') {
  return db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
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
 * Get carMaintenance by id.
 * @param {Object} db
 * @param {string} carMaintenanceID
 * @param {string} [extra='car']
 * @returns {Object}
 */
function getCarMaintenanceByID (db, carMaintenanceID, extra = 'car') {
  return db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(carMaintenanceID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get carMaintenances by ids.
 * @param {Object} db
 * @param {Array} carMaintenanceIDs
 * @param {string} [extra='car']
 * @returns {Object}
 */
function getCarMaintenancesByIDs (db, carMaintenanceIDs, extra = 'car') {
  return db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
    .find({ isDeleted: false, _id: { $in: carMaintenanceIDs } })
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
 * Update carMaintenance.
 * @param {Object} db
 * @param {string} carMaintenanceID
 * @param {Object} obj
 * @returns {Object}
 */
function updateCarMaintenance (db, carMaintenanceID, obj) {
  return db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carMaintenanceID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete carMaintenance.
 * @param {Object} db
 * @param {string} carMaintenanceID
 * @returns {Object}
 */
function deleteCarMaintenance (db, carMaintenanceID) {
  return db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carMaintenanceID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createCarMaintenance,
  countCarMaintenances,
  getCarMaintenances,
  getCarMaintenanceByID,
  getCarMaintenancesByIDs,
  updateCarMaintenance,
  deleteCarMaintenance,
}

const { getCarsByIDs, getCarByID } = require('./Car')

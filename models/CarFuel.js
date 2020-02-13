const { ObjectID } = require('mongodb')

/**
 * Creats carFuel.
 * @param {Object} db
 * @param {string} carID
 * @param {number} volume
 * @param {number} price
 * @returns {Object}
 */
function createCarFuel (db, carID, volume, price) {
  return db.collection(process.env.CAR_FUEL_COLLECTION)
    .insertOne({
      carID,
      volume,
      price,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carFuels.
 * @param {Object} db
 * @returns {Object}
 */
function countCarFuels (db) {
  return db.collection(process.env.CAR_FUEL_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get carFuels.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='car']
 * @returns {Object}
 */
function getCarFuels (db, page, extra = 'car') {
  return db.collection(process.env.CAR_FUEL_COLLECTION)
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
 * Get carFuel by id.
 * @param {Object} db
 * @param {string} carFuelID
 * @param {string} [extra='car']
 * @returns {Object}
 */
function getCarFuelByID (db, carFuelID, extra = 'car') {
  return db.collection(process.env.CAR_FUEL_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(carFuelID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get carFuels by ids.
 * @param {Object} db
 * @param {Array} carFuelIDs
 * @param {string} [extra='car']
 * @returns {Object}
 */
function getCarFuelsByIDs (db, carFuelIDs, extra = 'car') {
  return db.collection(process.env.CAR_FUEL_COLLECTION)
    .find({ isDeleted: false, _id: { $in: carFuelIDs } })
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
 * Update carFuel.
 * @param {Object} db
 * @param {string} carFuelID
 * @param {Object} obj
 * @returns {Object}
 */
function updateCarFuel (db, carFuelID, obj) {
  return db.collection(process.env.CAR_FUEL_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carFuelID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete carFuel.
 * @param {Object} db
 * @param {string} carFuelID
 * @returns {Object}
 */
function deleteCarFuel (db, carFuelID) {
  return db.collection(process.env.CAR_FUEL_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carFuelID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createCarFuel,
  countCarFuels,
  getCarFuels,
  getCarFuelByID,
  getCarFuelsByIDs,
  updateCarFuel,
  deleteCarFuel,
}

const { getCarsByIDs, getCarByID } = require('./Car')

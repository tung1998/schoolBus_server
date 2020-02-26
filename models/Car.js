const { ObjectID } = require('mongodb')

/**
 * Creats car.
 * @param {Object} db
 * @param {string} carModelID
 * @param {number} status
 * @param {string} numberPlate
 * @returns {Object}
 */
function createCar (db, carModelID, status, numberPlate) {
  return db.collection(process.env.CAR_COLLECTION)
    .insertOne({
      carModelID,
      status,
      numberPlate,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count cars.
 * @param {Object} db
 * @returns {Object}
 */
function countCars (db) {
  return db.collection(process.env.CAR_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get cars.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='carModel']
 * @returns {Object}
 */
function getCars (db, page, extra = 'carModel') {
  return db.collection(process.env.CAR_COLLECTION)
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
 * Get car by id.
 * @param {Object} db
 * @param {string} carID
 * @param {string} [extra='carModel']
 * @returns {Object}
 */
function getCarByID (db, carID, extra = 'carModel') {
  return db.collection(process.env.CAR_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(carID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get cars by ids.
 * @param {Object} db
 * @param {Array} carIDs
 * @param {string} [extra='carModel']
 * @returns {Object}
 */
function getCarsByIDs (db, carIDs, extra = 'carModel') {
  return db.collection(process.env.CAR_COLLECTION)
    .find({ isDeleted: false, _id: { $in: carIDs } })
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
    let carModelIDs = []
    docs.forEach(({ carModelID }) => {
      if (e.includes('carModel') && carModelID != null) {
        carModelIDs.push(ObjectID(carModelID))
      }
    })
    let carModels
    let arr = []
    if (carModelIDs.length > 0) {
      let p = getCarModelsByIDs(db, carModelIDs)
        .then((v) => {
          carModels = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { carModelID } = c
          if (carModels !== undefined && carModelID != null) {
            c.carModel = carModels[carModelID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { carModelID } = doc
  let arr = []
  if (e.includes('carModel') && carModelID != null) {
    let p = getCarModelByID(db, carModelID)
      .then((v) => {
        doc.carModel = v
      })
    arr.push(p)
  }
  return Promise.all(arr)
    .then(() => doc)
}

/**
 * Update car.
 * @param {Object} db
 * @param {string} carID
 * @param {Object} obj
 * @returns {Object}
 */
function updateCar (db, carID, obj) {
  return db.collection(process.env.CAR_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete car.
 * @param {Object} db
 * @param {string} carID
 * @returns {Object}
 */
function deleteCar (db, carID) {
  return db.collection(process.env.CAR_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carID) },
      { $set: { isDeleted: true } },
    )
}

/**
 * Delete cars by carModel.
 * @param {Object} db
 * @param {string} carModelID
 * @returns {Object}
 */
function deleteCarsByCarModel (db, carModelID) {
  return db.collection(process.env.CAR_COLLECTION)
    .find({ isDeleted: false, carModelID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteCar(db, String(_id))
      })
    })
}

module.exports = {
  createCar,
  countCars,
  getCars,
  getCarByID,
  getCarsByIDs,
  updateCar,
  deleteCar,
  deleteCarsByCarModel,
}

const { getCarModelsByIDs, getCarModelByID } = require('./CarModel')

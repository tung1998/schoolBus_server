const { ObjectID } = require('mongodb')

/**
 * Creats carModel.
 * @param {Object} db
 * @param {string} brand
 * @param {number} model
 * @param {number} seatNumber
 * @param {number} fuelType
 * @param {number} fuelCapacity
 * @param {number} maintenanceDay
 * @param {number} maintenanceDistance
 * @returns {Object}
 */
function createCarModel (db, brand, model, seatNumber, fuelType, fuelCapacity, maintenanceDay, maintenanceDistance) {
  return db.collection(process.env.CAR_MODEL_COLLECTION)
    .insertOne({
      brand,
      model,
      seatNumber,
      fuelType,
      fuelCapacity,
      maintenanceDay,
      maintenanceDistance,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carModels.
 * @param {Object} db
 * @returns {Object}
 */
function countCarModels (db) {
  return db.collection(process.env.CAR_MODEL_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get carModels.
 * @param {Object} db
 * @param {number} page
 * @returns {Object}
 */
function getCarModels (db, page) {
  return db.collection(process.env.CAR_MODEL_COLLECTION)
    .find({ isDeleted: false })
    .skip(process.env.LIMIT_DOCUMENT_PER_PAGE * (page - 1))
    .limit(Number(process.env.LIMIT_DOCUMENT_PER_PAGE))
    .toArray()
}

/**
 * Get carModel by id.
 * @param {Object} db
 * @param {string} carModelID
 * @returns {Object}
 */
function getCarModelByID (db, carModelID) {
  return db.collection(process.env.CAR_MODEL_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(carModelID) })
}

/**
 * Get carModels by ids.
 * @param {Object} db
 * @param {Array} carModelIDs
 * @returns {Object}
 */
function getCarModelsByIDs (db, carModelIDs) {
  return db.collection(process.env.CAR_MODEL_COLLECTION)
    .find({ isDeleted: false, _id: { $in: carModelIDs } })
    .toArray()
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Update carModel.
 * @param {Object} db
 * @param {string} carModelID
 * @param {Object} obj
 * @returns {Object}
 */
function updateCarModel (db, carModelID, obj) {
  return db.collection(process.env.CAR_MODEL_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carModelID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete carModel.
 * @param {Object} db
 * @param {string} carModelID
 * @returns {Object}
 */
function deleteCarModel (db, carModelID) {
  let p = db.collection(process.env.CAR_MODEL_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(carModelID) },
      { $set: { isDeleted: true } },
    )
  p.then(({ matchedCount }) => {
    if (matchedCount === 1) {
      deleteCarsByCarModel(db, carModelID)
    }
  })
  return p
}

module.exports = {
  createCarModel,
  countCarModels,
  getCarModels,
  getCarModelByID,
  getCarModelsByIDs,
  updateCarModel,
  deleteCarModel,
}

const { deleteCarsByCarModel } = require('./Car')

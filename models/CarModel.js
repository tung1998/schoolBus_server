const { ObjectID } = require('mongodb')

/**
 * Creats carModel.
 * @param {Object} db
 * @param {string} brand
 * @param {string} model
 * @param {number} seatNumber
 * @param {number} fuelType
 * @param {number} fuelCapacity
 * @param {number} maintenanceDay
 * @param {number} maintenanceDistance
 * @param {string} schoolID
 * @returns {Object}
 */
function createCarModel (db, brand, model, seatNumber, fuelType, fuelCapacity, maintenanceDay, maintenanceDistance, schoolID) {
  return db.collection(process.env.CAR_MODEL_COLLECTION)
    .insertOne({
      brand,
      model,
      seatNumber,
      fuelType,
      fuelCapacity,
      maintenanceDay,
      maintenanceDistance,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carModels.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countCarModels (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_MODEL_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count carModels by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countCarModelsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_MODEL_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get carModels.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getCarModels (db, query, limit, page, extra = 'school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_MODEL_COLLECTION)
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
 * Get carModels by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getCarModelsBySchool (db, schoolID, query, limit, page, extra = 'school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_MODEL_COLLECTION)
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
 * Get carModel by id.
 * @param {Object} db
 * @param {string} carModelID
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getCarModelByID (db, carModelID, extra = 'school') {
  return db.collection(process.env.CAR_MODEL_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(carModelID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get carModels by ids.
 * @param {Object} db
 * @param {Array} carModelIDs
 * @param {string} [extra='school']
 * @returns {Object}
 */
function getCarModelsByIDs (db, carModelIDs, extra = 'school') {
  return db.collection(process.env.CAR_MODEL_COLLECTION)
    .find({ isDeleted: false, _id: { $in: carModelIDs } })
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
    let schoolIDs = []
    docs.forEach(({ schoolID }) => {
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let schools
    let arr = []
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
          let { schoolID } = c
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { schoolID } = doc
  let arr = []
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

/**
 * Delete carModels by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteCarModelsBySchool (db, schoolID) {
  return db.collection(process.env.CAR_MODEL_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteCarModel(db, String(_id))
      })
    })
}

module.exports = {
  createCarModel,
  countCarModels,
  countCarModelsBySchool,
  getCarModels,
  getCarModelsBySchool,
  getCarModelByID,
  getCarModelsByIDs,
  updateCarModel,
  deleteCarModel,
  deleteCarModelsBySchool,
}

const parseQuery = require('./parseQuery')
const { getSchoolsByIDs, getSchoolByID } = require('./School')
const { deleteCarsByCarModel } = require('./Car')

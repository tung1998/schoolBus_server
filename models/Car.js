const { ObjectID } = require('mongodb')

/**
 * Creats car.
 * @param {Object} db
 * @param {string} carModelID
 * @param {number} status
 * @param {string} numberPlate
 * @param {string} schoolID
 * @returns {Object}
 */
function createCar (db, carModelID, status, numberPlate, schoolID) {
  return db.collection(process.env.CAR_COLLECTION)
    .insertOne({
      carModelID,
      status,
      numberPlate,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count cars.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countCars (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count cars by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countCarsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get cars.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='carModel,school']
 * @returns {Object}
 */
function getCars (db, query, limit, page, extra = 'carModel,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_COLLECTION)
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
 * Get cars by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='carModel,school']
 * @returns {Object}
 */
function getCarsBySchool (db, schoolID, query, limit, page, extra = 'carModel,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_COLLECTION)
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
 * Get car by id.
 * @param {Object} db
 * @param {string} carID
 * @param {string} [extra='carModel,school']
 * @returns {Object}
 */
function getCarByID (db, carID, extra = 'carModel,school') {
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
 * @param {string} [extra='carModel,school']
 * @returns {Object}
 */
function getCarsByIDs (db, carIDs, extra = 'carModel,school') {
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
    let schoolIDs = []
    docs.forEach(({ carModelID, schoolID }) => {
      if (e.includes('carModel') && carModelID != null) {
        carModelIDs.push(ObjectID(carModelID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
    })
    let carModels
    let schools
    let arr = []
    if (carModelIDs.length > 0) {
      let p = getCarModelsByIDs(db, carModelIDs)
        .then((v) => {
          carModels = v
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
          let { carModelID, schoolID } = c
          if (carModels !== undefined && carModelID != null) {
            c.carModel = carModels[carModelID]
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { carModelID, schoolID } = doc
  let arr = []
  if (e.includes('carModel') && carModelID != null) {
    let p = getCarModelByID(db, carModelID)
      .then((v) => {
        doc.carModel = v
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
 * Delete cars by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteCarsBySchool (db, schoolID) {
  return db.collection(process.env.CAR_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteCar(db, String(_id))
      })
    })
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
  countCarsBySchool,
  getCars,
  getCarsBySchool,
  getCarByID,
  getCarsByIDs,
  updateCar,
  deleteCar,
  deleteCarsBySchool,
  deleteCarsByCarModel,
}

const parseQuery = require('./parseQuery')
const { getCarModelsByIDs, getCarModelByID } = require('./CarModel')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

const { ObjectID } = require('mongodb')

/**
 * Creats carFuel.
 * @param {Object} db
 * @param {string} carID
 * @param {number} volume
 * @param {number} price
 * @param {string} schoolID
 * @returns {Object}
 */
function createCarFuel (db, carID, volume, price, schoolID) {
  return db.collection(process.env.CAR_FUEL_COLLECTION)
    .insertOne({
      carID,
      volume,
      price,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carFuels.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countCarFuels (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_FUEL_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count carFuels by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countCarFuelsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_FUEL_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get carFuels.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getCarFuels (db, query, limit, page, extra = 'car,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_FUEL_COLLECTION)
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
 * Get carFuels by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getCarFuelsBySchool (db, schoolID, query, limit, page, extra = 'car,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_FUEL_COLLECTION)
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
 * Get carFuel by id.
 * @param {Object} db
 * @param {string} carFuelID
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getCarFuelByID (db, carFuelID, extra = 'car,school') {
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
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getCarFuelsByIDs (db, carFuelIDs, extra = 'car,school') {
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

/**
 * Delete carFuels by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteCarFuelsBySchool (db, schoolID) {
  return db.collection(process.env.CAR_FUEL_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteCarFuel(db, String(_id))
      })
    })
}

module.exports = {
  createCarFuel,
  countCarFuels,
  countCarFuelsBySchool,
  getCarFuels,
  getCarFuelsBySchool,
  getCarFuelByID,
  getCarFuelsByIDs,
  updateCarFuel,
  deleteCarFuel,
  deleteCarFuelsBySchool,
}

const parseQuery = require('./parseQuery')
const { getCarsByIDs, getCarByID } = require('./Car')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

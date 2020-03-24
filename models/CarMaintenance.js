const { ObjectID } = require('mongodb')

/**
 * Creats carMaintenance.
 * @param {Object} db
 * @param {string} carID
 * @param {number} type
 * @param {string} description
 * @param {number} price
 * @param {string} schoolID
 * @returns {Object}
 */
function createCarMaintenance (db, carID, type, description, price, schoolID) {
  return db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
    .insertOne({
      carID,
      type,
      description,
      price,
      schoolID,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count carMaintenances.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countCarMaintenances (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count carMaintenances by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countCarMaintenancesBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get carMaintenances.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getCarMaintenances (db, query, limit, page, extra = 'car,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
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
 * Get carMaintenances by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getCarMaintenancesBySchool (db, schoolID, query, limit, page, extra = 'car,school') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
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
 * Get carMaintenance by id.
 * @param {Object} db
 * @param {string} carMaintenanceID
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getCarMaintenanceByID (db, carMaintenanceID, extra = 'car,school') {
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
 * @param {string} [extra='car,school']
 * @returns {Object}
 */
function getCarMaintenancesByIDs (db, carMaintenanceIDs, extra = 'car,school') {
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

/**
 * Delete carMaintenances by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteCarMaintenancesBySchool (db, schoolID) {
  return db.collection(process.env.CAR_MAINTENANCE_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteCarMaintenance(db, String(_id))
      })
    })
}

module.exports = {
  createCarMaintenance,
  countCarMaintenances,
  countCarMaintenancesBySchool,
  getCarMaintenances,
  getCarMaintenancesBySchool,
  getCarMaintenanceByID,
  getCarMaintenancesByIDs,
  updateCarMaintenance,
  deleteCarMaintenance,
  deleteCarMaintenancesBySchool,
}

const parseQuery = require('./parseQuery')
const { getCarsByIDs, getCarByID } = require('./Car')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

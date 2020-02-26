const { ObjectID } = require('mongodb')

/**
 * Creats route.
 * @param {Object} db
 * @param {Array} requireCarStop
 * @param {Array} pickupCarStop
 * @param {Array} takeoffCarStop
 * @param {number} toll
 * @param {string} carID
 * @param {string} driverID
 * @param {string} nannyID
 * @param {Array} studentIDs
 * @returns {Object}
 */
function createRoute (db, requireCarStop, pickupCarStop, takeoffCarStop, toll, carID, driverID, nannyID, studentIDs) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .insertOne({
      requireCarStop,
      pickupCarStop,
      takeoffCarStop,
      toll,
      carID,
      driverID,
      nannyID,
      studentIDs,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count routes.
 * @param {Object} db
 * @returns {Object}
 */
function countRoutes (db) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get routes.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='carStop,car,driver,nanny,student']
 * @returns {Object}
 */
function getRoutes (db, page, extra = 'carStop,car,driver,nanny,student') {
  return db.collection(process.env.ROUTE_COLLECTION)
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
 * Get route by id.
 * @param {Object} db
 * @param {string} routeID
 * @param {string} [extra='carStop,car,driver,nanny,student']
 * @returns {Object}
 */
function getRouteByID (db, routeID, extra = 'carStop,car,driver,nanny,student') {
  return db.collection(process.env.ROUTE_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(routeID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get routes by ids.
 * @param {Object} db
 * @param {Array} routeIDs
 * @param {string} [extra='carStop,car,driver,nanny,student']
 * @returns {Object}
 */
function getRoutesByIDs (db, routeIDs, extra = 'carStop,car,driver,nanny,student') {
  return db.collection(process.env.ROUTE_COLLECTION)
    .find({ isDeleted: false, _id: { $in: routeIDs } })
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
    let carStopIDs = []
    let carIDs = []
    let driverIDs = []
    let nannyIDs = []
    let studentIDs = []
    docs.forEach(({ requireCarStop, pickupCarStop, takeoffCarStop, carID, driverID, nannyID, studentIDs: sIDs }) => {
      if (e.includes('carStop')) {
        if (Array.isArray(requireCarStop)) {
          requireCarStop.forEach(({ carStopID }) => {
            if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
          })
        }
        if (Array.isArray(pickupCarStop)) {
          pickupCarStop.forEach(({ carStopID }) => {
            if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
          })
        }
        if (Array.isArray(takeoffCarStop)) {
          takeoffCarStop.forEach(({ carStopID }) => {
            if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
          })
        }
      }
      if (e.includes('car') && carID != null) {
        carIDs.push(ObjectID(carID))
      }
      if (e.includes('driver') && driverID != null) {
        driverIDs.push(ObjectID(driverID))
      }
      if (e.includes('nanny') && nannyID != null) {
        nannyIDs.push(ObjectID(nannyID))
      }
      if (e.includes('student') && Array.isArray(sIDs)) {
        studentIDs.push(...sIDs.map(ObjectID))
      }
    })
    let carStops
    let cars
    let drivers
    let nannies
    let students
    let arr = []
    if (carStopIDs.length > 0) {
      let p = getCarStopsByIDs(db, carStopIDs)
        .then((v) => {
          carStops = v
        })
      arr.push(p)
    }
    if (carIDs.length > 0) {
      let p = getCarsByIDs(db, carIDs)
        .then((v) => {
          cars = v
        })
      arr.push(p)
    }
    if (driverIDs.length > 0) {
      let p = getDriversByIDs(db, driverIDs)
        .then((v) => {
          drivers = v
        })
      arr.push(p)
    }
    if (nannyIDs.length > 0) {
      let p = getNanniesByIDs(db, nannyIDs)
        .then((v) => {
          nannies = v
        })
      arr.push(p)
    }
    if (studentIDs.length > 0) {
      let p = getStudentsByIDs(db, studentIDs)
        .then((v) => {
          students = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { requireCarStop, pickupCarStop, takeoffCarStop, carID, driverID, nannyID, studentIDs: sIDs } = c
          if (carStops !== undefined) {
            if (Array.isArray(requireCarStop)) {
              requireCarStop.forEach((c) => {
                if (c.carStopID != null) c.carStop = carStops[c.carStopID]
              })
            }
            if (Array.isArray(pickupCarStop)) {
              pickupCarStop.forEach((c) => {
                if (c.carStopID != null) c.carStop = carStops[c.carStopID]
              })
            }
            if (Array.isArray(takeoffCarStop)) {
              takeoffCarStop.forEach((c) => {
                if (c.carStopID != null) c.carStop = carStops[c.carStopID]
              })
            }
          }
          if (cars !== undefined && carID != null) {
            c.car = cars[carID]
          }
          if (drivers !== undefined && driverID != null) {
            c.driver = drivers[driverID]
          }
          if (nannies !== undefined && nannyID != null) {
            c.nanny = nannies[nannyID]
          }
          if (students !== undefined && Array.isArray(sIDs)) {
            c.students = sIDs.map(e => students[e])
          }
        })
        return docs
      })
  }
  let doc = docs
  let { requireCarStop, pickupCarStop, takeoffCarStop, carID, driverID, nannyID, studentIDs } = doc
  let arr = []
  if (e.includes('carStop')) {
    let carStopIDs = []
    if (Array.isArray(requireCarStop)) {
      requireCarStop.forEach(({ carStopID }) => {
        if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
      })
    }
    if (Array.isArray(pickupCarStop)) {
      pickupCarStop.forEach(({ carStopID }) => {
        if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
      })
    }
    if (Array.isArray(takeoffCarStop)) {
      takeoffCarStop.forEach(({ carStopID }) => {
        if (carStopID != null) carStopIDs.push(ObjectID(carStopID))
      })
    }
    if (carStopIDs.length > 0) {
      let p = getCarStopsByIDs(db, carStopIDs)
        .then((v) => {
          if (Array.isArray(requireCarStop)) {
            requireCarStop.forEach((c) => {
              if (c.carStopID != null) c.carStop = v[c.carStopID]
            })
          }
          if (Array.isArray(pickupCarStop)) {
            pickupCarStop.forEach((c) => {
              if (c.carStopID != null) c.carStop = v[c.carStopID]
            })
          }
          if (Array.isArray(takeoffCarStop)) {
            takeoffCarStop.forEach((c) => {
              if (c.carStopID != null) c.carStop = v[c.carStopID]
            })
          }
        })
      arr.push(p)
    }
  }
  if (e.includes('car') && carID != null) {
    let p = getCarByID(db, carID)
      .then((v) => {
        doc.car = v
      })
    arr.push(p)
  }
  if (e.includes('driver') && driverID != null) {
    let p = getDriverByID(db, driverID)
      .then((v) => {
        doc.driver = v
      })
    arr.push(p)
  }
  if (e.includes('nanny') && nannyID != null) {
    let p = getNannyByID(db, nannyID)
      .then((v) => {
        doc.nanny = v
      })
    arr.push(p)
  }
  if (e.includes('student') && Array.isArray(studentIDs)) {
    let p = getStudentsByIDs(db, studentIDs.map(ObjectID))
      .then((v) => {
        doc.students = doc.studentIDs.map(c => v[c])
      })
    arr.push(p)
  }
  return Promise.all(arr)
    .then(() => doc)
}

/**
 * Update route.
 * @param {Object} db
 * @param {string} routeID
 * @param {Object} obj
 * @returns {Object}
 */
function updateRoute (db, routeID, obj) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(routeID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Delete route.
 * @param {Object} db
 * @param {string} routeID
 * @returns {Object}
 */
function deleteRoute (db, routeID) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(routeID) },
      { $set: { isDeleted: true } },
    )
}

module.exports = {
  createRoute,
  countRoutes,
  getRoutes,
  getRouteByID,
  getRoutesByIDs,
  updateRoute,
  deleteRoute,
}

const { getCarStopsByIDs } = require('./CarStop')
const { getCarsByIDs, getCarByID } = require('./Car')
const { getDriversByIDs, getDriverByID } = require('./Driver')
const { getNanniesByIDs, getNannyByID } = require('./Nanny')
const { getStudentsByIDs } = require('./Student')

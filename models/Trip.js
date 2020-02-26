const { ObjectID } = require('mongodb')

const TRIP_STATUS_WAITING = 0 // đợi
const TRIP_STATUS_RUNNING = 1 // tiến hành
const TRIP_STATUS_END = 2 // kết thúc
const TRIP_STATUS_CANCEL = 3 // hủy

/**
 * Creats trip.
 * @param {Object} db
 * @param {string} carID
 * @param {string} driverID
 * @param {string} nannyID
 * @param {string} routeID
 * @param {Array} students
 * @param {Array} attendance
 * @param {number} type
 * @param {number} [status=TRIP_STATUS_WAITING]
 * @param {string} note
 * @param {Array} accident
 * @param {number} startTime
 * @param {number} endTime
 * @returns {Object}
 */
function createTrip (db, carID, driverID, nannyID, routeID, students, attendance, type, status = TRIP_STATUS_WAITING, note, accident, startTime, endTime) {
  return db.collection(process.env.TRIP_COLLECTION)
    .insertOne({
      carID,
      driverID,
      nannyID,
      routeID,
      students,
      attendance,
      type,
      status,
      note,
      accident,
      startTime,
      endTime,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count trips.
 * @param {Object} db
 * @returns {Object}
 */
function countTrips (db) {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false })
    .count()
}

/**
 * Get trips.
 * @param {Object} db
 * @param {number} page
 * @param {string} [extra='car,driver,nanny,route,student']
 * @returns {Object}
 */
function getTrips (db, page, extra = 'car,driver,nanny,route,student') {
  return db.collection(process.env.TRIP_COLLECTION)
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
 * Get trip by id.
 * @param {Object} db
 * @param {string} tripID
 * @param {string} [extra='car,driver,nanny,route,student']
 * @returns {Object}
 */
function getTripByID (db, tripID, extra = 'car,driver,nanny,route,student') {
  return db.collection(process.env.TRIP_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(tripID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get trips by ids.
 * @param {Object} db
 * @param {Array} tripIDs
 * @param {string} [extra='car,driver,nanny,route,student']
 * @returns {Object}
 */
function getTripsByIDs (db, tripIDs, extra = 'car,driver,nanny,route,student') {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, _id: { $in: tripIDs } })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
    .then(v => v.reduce((a, c) => ({ ...a, [c._id]: c }), {}))
}

/**
 * Get trips by nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @param {number} start
 * @param {number} end
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @param {number} startTimeSortValue
 * @returns {Object}
 */
function getTripsByNanny (db, nannyID, start, end, sortBy, sortType, limit, page, extra, startTimeSortValue) {
  let query = { nannyID, status: { $in: [TRIP_STATUS_WAITING, TRIP_STATUS_RUNNING, TRIP_STATUS_END] } }
  if (start !== undefined && end !== undefined) query.startTime = { $gte: start, $lt: end }
  return get(db, query, sortBy, sortType, limit, page, extra, startTimeSortValue)
}

/**
 * Get trips by route.
 * @param {Object} db
 * @param {string} routeID
 * @param {number} start
 * @param {number} end
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @param {number} startTimeSortValue
 * @returns {Object}
 */
function getTripsByRoute (db, routeID, start, end, sortBy, sortType, limit, page, extra, startTimeSortValue) {
  let query = { routeID, status: { $in: [TRIP_STATUS_WAITING, TRIP_STATUS_RUNNING, TRIP_STATUS_END] } }
  if (start !== undefined && end !== undefined) query.startTime = { $gte: start, $lt: end }
  return get(db, query, sortBy, sortType, limit, page, extra, startTimeSortValue)
}

/**
 * Get trips by car.
 * @param {Object} db
 * @param {string} carID
 * @param {number} start
 * @param {number} end
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @param {number} startTimeSortValue
 * @returns {Object}
 */
function getTripsByCar (db, carID, start, end, sortBy, sortType, limit, page, extra, startTimeSortValue) {
  let query = { carID, status: { $in: [TRIP_STATUS_WAITING, TRIP_STATUS_RUNNING, TRIP_STATUS_END] } }
  if (start !== undefined && end !== undefined) query.startTime = { $gte: start, $lt: end }
  return get(db, query, sortBy, sortType, limit, page, extra, startTimeSortValue)
}

/**
 * Get trips by driver.
 * @param {Object} db
 * @param {string} driverID
 * @param {number} start
 * @param {number} end
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @param {number} startTimeSortValue
 * @returns {Object}
 */
function getTripsByDriver (db, driverID, start, end, sortBy, sortType, limit, page, extra, startTimeSortValue) {
  let query = { driverID, status: { $in: [TRIP_STATUS_WAITING, TRIP_STATUS_RUNNING, TRIP_STATUS_END] } }
  if (start !== undefined && end !== undefined) query.startTime = { $gte: start, $lt: end }
  return get(db, query, sortBy, sortType, limit, page, extra, startTimeSortValue)
}

/**
 * Get.
 * @param {Object} db
 * @param {Object} query
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @param {number} startTimeSortValue
 * @returns {Object}
 */
function get (db, query, sortBy, sortType, limit, page, extra, startTimeSortValue) {
  if (query.isDeleted === undefined) query.isDeleted = false
  let keyOnList = {}
  if (sortBy) {
    sortBy = sortBy.split(',')
    if (sortType) sortType = sortType.split(',')
    sortBy.forEach((e, i) => {
      keyOnList[e] = sortType ? (Number(sortType[i]) || 1) : 1
    })
  }
  if (keyOnList.startTime === undefined && startTimeSortValue !== undefined) keyOnList.startTime = startTimeSortValue
  if (!limit) limit = Number(process.env.LIMIT_DOCUMENT_PER_PAGE)
  if (!page) page = 1
  let p = db.collection(process.env.TRIP_COLLECTION)
    .find(query)
    .limit(limit)
    .skip(limit * (page - 1))
    .sort(keyOnList)
    .toArray()
  p = p.then((trips) => {
    if (trips.length === 0) return []
    if (!extra) return trips
    return addExtra(db, trips, extra)
  })
  return p
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
    let driverIDs = []
    let nannyIDs = []
    let routeIDs = []
    let studentIDs = []
    docs.forEach(({ carID, driverID, nannyID, routeID, students: s }) => {
      if (e.includes('car') && carID != null) {
        carIDs.push(ObjectID(carID))
      }
      if (e.includes('driver') && driverID != null) {
        driverIDs.push(ObjectID(driverID))
      }
      if (e.includes('nanny') && nannyID != null) {
        nannyIDs.push(ObjectID(nannyID))
      }
      if (e.includes('route') && routeID != null) {
        routeIDs.push(ObjectID(routeID))
      }
      if (e.includes('student') && Array.isArray(s)) {
        studentIDs.push(...s.map(({ studentID }) => ObjectID(studentID)))
      }
    })
    let cars
    let drivers
    let nannies
    let routes
    let students
    let arr = []
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
    if (routeIDs.length > 0) {
      let p = getRoutesByIDs(db, routeIDs)
        .then((v) => {
          routes = v
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
          let { carID, driverID, nannyID, routeID, students: s } = c
          if (cars !== undefined && carID != null) {
            c.car = cars[carID]
          }
          if (drivers !== undefined && driverID != null) {
            c.driver = drivers[driverID]
          }
          if (nannies !== undefined && nannyID != null) {
            c.nanny = nannies[nannyID]
          }
          if (routes !== undefined && routeID != null) {
            c.route = routes[routeID]
          }
          if (students !== undefined && Array.isArray(s)) {
            c.students.forEach((e) => {
              e.student = students[e.studentID]
            })
          }
        })
        return docs
      })
  }
  let doc = docs
  let { carID, driverID, nannyID, routeID, students } = doc
  let arr = []
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
  if (e.includes('route') && routeID != null) {
    let p = getRouteByID(db, routeID)
      .then((v) => {
        doc.route = v
      })
    arr.push(p)
  }
  if (e.includes('student') && Array.isArray(students)) {
    let studentIDs = students.map(({ studentID }) => ObjectID(studentID))
    let p = getStudentsByIDs(db, studentIDs)
      .then((v) => {
        doc.students.forEach((c) => {
          c.student = v[c.studentID]
        })
      })
    arr.push(p)
  }
  return Promise.all(arr)
    .then(() => doc)
}

/**
 * Update trip.
 * @param {Object} db
 * @param {string} tripID
 * @param {Object} obj
 * @returns {Object}
 */
function updateTrip (db, tripID, obj) {
  return db.collection(process.env.TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(tripID) },
      { $set: { updatedTime: Date.now(), ...obj } },
    )
}

/**
 * Update trip status.
 * @param {Object} db
 * @param {string} tripID
 * @param {number} status
 * @returns {Object}
 */
function updateTripStatus (db, tripID, status) {
  let $set = { updatedTime: Date.now(), status }
  if (status === TRIP_STATUS_END) $set.endTime = Date.now()
  return db.collection(process.env.TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(tripID) },
      { $set },
    )
}

/**
 * Update trip student status.
 * @param {Object} db
 * @param {string} tripID
 * @param {string} studentID
 * @param {number} status
 * @returns {Object}
 */
function updateTripStudentStatus (db, tripID, studentID, status) {
  return db.collection(process.env.TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(tripID), 'students.studentID': studentID },
      { $set: { updatedTime: Date.now(), 'students.$.status': status } },
    )
}

/**
 * Delete trip.
 * @param {Object} db
 * @param {string} tripID
 * @returns {Object}
 */
function deleteTrip (db, tripID) {
  let p = db.collection(process.env.TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(tripID) },
      { $set: { isDeleted: true } },
    )
  p.then(({ matchedCount }) => {
    if (matchedCount === 1) {
      deleteStudentTrips(db, 'tripID', tripID)
    }
  })
  return p
}

module.exports = {
  createTrip,
  countTrips,
  getTrips,
  getTripByID,
  getTripsByIDs,
  getTripsByNanny,
  getTripsByRoute,
  getTripsByCar,
  getTripsByDriver,
  updateTrip,
  updateTripStatus,
  updateTripStudentStatus,
  deleteTrip,
}

const { getCarsByIDs, getCarByID } = require('./Car')
const { getDriversByIDs, getDriverByID } = require('./Driver')
const { getNanniesByIDs, getNannyByID } = require('./Nanny')
const { getRoutesByIDs, getRouteByID } = require('./Route')
const { getStudentsByIDs } = require('./Student')
const { deleteStudentTrips } = require('./StudentTrip')

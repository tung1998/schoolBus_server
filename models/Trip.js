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
 * @param {string} schoolID
 * @param {Array} carStops
 * @param {number} delayTime
 * @returns {Object}
 */
function createTrip (db, carID, driverID, nannyID, routeID, students, attendance, type, status = TRIP_STATUS_WAITING, note, accident, startTime, endTime, schoolID, carStops, delayTime) {
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
      schoolID,
      carStops,
      delayTime,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count trips.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countTrips (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count trips by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countTripsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Count trips by student.
 * @param {Object} db
 * @param {string} studentID
 * @param {Object} query
 * @returns {Object}
 */
function countTripsByStudent (db, studentID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, 'students.studentID': studentID }, query] })
        .count()
    ))
}

/**
 * Count trips by driver.
 * @param {Object} db
 * @param {string} driverID
 * @param {Object} query
 * @returns {Object}
 */
function countTripsByDriver (db, driverID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, driverID }, query] })
        .count()
    ))
}

/**
 * Count trips by nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @param {Object} query
 * @returns {Object}
 */
function countTripsByNanny (db, nannyID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, nannyID }, query] })
        .count()
    ))
}

/**
 * Count trips by students.
 * @param {Object} db
 * @param {Array} studentIDs
 * @param {Object} query
 * @returns {Object}
 */
function countTripsByStudents (db, studentIDs, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, 'students.studentID': { $in: studentIDs } }, query] })
        .count()
    ))
}

/**
 * Get trips.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getTrips (db, query, limit, page, extra = 'car,driver,nanny,route,student,school,carStop') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
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
 * Get trips by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getTripsBySchool (db, schoolID, query, limit, page, extra = 'car,driver,nanny,route,student,school,carStop') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
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
 * Get trips by student.
 * @param {Object} db
 * @param {string} studentID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getTripsByStudent (db, studentID, query, limit, page, extra = 'car,driver,nanny,route,student,school,carStop') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, 'students.studentID': studentID }, query] })
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
 * Get trips by driver.
 * @param {Object} db
 * @param {string} driverID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getTripsByDriver (db, driverID, query, limit, page, extra = 'car,driver,nanny,route,student,school,carStop') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, driverID }, query] })
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
 * Get trips by nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getTripsByNanny (db, nannyID, query, limit, page, extra = 'car,driver,nanny,route,student,school,carStop') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, nannyID }, query] })
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
 * Get trips by students.
 * @param {Object} db
 * @param {Array} studentIDs
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getTripsByStudents (db, studentIDs, query, limit, page, extra = 'car,driver,nanny,route,student,school,carStop') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, 'students.studentID': { $in: studentIDs } }, query] })
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
 * Get trip by id.
 * @param {Object} db
 * @param {string} tripID
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getTripByID (db, tripID, extra = 'car,driver,nanny,route,student,school,carStop') {
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
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getTripsByIDs (db, tripIDs, extra = 'car,driver,nanny,route,student,school,carStop') {
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
 * Get trips by time.
 * @param {Object} db
 * @param {number} startTime
 * @param {number} endTime
 * @param {Object} query
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getTripsByTime (db, startTime, endTime, query, extra = 'car,driver,nanny,route,student,school,carStop') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.TRIP_COLLECTION)
        .find({ $and: [{ isDeleted: false, startTime: { $gte: startTime, $lt: endTime } }, query] })
        .toArray()
        .then((v) => {
          if (v.length === 0) return []
          if (!extra) return v
          return addExtra(db, v, extra)
        })
    ))
}

/**
 * Get next trip by driver.
 * @param {Object} db
 * @param {string} driverID
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getNextTripByDriver (db, driverID, extra = 'car,driver,nanny,route,student,school,carStop') {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, driverID, startTime: { $gt: Date.now() }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .limit(1)
    .toArray()
    .then(([v]) => {
      if (v === undefined) return undefined
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get next trip by nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getNextTripByNanny (db, nannyID, extra = 'car,driver,nanny,route,student,school,carStop') {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, nannyID, startTime: { $gt: Date.now() }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .limit(1)
    .toArray()
    .then(([v]) => {
      if (v === undefined) return undefined
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get next trip by student.
 * @param {Object} db
 * @param {string} studentID
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getNextTripByStudent (db, studentID, extra = 'car,driver,nanny,route,student,school,carStop') {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, 'students.studentID': studentID, startTime: { $gt: Date.now() }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .limit(1)
    .toArray()
    .then(([v]) => {
      if (v === undefined) return undefined
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get next trip by students.
 * @param {Object} db
 * @param {Array} studentIDs
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getNextTripByStudents (db, studentIDs, extra = 'car,driver,nanny,route,student,school,carStop') {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, 'students.studentID': { $in: studentIDs }, startTime: { $gt: Date.now() }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .limit(1)
    .toArray()
    .then(([v]) => {
      if (v === undefined) return undefined
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get all next trips by driver.
 * @param {Object} db
 * @param {string} driverID
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getAllNextTripsByDriver (db, driverID, extra = 'car,driver,nanny,route,student,school,carStop') {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, driverID, startTime: { $gt: Date.now() }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get all next trips by nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getAllNextTripsByNanny (db, nannyID, extra = 'car,driver,nanny,route,student,school,carStop') {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, nannyID, startTime: { $gt: Date.now() }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get all next trips by student.
 * @param {Object} db
 * @param {string} studentID
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getAllNextTripsByStudent (db, studentID, extra = 'car,driver,nanny,route,student,school,carStop') {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, 'students.studentID': studentID, startTime: { $gt: Date.now() }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get all next trips by students.
 * @param {Object} db
 * @param {Array} studentIDs
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getAllNextTripsByStudents (db, studentIDs, extra = 'car,driver,nanny,route,student,school,carStop') {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, 'students.studentID': { $in: studentIDs }, startTime: { $gt: Date.now() }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get current trip by driver.
 * @param {Object} db
 * @param {string} driverID
 * @param {number} beforeTime
 * @param {number} afterTime
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getCurrentTripByDriver (db, driverID, beforeTime, afterTime, extra = 'car,driver,nanny,route,student,school,carStop') {
  let n = Date.now()
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, driverID, startTime: { $gte: n - beforeTime, $lt: n + afterTime }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .limit(1)
    .toArray()
    .then(([v]) => {
      if (v === undefined) return undefined
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get current trip by nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @param {number} beforeTime
 * @param {number} afterTime
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getCurrentTripByNanny (db, nannyID, beforeTime, afterTime, extra = 'car,driver,nanny,route,student,school,carStop') {
  let n = Date.now()
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, nannyID, startTime: { $gte: n - beforeTime, $lt: n + afterTime }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .limit(1)
    .toArray()
    .then(([v]) => {
      if (v === undefined) return undefined
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get current trip by student.
 * @param {Object} db
 * @param {string} studentID
 * @param {number} beforeTime
 * @param {number} afterTime
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getCurrentTripByStudent (db, studentID, beforeTime, afterTime, extra = 'car,driver,nanny,route,student,school,carStop') {
  let n = Date.now()
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, 'students.studentID': studentID, startTime: { $gte: n - beforeTime, $lt: n + afterTime }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .limit(1)
    .toArray()
    .then(([v]) => {
      if (v === undefined) return undefined
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get current trip by students.
 * @param {Object} db
 * @param {Array} studentIDs
 * @param {number} beforeTime
 * @param {number} afterTime
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getCurrentTripByStudents (db, studentIDs, beforeTime, afterTime, extra = 'car,driver,nanny,route,student,school,carStop') {
  let n = Date.now()
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, 'students.studentID': { $in: studentIDs }, startTime: { $gte: n - beforeTime, $lt: n + afterTime }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .limit(1)
    .toArray()
    .then(([v]) => {
      if (v === undefined) return undefined
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get all current trips.
 * @param {Object} db
 * @param {number} beforeTime
 * @param {number} afterTime
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getAllCurrentTrips (db, beforeTime, afterTime, extra = 'car,driver,nanny,route,student,school,carStop') {
  let n = Date.now()
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, startTime: { $gte: n - beforeTime, $lt: n + afterTime }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get all current trips by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {number} beforeTime
 * @param {number} afterTime
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getAllCurrentTripsBySchool (db, schoolID, beforeTime, afterTime, extra = 'car,driver,nanny,route,student,school,carStop') {
  let n = Date.now()
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, schoolID, startTime: { $gte: n - beforeTime, $lt: n + afterTime }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get current trip by car.
 * @param {Object} db
 * @param {string} carID
 * @param {number} beforeTime
 * @param {number} afterTime
 * @param {string} [extra='car,driver,nanny,route,student,school,carStop']
 * @returns {Object}
 */
function getCurrentTripByCar (db, carID, beforeTime, afterTime, extra = 'car,driver,nanny,route,student,school,carStop') {
  let n = Date.now()
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, carID, startTime: { $gte: n - beforeTime, $lt: n + afterTime }, status: { $ne: 2 } })
    .sort({ startTime: 1 })
    .limit(1)
    .toArray()
    .then(([v]) => {
      if (v === undefined) return undefined
      if (!extra) return v
      return addExtra(db, v, extra)
    })
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
    let schoolIDs = []
    let carStopIDs = []
    docs.forEach(({ carID, driverID, nannyID, routeID, students: s, schoolID, carStops: cs }) => {
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
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
      if (e.includes('carStop') && Array.isArray(cs)) {
        carStopIDs.push(...cs.map(({ carStopID }) => ObjectID(carStopID)))
      }
    })
    let cars
    let drivers
    let nannies
    let routes
    let students
    let schools
    let carStops
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
    if (schoolIDs.length > 0) {
      let p = getSchoolsByIDs(db, schoolIDs)
        .then((v) => {
          schools = v
        })
      arr.push(p)
    }
    if (carStopIDs.length > 0) {
      let p = getCarStopsByIDs(db, carStopIDs)
        .then((v) => {
          carStops = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { carID, driverID, nannyID, routeID, students: s, schoolID, carStops: cs } = c
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
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
          if (carStops !== undefined && Array.isArray(cs)) {
            c.carStops.forEach((e) => {
              e.carStop = carStops[e.carStopID]
            })
          }
        })
        return docs
      })
  }
  let doc = docs
  let { carID, driverID, nannyID, routeID, students, schoolID, carStops } = doc
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
  if (e.includes('school') && schoolID != null) {
    let p = getSchoolByID(db, schoolID)
      .then((v) => {
        doc.school = v
      })
    arr.push(p)
  }
  if (e.includes('carStop') && Array.isArray(carStops)) {
    let carStopIDs = carStops.map(({ carStopID }) => ObjectID(carStopID))
    let p = getCarStopsByIDs(db, carStopIDs)
      .then((v) => {
        doc.carStops.forEach((c) => {
          c.carStop = v[c.carStopID]
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
 * Update trip carStop.
 * @param {Object} db
 * @param {string} tripID
 * @param {string} carStopID
 * @param {Object} obj
 * @returns {Object}
 */
function updateTripCarStop (db, tripID, carStopID, obj) {
  let $set = { updatedTime: Date.now() }
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) {
      $set[`carStops.$.${k}`] = v
    }
  })
  return db.collection(process.env.TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(tripID), 'carStops.carStopID': carStopID },
      { $set },
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

/**
 * Delete trips by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteTripsBySchool (db, schoolID) {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteTrip(db, String(_id))
      })
    })
}

/**
 * Update trips remove student.
 * @param {Object} db
 * @param {string} studentID
 * @returns {Object}
 */
function updateTripsRemoveStudent (db, studentID) {
  return db.collection(process.env.TRIP_COLLECTION)
    .updateMany(
      { isDeleted: false, students: { $elemMatch: { studentID } } },
      { $set: { updatedTime: Date.now() }, $pull: { students: { studentID } } },
    )
}

/**
 * Update trips remove carStop.
 * @param {Object} db
 * @param {string} carStopID
 * @returns {Object}
 */
function updateTripsRemoveCarStop (db, carStopID) {
  return db.collection(process.env.TRIP_COLLECTION)
    .updateMany(
      { isDeleted: false, carStops: { $elemMatch: { carStopID } } },
      { $set: { updatedTime: Date.now() }, $pull: { carStops: { carStopID } } },
    )
}

/**
 * Update trip student image.
 * @param {Object} db
 * @param {string} tripID
 * @param {string} studentID
 * @param {string} image
 * @returns {Object}
 */
function updateTripStudentImage (db, tripID, studentID, image) {
  return db.collection(process.env.TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(tripID), 'students.studentID': studentID },
      { $set: { updatedTime: Date.now(), 'students.$.image': image } },
    )
}

/**
 * Update trip student note.
 * @param {Object} db
 * @param {string} tripID
 * @param {string} studentID
 * @param {string} note
 * @returns {Object}
 */
function updateTripStudentNote (db, tripID, studentID, note) {
  return db.collection(process.env.TRIP_COLLECTION)
    .updateOne(
      { isDeleted: false, _id: ObjectID(tripID), 'students.studentID': studentID },
      { $set: { updatedTime: Date.now(), 'students.$.note': note } },
    )
}

/**
 * Get trip logs by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @param {number} start
 * @param {number} finish
 * @param {number} type
 * @returns {Object}
 */
function getTripLogsBySchool (db, schoolID, sortBy, sortType, limit, page, extra, start, finish, type) {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .toArray()
    .then((v) => {
      let tripIDs = v.map(({ _id }) => String(_id))
      return getLogsByObjects(db, 'trip', tripIDs, sortBy, sortType, limit, page, extra, start, finish, type)
    })
}

/**
 * Get trip logs by driver.
 * @param {Object} db
 * @param {string} driverID
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @param {number} start
 * @param {number} finish
 * @param {number} type
 * @returns {Object}
 */
function getTripLogsByDriver (db, driverID, sortBy, sortType, limit, page, extra, start, finish, type) {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, driverID })
    .toArray()
    .then((v) => {
      let tripIDs = v.map(({ _id }) => String(_id))
      return getLogsByObjects(db, 'trip', tripIDs, sortBy, sortType, limit, page, extra, start, finish, type)
    })
}

/**
 * Get trip logs by nanny.
 * @param {Object} db
 * @param {string} nannyID
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @param {number} start
 * @param {number} finish
 * @param {number} type
 * @returns {Object}
 */
function getTripLogsByNanny (db, nannyID, sortBy, sortType, limit, page, extra, start, finish, type) {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, nannyID })
    .toArray()
    .then((v) => {
      let tripIDs = v.map(({ _id }) => String(_id))
      return getLogsByObjects(db, 'trip', tripIDs, sortBy, sortType, limit, page, extra, start, finish, type)
    })
}

/**
 * Get trip logs by student.
 * @param {Object} db
 * @param {string} studentID
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @param {number} start
 * @param {number} finish
 * @param {number} type
 * @returns {Object}
 */
function getTripLogsByStudent (db, studentID, sortBy, sortType, limit, page, extra, start, finish, type) {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, 'students.studentID': studentID })
    .toArray()
    .then((v) => {
      let tripIDs = v.map(({ _id }) => String(_id))
      return getLogsByObjects(db, 'trip', tripIDs, sortBy, sortType, limit, page, extra, start, finish, type)
    })
}

/**
 * Get trip logs by student.
 * @param {Object} db
 * @param {Array} studentIDs
 * @param {string} sortBy
 * @param {string} sortType
 * @param {number} limit
 * @param {number} page
 * @param {string} extra
 * @param {number} start
 * @param {number} finish
 * @param {number} type
 * @returns {Object}
 */
function getTripLogsByStudents (db, studentIDs, sortBy, sortType, limit, page, extra, start, finish, type) {
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, 'students.studentID': { $in: studentIDs } })
    .toArray()
    .then((v) => {
      let tripIDs = v.map(({ _id }) => String(_id))
      return getLogsByObjects(db, 'trip', tripIDs, sortBy, sortType, limit, page, extra, start, finish, type)
    })
}

/**
 * Get trip student logs.
 * @param {Object} db
 * @param {string} tripID
 * @param {string} studentID
 * @param {string} extra
 * @returns {Object}
 */
function getTripStudentLogs (db, tripID, studentID, extra) {
  return db.collection(process.env.LOG_COLLECTION)
    .find({ isDeleted: false, objectType: 'trip', objectId: tripID, 'data.studentID': studentID })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return logAddExtra(db, v, extra)
    })
}

/**
 * Update trips parent request by time.
 * @param {Object} db
 * @param {string} tripID
 * @param {number} time
 * @param {string} studentID
 * @returns {Object}
 */
function updateTripsParentRequestByTime (db, tripID, time, studentID) {
  let query = { isDeleted: false, students: { $elemMatch: { studentID } } }
  if (tripID !== undefined) {
    query._id = ObjectID(tripID)
  } else {
    query.startTime = { $gte: new Date(time).setHours(0, 0, 0, 0), $lt: new Date(time).setHours(24, 0, 0, 0) }
  }
  return db.collection(process.env.TRIP_COLLECTION)
    .updateMany(
      query,
      { $set: { updatedTime: Date.now(), 'students.$.status': 3 } },
    )
}

/**
 * Gettrip problem in day.
 * @param {Object} db
 * @param {string} schoolID
 * @param {number} year
 * @param {number} month
 * @param {number} date
 * @returns {Object}
 */
function getTripProblemInDay (db, schoolID, year, month, date) {
  let start = new Date(year, month, date).getTime()
  let end = new Date(year, month, date, 24).getTime()
  return db.collection(process.env.TRIP_COLLECTION)
    .find({
      isDeleted: false,
      startTime: { $gte: start, $lt: end },
      $or: [
        { status: 4 },
        { students: { $elemMatch: { status: 3 } } },
      ],
      ...(schoolID === undefined ? {} : { schoolID }),
    })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      return addExtra(db, v, 'car,driver,nanny,route,student,school,carStop')
    })
    .then((v) => {
      return v.reduce((acc, cur) => {
        if (cur.status === 4) {
          acc.push({
            tripID: cur._id,
            trip: cur,
          })
        } else {
          cur.students.forEach((e) => {
            if (e.status === 3) {
              acc.push({
                tripID: cur._id,
                trip: cur,
                studentID: e.studentID,
                student: e.student,
              })
            }
          })
        }
        return acc
      }, [])
    })
}

module.exports = {
  createTrip,
  countTrips,
  countTripsBySchool,
  countTripsByStudent,
  countTripsByDriver,
  countTripsByNanny,
  countTripsByStudents,
  getTrips,
  getTripsBySchool,
  getTripsByStudent,
  getTripsByDriver,
  getTripsByNanny,
  getTripsByStudents,
  getTripByID,
  getTripsByIDs,
  getTripsByTime,
  getNextTripByDriver,
  getNextTripByNanny,
  getNextTripByStudent,
  getNextTripByStudents,
  getAllNextTripsByDriver,
  getAllNextTripsByNanny,
  getAllNextTripsByStudent,
  getAllNextTripsByStudents,
  getCurrentTripByDriver,
  getCurrentTripByNanny,
  getCurrentTripByStudent,
  getCurrentTripByStudents,
  getAllCurrentTrips,
  getAllCurrentTripsBySchool,
  getCurrentTripByCar,
  updateTrip,
  updateTripStatus,
  updateTripStudentStatus,
  updateTripCarStop,
  deleteTrip,
  deleteTripsBySchool,
  updateTripsRemoveStudent,
  updateTripsRemoveCarStop,
  updateTripStudentImage,
  updateTripStudentNote,
  getTripLogsBySchool,
  getTripLogsByDriver,
  getTripLogsByNanny,
  getTripLogsByStudent,
  getTripLogsByStudents,
  getTripStudentLogs,
  updateTripsParentRequestByTime,
  getTripProblemInDay,
}

const parseQuery = require('./parseQuery')
const { getCarsByIDs, getCarByID } = require('./Car')
const { getDriversByIDs, getDriverByID } = require('./Driver')
const { getNanniesByIDs, getNannyByID } = require('./Nanny')
const { getRoutesByIDs, getRouteByID } = require('./Route')
const { getStudentsByIDs } = require('./Student')
const { getSchoolsByIDs, getSchoolByID } = require('./School')
const { deleteStudentTrips } = require('./StudentTrip')
const { getLogsByObjects, addExtra: logAddExtra } = require('./Log')
const { getCarStopsByIDs } = require('./CarStop')

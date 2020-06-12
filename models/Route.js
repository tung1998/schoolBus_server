const { ObjectID } = require('mongodb')

/**
 * Creats route.
 * @param {Object} db
 * @param {string} startCarStopID
 * @param {string} endCarStopID
 * @param {number} toll
 * @param {string} carID
 * @param {string} driverID
 * @param {string} nannyID
 * @param {string} studentListID
 * @param {string} name
 * @param {string} startTime
 * @param {string} schoolID
 * @param {Array} carStops
 * @returns {Object}
 */
function createRoute (db, startCarStopID, endCarStopID, toll, carID, driverID, nannyID, studentListID, name, startTime, schoolID, carStops) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .insertOne({
      startCarStopID,
      endCarStopID,
      toll,
      carID,
      driverID,
      nannyID,
      studentListID,
      name,
      startTime,
      schoolID,
      carStops,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      isDeleted: false,
    })
}

/**
 * Count routes.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countRoutes (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.ROUTE_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count routes by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countRoutesBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.ROUTE_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Get routes.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='startCarStop,endCarStop,car,driver,nanny,studentList,school,carStops']
 * @returns {Object}
 */
function getRoutes (db, query, limit, page, extra = 'startCarStop,endCarStop,car,driver,nanny,studentList,school,carStops') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.ROUTE_COLLECTION)
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
 * Get routes by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='startCarStop,endCarStop,car,driver,nanny,studentList,school,carStops']
 * @returns {Object}
 */
function getRoutesBySchool (db, schoolID, query, limit, page, extra = 'startCarStop,endCarStop,car,driver,nanny,studentList,school,carStops') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.ROUTE_COLLECTION)
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
 * Get route by id.
 * @param {Object} db
 * @param {string} routeID
 * @param {string} [extra='startCarStop,endCarStop,car,driver,nanny,studentList,school,carStops']
 * @returns {Object}
 */
function getRouteByID (db, routeID, extra = 'startCarStop,endCarStop,car,driver,nanny,studentList,school,carStops') {
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
 * @param {string} [extra='startCarStop,endCarStop,car,driver,nanny,studentList,school,carStops']
 * @returns {Object}
 */
function getRoutesByIDs (db, routeIDs, extra = 'startCarStop,endCarStop,car,driver,nanny,studentList,school,carStops') {
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
    let startCarStopIDs = []
    let endCarStopIDs = []
    let carIDs = []
    let driverIDs = []
    let nannyIDs = []
    let studentListIDs = []
    let schoolIDs = []
    let carStopIDs = []
    docs.forEach(({ startCarStopID, endCarStopID, carID, driverID, nannyID, studentListID, schoolID, carStops: cs }) => {
      if (e.includes('startCarStop') && startCarStopID != null) {
        startCarStopIDs.push(ObjectID(startCarStopID))
      }
      if (e.includes('endCarStop') && endCarStopID != null) {
        endCarStopIDs.push(ObjectID(endCarStopID))
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
      if (e.includes('studentList') && studentListID != null) {
        studentListIDs.push(ObjectID(studentListID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
      if (e.includes('carStops') && Array.isArray(cs)) {
        carStopIDs.push(...cs.map(e => ObjectID(e.carStopID)))
      }
    })
    let startCarStops
    let endCarStops
    let cars
    let drivers
    let nannies
    let studentLists
    let schools
    let carStops
    let arr = []
    if (startCarStopIDs.length > 0) {
      let p = getCarStopsByIDs(db, startCarStopIDs)
        .then((v) => {
          startCarStops = v
        })
      arr.push(p)
    }
    if (endCarStopIDs.length > 0) {
      let p = getCarStopsByIDs(db, endCarStopIDs)
        .then((v) => {
          endCarStops = v
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
    if (studentListIDs.length > 0) {
      let p = getStudentListsByIDs(db, studentListIDs)
        .then((v) => {
          studentLists = v
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
          let { startCarStopID, endCarStopID, carID, driverID, nannyID, studentListID, schoolID, carStops: cs } = c
          if (startCarStops !== undefined && startCarStopID != null) {
            c.startCarStop = startCarStops[startCarStopID]
          }
          if (endCarStops !== undefined && endCarStopID != null) {
            c.endCarStop = endCarStops[endCarStopID]
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
          if (studentLists !== undefined && studentListID != null) {
            c.studentList = studentLists[studentListID]
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
          if (carStops !== undefined && Array.isArray(cs)) {
            c.carStops.forEach(e => {
              e.carStop = carStops[e.carStopID]
            })
          }
        })
        return docs
      })
  }
  let doc = docs
  let { startCarStopID, endCarStopID, carID, driverID, nannyID, studentListID, schoolID, carStops } = doc
  let arr = []
  if (e.includes('startCarStop') && startCarStopID != null) {
    let p = getCarStopByID(db, startCarStopID)
      .then((v) => {
        doc.startCarStop = v
      })
    arr.push(p)
  }
  if (e.includes('endCarStop') && endCarStopID != null) {
    let p = getCarStopByID(db, endCarStopID)
      .then((v) => {
        doc.endCarStop = v
      })
    arr.push(p)
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
  if (e.includes('studentList') && studentListID != null) {
    let p = getStudentListByID(db, studentListID)
      .then((v) => {
        doc.studentList = v
      })
    arr.push(p)
  }
  if (e.includes('carStops') && Array.isArray(carStops)) {
    let p = getCarStopsByIDs(db, carStops.map(({ carStopID }) => ObjectID(carStopID)))
      .then((v) => {
        doc.carStops.forEach(c => {
          c.carStop = v[c.carStopID]
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

/**
 * Delete routes by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteRoutesBySchool (db, schoolID) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteRoute(db, String(_id))
      })
    })
}

/**
 * Update routes carStops by studentList.
 * @param {Object} db
 * @param {string} studentListID
 * @param {Array} carStopIDs
 * @returns {Object}
 */
function updateRoutesCarStopsByStudentList (db, studentListID, carStopIDs) {
  return db.collection(process.env.ROUTE_COLLECTION)
    .find({ isDeleted: false, studentListID })
    .project({ carStops: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id, carStops }) => {
        let carStopIDsObj = carStopIDs.reduce((a, c) => ({ ...a, [c]: null }), {})
        carStops = carStops.filter(({ carStopID }) => {
          if (carStopID in carStopIDsObj) {
            delete carStopIDsObj[carStopID]
            return true
          }
          return false
        })
        Object.keys(carStopIDsObj).forEach((carStopID) => {
          carStops.push({ carStopID, delayTime: null })
        })
        updateRoute(db, String(_id), { carStops })
      })
    })
}

module.exports = {
  createRoute,
  countRoutes,
  countRoutesBySchool,
  getRoutes,
  getRoutesBySchool,
  getRouteByID,
  getRoutesByIDs,
  updateRoute,
  deleteRoute,
  deleteRoutesBySchool,
  updateRoutesCarStopsByStudentList,
}

const parseQuery = require('./parseQuery')
const { getCarStopsByIDs, getCarStopByID } = require('./CarStop')
const { getCarsByIDs, getCarByID } = require('./Car')
const { getDriversByIDs, getDriverByID } = require('./Driver')
const { getNanniesByIDs, getNannyByID } = require('./Nanny')
const { getStudentListsByIDs, getStudentListByID } = require('./StudentList')
const { getSchoolsByIDs, getSchoolByID } = require('./School')

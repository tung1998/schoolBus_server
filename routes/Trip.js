const express = require('express')
const router = express.Router()

const TripModel = require('./../models/Trip')
const RouteModel = require('./../models/Route')
const LogModel = require('./../models/Log')

router.post('/', (req, res, next) => {
  let { db } = req.app.locals
  let { routeID, attendance, status, note, accident, startTime, endTime, schoolID, delayTime } = req.body
  if (req.schoolID !== undefined) schoolID = req.schoolID
  if (routeID === undefined) return res.status(400).send({ message: 'Missing routeID' })
  RouteModel.getRouteByID(db, routeID, 'studentList')
    .then((v) => {
      if (v === null) return res.status(400).send({ message: 'Route Not Exist' })
      let { carID, driverID, nannyID, studentList, type } = v
      if (schoolID === undefined) schoolID = v.schoolID
      let students = studentList == null || !Array.isArray(studentList.studentIDs)
        ? []
        : studentList.studentIDs.map(c => ({ studentID: c, status: 0, image: null, note: null }))
      let carStops = studentList == null || !Array.isArray(studentList.carStopIDs)
        ? []
        : studentList.carStopIDs.map(carStopID => ({ carStopID, status: 0, note: null }))
      return TripModel.createTrip(db, carID, driverID, nannyID, routeID, students, attendance, type, status, note, accident, startTime, endTime, schoolID, carStops, delayTime)
        .then(({ insertedId }) => {
          res.send({ _id: insertedId })
          return LogModel.createLog(
            db,
            req.token ? req.token.userID : null,
            req.headers['user-agent'],
            req.ip,
            `Create trip : _id = ${insertedId}`,
            Date.now(),
            0,
            req.body,
            'trip',
            String(insertedId),
          )
        })
    })
    .catch(next)
})

router.get('/', (req, res, next) => {
  let { db } = req.app.locals
  let { limit, extra, ...query } = req.query
  limit = Number(limit)
  if (req.studentID !== undefined) {
    let result = {}
    return TripModel.getTripsByStudent(db, req.studentID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return TripModel.countTripsByStudent(db, req.studentID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  if (req.schoolID !== undefined) {
    let result = {}
    return TripModel.getTripsBySchool(db, req.schoolID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return TripModel.countTripsBySchool(db, req.schoolID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  if (req.nannyID !== undefined) {
    let result = {}
    return TripModel.getTripsByNanny(db, req.nannyID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return TripModel.countTripsByNanny(db, req.nannyID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  if (req.driverID !== undefined) {
    let result = {}
    return TripModel.getTripsByDriver(db, req.driverID, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return TripModel.countTripsByDriver(db, req.driverID, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  if (req.studentIDs !== undefined) {
    let result = {}
    return TripModel.getTripsByStudents(db, req.studentIDs, query, limit, 1, extra)
      .then((data) => {
        result.data = data
        return TripModel.countTripsByStudents(db, req.studentIDs, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = 1
        res.send(result)
      })
      .catch(next)
  }
  let result = {}
  TripModel.getTrips(db, query, limit, 1, extra)
    .then((data) => {
      result.data = data
      return TripModel.countTrips(db, query)
    })
    .then((cnt) => {
      result.count = cnt
      result.page = 1
      res.send(result)
    })
    .catch(next)
})

router.get('/:page(\\d+)', (req, res, next) => {
  let { db } = req.app.locals
  let { limit, extra, ...query } = req.query
  limit = Number(limit)
  let page = Number(req.params.page)
  if (!page || page <= 0) res.status(404).send({ message: 'Not Found' })
  else {
    if (req.studentID !== undefined) {
      let result = {}
      return TripModel.getTripsByStudent(db, req.studentID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return TripModel.countTripsByStudent(db, req.studentID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    if (req.schoolID !== undefined) {
      let result = {}
      return TripModel.getTripsBySchool(db, req.schoolID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return TripModel.countTripsBySchool(db, req.schoolID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    if (req.nannyID !== undefined) {
      let result = {}
      return TripModel.getTripsByNanny(db, req.nannyID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return TripModel.countTripsByNanny(db, req.nannyID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    if (req.driverID !== undefined) {
      let result = {}
      return TripModel.getTripsByDriver(db, req.driverID, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return TripModel.countTripsByDriver(db, req.driverID, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    if (req.studentIDs !== undefined) {
      let result = {}
      return TripModel.getTripsByStudents(db, req.studentIDs, query, limit, page, extra)
        .then((data) => {
          result.data = data
          return TripModel.countTripsByStudents(db, req.studentIDs, query)
        })
        .then((cnt) => {
          result.count = cnt
          result.page = page
          res.send(result)
        })
        .catch(next)
    }
    let result = {}
    TripModel.getTrips(db, query, limit, page, extra)
      .then((data) => {
        result.data = data
        return TripModel.countTrips(db, query)
      })
      .then((cnt) => {
        result.count = cnt
        result.page = page
        res.send(result)
      })
      .catch(next)
  }
})

router.get('/byTime', (req, res, next) => {
  let { db } = req.app.locals
  let { startTime, endTime, extra, ...query } = req.query
  startTime = Number(startTime)
  endTime = Number(endTime)
  TripModel.getTripsByTime(db, startTime, endTime, query, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/next', (req, res, next) => {
  if (req.driverID !== undefined) {
    return TripModel.getNextTripByDriver(req.app.locals.db, req.driverID, req.query.extra)
      .then((v) => {
        if (v === undefined) res.status(404).send({ message: 'Not Found' })
        else res.send(v)
      })
      .catch(next)
  }
  if (req.nannyID !== undefined) {
    return TripModel.getNextTripByNanny(req.app.locals.db, req.nannyID, req.query.extra)
      .then((v) => {
        if (v === undefined) res.status(404).send({ message: 'Not Found' })
        else res.send(v)
      })
      .catch(next)
  }
  if (req.studentID !== undefined) {
    return TripModel.getNextTripByStudent(req.app.locals.db, req.studentID, req.query.extra)
      .then((v) => {
        if (v === undefined) res.status(404).send({ message: 'Not Found' })
        else res.send(v)
      })
      .catch(next)
  }
  if (req.studentIDs !== undefined) {
    return TripModel.getNextTripByStudents(req.app.locals.db, req.studentIDs, req.query.extra)
      .then((v) => {
        if (v === undefined) res.status(404).send({ message: 'Not Found' })
        else res.send(v)
      })
      .catch(next)
  }
  return res.status(404).send({ message: 'Not Found' })
})

router.get('/history', (req, res, next) => {
  if (req.driverID !== undefined) {
    let { limit, page, extra, ...query } = req.query
    limit = Number(limit)
    page = Number(page)
    return TripModel.getTripsByDriver(req.app.locals.db, req.driverID, query, limit, page, extra)
      .then((v) => {
        res.send(v)
      })
      .catch(next)
  }
  return res.status(404).send({ message: 'Not Found' })
})

router.get('/allNext', (req, res, next) => {
  if (req.driverID !== undefined) {
    return TripModel.getAllNextTripsByDriver(req.app.locals.db, req.driverID, req.query.extra)
      .then((v) => {
        res.send(v)
      })
      .catch(next)
  }
  if (req.nannyID !== undefined) {
    return TripModel.getAllNextTripsByNanny(req.app.locals.db, req.nannyID, req.query.extra)
      .then((v) => {
        res.send(v)
      })
      .catch(next)
  }
  if (req.studentID !== undefined) {
    return TripModel.getAllNextTripsByStudent(req.app.locals.db, req.studentID, req.query.extra)
      .then((v) => {
        res.send(v)
      })
      .catch(next)
  }
  if (req.studentIDs !== undefined) {
    return TripModel.getAllNextTripsByStudents(req.app.locals.db, req.studentIDs, req.query.extra)
      .then((v) => {
        res.send(v)
      })
      .catch(next)
  }
  return res.status(404).send({ message: 'Not Found' })
})

router.get('/byStudent', (req, res, next) => {
  let { db } = req.app.locals
  let { studentID, limit, page, extra, ...query } = req.query
  TripModel.getTripsByStudent(db, studentID, query, limit, page, extra)
    .then((v) => {
      res.send(v)
    })
    .catch(next)
})

router.get('/:tripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { tripID } = req.params
  let { db } = req.app.locals
  let { extra } = req.query
  TripModel.getTripByID(db, tripID, extra)
    .then((v) => {
      if (v === null) res.status(404).send({ message: 'Not Found' })
      else res.send(v)
    })
    .catch(next)
})

router.put('/:tripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { tripID } = req.params
  let { carID, driverID, nannyID, routeID, students, attendance, type, status, note, accident, startTime, endTime, schoolID, carStops, delayTime } = req.body
  let obj = {}
  if (carID !== undefined) obj.carID = carID
  if (driverID !== undefined) obj.driverID = driverID
  if (nannyID !== undefined) obj.nannyID = nannyID
  if (routeID !== undefined) obj.routeID = routeID
  if (attendance !== undefined) obj.attendance = attendance
  if (type !== undefined) obj.type = type
  if (status !== undefined) obj.status = status
  if (note !== undefined) obj.note = note
  if (accident !== undefined) obj.accident = accident
  if (startTime !== undefined) obj.startTime = startTime
  if (endTime !== undefined) obj.endTime = endTime
  if (students !== undefined) obj.students = students
  if (schoolID !== undefined) obj.schoolID = schoolID
  if (carStops !== undefined) obj.carStops = carStops
  if (delayTime !== undefined) obj.delayTime = delayTime
  let { db } = req.app.locals
  TripModel.updateTrip(db, tripID, obj)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update trip : _id = ${tripID}`,
          Date.now(),
          1,
          req.body,
          'trip',
          tripID,
        )
      }
    })
    .catch(next)
})

router.put('/:tripID([0-9a-fA-F]{24})/status', (req, res, next) => {
  let { tripID } = req.params
  let { status } = req.body
  let { db } = req.app.locals
  TripModel.updateTripStatus(db, tripID, status)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update trip status : _id = ${tripID}`,
          Date.now(),
          1,
          req.body,
          'trip',
          tripID,
        )
      }
    })
    .catch(next)
})

router.delete('/:tripID([0-9a-fA-F]{24})', (req, res, next) => {
  let { tripID } = req.params
  let { db } = req.app.locals
  TripModel.deleteTrip(db, tripID)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Delete trip : _id = ${tripID}`,
          Date.now(),
          2,
          null,
          'trip',
          tripID,
        )
      }
    })
    .catch(next)
})

router.get('/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { sortBy, sortType, limit, page, extra = 'user,student,carStop' } = req.query
  limit = Number(limit)
  page = Number(page)
  if (req.schoolID !== undefined) {
    return TripModel.getTripLogsBySchool(db, req.schoolID, sortBy, sortType, limit, page, extra)
      .then(v => res.send(v))
      .catch(next)
  }
  if (req.driverID !== undefined) {
    return TripModel.getTripLogsByDriver(db, req.driverID, sortBy, sortType, limit, page, extra)
      .then(v => res.send(v))
      .catch(next)
  }
  if (req.nannyID !== undefined) {
    return TripModel.getTripLogsByNanny(db, req.nannyID, sortBy, sortType, limit, page, extra)
      .then(v => res.send(v))
      .catch(next)
  }
  if (req.studentID !== undefined) {
    return TripModel.getTripLogsByStudent(db, req.studentID, sortBy, sortType, limit, page, extra)
      .then(v => res.send(v))
      .catch(next)
  }
  if (req.studentIDs !== undefined) {
    return TripModel.getTripLogsByStudents(db, req.studentIDs, sortBy, sortType, limit, page, extra)
      .then(v => res.send(v))
      .catch(next)
  }
  LogModel.getLogsByObjectType(db, 'trip', sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.get('/:tripID([0-9a-fA-F]{24})/Log', (req, res, next) => {
  let { db } = req.app.locals
  let { tripID } = req.params
  let { sortBy, sortType, limit, page, extra = 'user,student,carStop' } = req.query
  limit = Number(limit)
  page = Number(page)
  LogModel.getLogsByObject(db, 'trip', tripID, sortBy, sortType, limit, page, extra)
    .then(v => res.send(v))
    .catch(next)
})

router.put('/:tripID([0-9a-fA-F]{24})/student/:studentID([0-9a-fA-F]{24})/status', (req, res, next) => {
  let { tripID, studentID } = req.params
  let { status } = req.body
  let { db } = req.app.locals
  TripModel.updateTripStudentStatus(db, tripID, studentID, status)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update trip student status : _id = ${tripID} studentID = ${studentID}`,
          Date.now(),
          1,
          { ...req.body, studentID },
          'trip',
          tripID,
        )
      }
    })
    .catch(next)
})

router.put('/:tripID([0-9a-fA-F]{24})/student/:studentID([0-9a-fA-F]{24})/image', (req, res, next) => {
  let { tripID, studentID } = req.params
  let { image } = req.body
  let { db } = req.app.locals
  TripModel.updateTripStudentImage(db, tripID, studentID, image)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update trip student image : _id = ${tripID} studentID = ${studentID}`,
          Date.now(),
          1,
          { ...req.body, studentID },
          'trip',
          tripID,
        )
      }
    })
    .catch(next)
})

router.put('/:tripID([0-9a-fA-F]{24})/student/:studentID([0-9a-fA-F]{24})/note', (req, res, next) => {
  let { tripID, studentID } = req.params
  let { note } = req.body
  let { db } = req.app.locals
  TripModel.updateTripStudentNote(db, tripID, studentID, note)
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update trip student note : _id = ${tripID} studentID = ${studentID}`,
          Date.now(),
          1,
          { ...req.body, studentID },
          'trip',
          tripID,
        )
      }
    })
    .catch(next)
})

router.put('/:tripID([0-9a-fA-F]{24})/carStop/:carStopID([0-9a-fA-F]{24})', (req, res, next) => {
  let { tripID, carStopID } = req.params
  let { status, note } = req.body
  let { db } = req.app.locals
  TripModel.updateTripCarStop(db, tripID, carStopID, { status, note })
    .then(({ matchedCount }) => {
      if (matchedCount === 0) res.status(404).send({ message: 'Not Found' })
      else {
        res.send()
        return LogModel.createLog(
          db,
          req.token ? req.token.userID : null,
          req.headers['user-agent'],
          req.ip,
          `Update trip carStop : _id = ${tripID} carStopID = ${carStopID}`,
          Date.now(),
          1,
          { ...req.body, carStopID },
          'trip',
          tripID,
        )
      }
    })
    .catch(next)
})

module.exports = router

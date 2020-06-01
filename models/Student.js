const { ObjectID } = require('mongodb')

const USER_TYPE_STUDENT = 1

const TRIP_STATUS_END = 2

/**
 * Creats student.
 * @param {Object} db
 * @param {string} username
 * @param {string} password
 * @param {string} image
 * @param {string} name
 * @param {string} phone
 * @param {string} email
 * @param {string} address
 * @param {string} IDStudent
 * @param {string} classID
 * @param {number} status
 * @param {string} carStopID
 * @param {string} schoolID
 * @param {string} dateOfBirth
 * @returns {Object}
 */
function createStudent (db, username, password, image, name, phone, email, address, IDStudent, classID, status, carStopID, schoolID, dateOfBirth) {
  return createUser(db, username, password, image, name, phone, email, USER_TYPE_STUDENT, schoolID, dateOfBirth)
    .then(({ insertedId }) => (
      db.collection(process.env.STUDENT_COLLECTION)
        .insertOne({
          userID: String(insertedId),
          address,
          IDStudent,
          classID,
          status,
          carStopID,
          schoolID,
          createdTime: Date.now(),
          updatedTime: Date.now(),
          isDeleted: false,
        })
    ))
}

/**
 * Count students.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function countStudents (db, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
        .find({ $and: [{ isDeleted: false }, query] })
        .count()
    ))
}

/**
 * Count students by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @returns {Object}
 */
function countStudentsBySchool (db, schoolID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
        .find({ $and: [{ isDeleted: false, schoolID }, query] })
        .count()
    ))
}

/**
 * Count students by class.
 * @param {Object} db
 * @param {string} classID
 * @param {Object} query
 * @returns {Object}
 */
function countStudentsByClass (db, classID, query) {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
        .find({ $and: [{ isDeleted: false, classID }, query] })
        .count()
    ))
}

/**
 * Get students.
 * @param {Object} db
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,class,carStop,school,parent']
 * @returns {Object}
 */
function getStudents (db, query, limit, page, extra = 'user,class,carStop,school,parent') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
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
 * Get students by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,class,carStop,school,parent']
 * @returns {Object}
 */
function getStudentsBySchool (db, schoolID, query, limit, page, extra = 'user,class,carStop,school,parent') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
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
 * Get students by class.
 * @param {Object} db
 * @param {string} classID
 * @param {Object} query
 * @param {number} limit
 * @param {number} page
 * @param {string} [extra='user,class,carStop,school,parent']
 * @returns {Object}
 */
function getStudentsByClass (db, classID, query, limit, page, extra = 'user,class,carStop,school,parent') {
  return parseQuery(db, query)
    .then(() => (
      db.collection(process.env.STUDENT_COLLECTION)
        .find({ $and: [{ isDeleted: false, classID }, query] })
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
 * Get student by id.
 * @param {Object} db
 * @param {string} studentID
 * @param {string} [extra='user,class,carStop,school,parent']
 * @returns {Object}
 */
function getStudentByID (db, studentID, extra = 'user,class,carStop,school,parent') {
  return db.collection(process.env.STUDENT_COLLECTION)
    .findOne({ isDeleted: false, _id: ObjectID(studentID) })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get student by user.
 * @param {Object} db
 * @param {string} userID
 * @param {string} [extra='user,class,carStop,school,parent']
 * @returns {Object}
 */
function getStudentByUser (db, userID, extra = 'user,class,carStop,school,parent') {
  return db.collection(process.env.STUDENT_COLLECTION)
    .findOne({ isDeleted: false, userID })
    .then((v) => {
      if (v === null) return null
      if (!extra) return v
      return addExtra(db, v, extra)
    })
}

/**
 * Get students by ids.
 * @param {Object} db
 * @param {Array} studentIDs
 * @param {string} [extra='user,class,carStop,school,parent']
 * @returns {Object}
 */
function getStudentsByIDs (db, studentIDs, extra = 'user,class,carStop,school,parent') {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, _id: { $in: studentIDs } })
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
    let userIDs = []
    let classIDs = []
    let carStopIDs = []
    let schoolIDs = []
    let _ids = []
    docs.forEach(({ userID, classID, carStopID, schoolID, _id }) => {
      if (e.includes('user') && userID != null) {
        userIDs.push(ObjectID(userID))
      }
      if (e.includes('class') && classID != null) {
        classIDs.push(ObjectID(classID))
      }
      if (e.includes('carStop') && carStopID != null) {
        carStopIDs.push(ObjectID(carStopID))
      }
      if (e.includes('school') && schoolID != null) {
        schoolIDs.push(ObjectID(schoolID))
      }
      if (e.includes('parent')) {
        _ids.push(String(_id))
      }
    })
    let users
    let classes
    let carStops
    let schools
    let parents
    let arr = []
    if (userIDs.length > 0) {
      let p = getUsersByIDs(db, userIDs)
        .then((v) => {
          users = v
        })
      arr.push(p)
    }
    if (classIDs.length > 0) {
      let p = getClassesByIDs(db, classIDs)
        .then((v) => {
          classes = v
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
    if (schoolIDs.length > 0) {
      let p = getSchoolsByIDs(db, schoolIDs)
        .then((v) => {
          schools = v
        })
      arr.push(p)
    }
    if (_ids.length > 0) {
      let p = getParentsByStudents(db, _ids, 'user')
        .then((v) => {
          parents = v
        })
      arr.push(p)
    }
    return Promise.all(arr)
      .then(() => {
        docs.forEach((c) => {
          let { userID, classID, carStopID, schoolID, _id } = c
          if (users !== undefined && userID != null) {
            c.user = users[userID]
          }
          if (classes !== undefined && classID != null) {
            c.class = classes[classID]
          }
          if (carStops !== undefined && carStopID != null) {
            c.carStop = carStops[carStopID]
          }
          if (schools !== undefined && schoolID != null) {
            c.school = schools[schoolID]
          }
          if (parents !== undefined) {
            c.parents = parents[_id]
          }
        })
        return docs
      })
  }
  let doc = docs
  let { userID, classID, carStopID, schoolID, _id } = doc
  let arr = []
  if (e.includes('user') && userID != null) {
    let p = getUserByID(db, userID)
      .then((v) => {
        doc.user = v
      })
    arr.push(p)
  }
  if (e.includes('class') && classID != null) {
    let p = getClassByID(db, classID)
      .then((v) => {
        doc.class = v
      })
    arr.push(p)
  }
  if (e.includes('carStop') && carStopID != null) {
    let p = getCarStopByID(db, carStopID)
      .then((v) => {
        doc.carStop = v
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
  if (e.includes('parent')) {
    let p = getParentsByStudent(db, String(_id), 'user')
      .then((v) => {
        doc.parents = v
      })
    arr.push(p)
  }
  return Promise.all(arr)
    .then(() => doc)
}

/**
 * Update student.
 * @param {Object} db
 * @param {string} studentID
 * @param {Object} obj
 * @param {Object} obj1
 * @returns {Object}
 */
function updateStudent (db, studentID, obj, obj1) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(studentID) },
      null,
      { $set: { updatedTime: Date.now(), ...obj } },
      { fields: { _id: 0, userID: 1, carStopID: 1 } },
    )
    .then((v) => {
      if (v.lastErrorObject.updatedExisting) {
        if (obj.carStopID !== undefined && obj.carStopID !== v.value.carStopID) updateStudentListsReplaceCarStop(db, studentID, v.value.carStopID, obj.carStopID)
        return updateUser(db, v.value.userID, obj1)
          .then(() => v)
      }
      return v
    })
}

/**
 * Delete student.
 * @param {Object} db
 * @param {string} studentID
 * @returns {Object}
 */
function deleteStudent (db, studentID) {
  let p = db.collection(process.env.STUDENT_COLLECTION)
    .findAndModify(
      { isDeleted: false, _id: ObjectID(studentID) },
      null,
      { $set: { isDeleted: true } },
      { fields: { _id: 0, userID: 1, carStopID: 1 } },
    )
  p.then(({ lastErrorObject: { updatedExisting }, value }) => {
    if (updatedExisting) {
      deleteUser(db, value.userID, false)
      updateStudentListsRemoveStudentCarStop(db, studentID, value.carStopID)
      updateTripsRemoveStudent(db, studentID)
    }
  })
  return p
}

/**
 * Delete student by user.
 * @param {Object} db
 * @param {string} userID
 * @returns {Object}
 */
function deleteStudentByUser (db, userID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .findAndModify(
      { isDeleted: false, userID },
      null,
      { $set: { isDeleted: true } },
      { fields: { carStopID: 1 } },
    )
    .then(({ lastErrorObject: { updatedExisting }, value }) => {
      if (updatedExisting) {
        updateStudentListsRemoveStudentCarStop(db, String(value._id), value.carStopID)
        updateTripsRemoveStudent(db, String(value._id))
      }
    })
}

/**
 * Delete students by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function deleteStudentsBySchool (db, schoolID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteStudent(db, String(_id))
      })
    })
}

/**
 * Delete students by class.
 * @param {Object} db
 * @param {string} classID
 * @returns {Object}
 */
function deleteStudentsByClass (db, classID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, classID })
    .project({ _id: 1 })
    .toArray()
    .then((v) => {
      v.forEach(({ _id }) => {
        deleteStudent(db, String(_id))
      })
    })
}

/**
 * Get students carStopIDs.
 * @param {Object} db
 * @param {Array} studentIDs
 * @returns {Object}
 */
function getStudentsCarStopIDs (db, studentIDs) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, _id: { $in: studentIDs.map(ObjectID) }, carStopID: { $ne: null } })
    .project({ _id: 0, carStopID: 1 })
    .toArray()
    .then((v) => {
      let t = {}
      let carStopIDs = []
      v.forEach(({ carStopID }) => {
        if (!(carStopID in t)) {
          t[carStopID] = null
          carStopIDs.push(carStopID)
        }
      })
      return carStopIDs
    })
}

/**
 * Update students delete carStop.
 * @param {Object} db
 * @param {string} carStopID
 * @returns {Object}
 */
function updateStudentsDeleteCarStop (db, carStopID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .updateMany(
      { isDeleted: false, carStopID },
      { $set: { updatedTime: Date.now(), carStopID: null } },
    )
}

/**
 * Get studentIDs by school.
 * @param {Object} db
 * @param {string} schoolID
 * @returns {Object}
 */
function getStudentIDsBySchool (db, schoolID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .project({ _id: 1 })
    .toArray()
    .then(v => v.map(({ _id }) => String(_id)))
}

/**
 * Get studentIDs by class.
 * @param {Object} db
 * @param {string} classID
 * @returns {Object}
 */
function getStudentIDsByClass (db, classID) {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, classID })
    .project({ _id: 1 })
    .toArray()
    .then(v => v.map(({ _id }) => String(_id)))
}

/**
 * Get students status in date.
 * @param {Object} db
 * @param {string} classID
 * @param {number} year
 * @param {number} month
 * @param {string} [extra='user,class,carStop,school,parent']
 * @returns {Object}
 */
function getStudentsByClassStatusInDate (db, classID, year, month, extra = 'user,class,carStop,school,parent') {
  let start = new Date(year, month - 1).getTime()
  let end = new Date(year, month).getTime()
  let n = new Date(year, month, 0).getDate()
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, classID })
    .toArray()
    .then((students) => {
      let studentIDs = []
      let temp = {}
      students.forEach((c, i) => {
        c.statusInDate = new Array(n).fill(null)
        studentIDs[i] = String(c._id)
        temp[c._id] = c
      })
      return db.collection(process.env.TRIP_COLLECTION)
        .find({ isDeleted: false, startTime: { $gte: start, $lt: end }, status: { $in: [0, 1, 2] }, 'students.studentID': { $in: studentIDs } })
        .sort({ startTime: 1 })
        .project({ _id: 0, startTime: 1, 'students.studentID': 1, 'students.status': 1 })
        .toArray()
        .then((trips) => {
          trips.forEach((c) => {
            let i = new Date(c.startTime).getDate() - 1
            c.students.forEach(({ studentID, status }) => {
              if (temp[studentID] !== undefined && temp[studentID].statusInDate[i] === null) {
                temp[studentID].statusInDate[i] = status
              }
            })
          })
          return addExtra(db, students, extra)
        })
    })
}

/**
 * Get trips by student in date logs.
 * @param {Object} db
 * @param {string} studentID
 * @param {Date} date
 * @param {string} [extra='user,student']
 * @returns {Object}
 */
function getTripsByStudentInDateLogs (db, studentID, date, extra = 'user,student') {
  let start = date.getTime()
  let end = date.setHours(24)
  return db.collection(process.env.TRIP_COLLECTION)
    .find({ isDeleted: false, startTime: { $gte: start, $lt: end }, status: { $in: [0, 1, 2] }, 'students.studentID': studentID })
    .project({ _id: 1 })
    .toArray()
    .then((trips) => {
      let tripIDs = trips.map(({ _id }) => String(_id))
      return db.collection(process.env.LOG_COLLECTION)
        .find({ isDeleted: false, objectType: 'trip', objectId: { $in: tripIDs } })
        .toArray()
        .then(logs => addLogExtra(db, logs, extra))
    })
}

/**
 * Get statistic in month by school.
 * @param {Object} db
 * @param {string} schoolID
 * @param {number} year
 * @param {number} month
 * @param {string} [extra='user,class,carStop,school,parent']
 * @returns {Object}
 */
function getStatisticInMonthBySchool (db, schoolID, year, month, extra = 'user,class,carStop,school,parent') {
  return db.collection(process.env.STUDENT_COLLECTION)
    .find({ isDeleted: false, schoolID })
    .toArray()
    .then((v) => {
      if (v.length === 0) return []
      if (!extra) return v
      return addExtra(db, v, extra)
    })
    .then((students) => {
      if (students.length === 0) return []

      return getStatisticInMonth(db, students, year, month)
        .then((v) => {
          students.forEach((c) => {
            Object.assign(c, v[c._id])
          })
          return students
        })
    })
}

/**
 * Get statistic in month.
 * @param {Object} db
 * @param {Array} students
 * @param {number} year
 * @param {number} month
 * @returns {Object}
 */
function getStatisticInMonth (db, students, year, month) {
  let start = new Date(year, month).getTime()
  let finish = new Date(year, month + 1).getTime()
  return db.collection(process.env.TRIP_COLLECTION)
    .find({
      isDeleted: false,
      startTime: { $gte: start, $lt: finish },
      'students.studentID': { $in: students.map(({ _id }) => String(_id)) },
      status: TRIP_STATUS_END,
    })
    .toArray()
    .then((trips) => {
      return trips.reduce((a, c) => {
        c.students.forEach(({ studentID, status }) => {
          if (a[studentID] === undefined) {
            a[studentID] = { countTrips: 0 }
          }
          a[studentID].countTrips += 1
        })
        return a
      }, {})
    })
}

module.exports = {
  createStudent,
  countStudents,
  countStudentsBySchool,
  countStudentsByClass,
  getStudents,
  getStudentsBySchool,
  getStudentsByClass,
  getStudentByID,
  getStudentByUser,
  getStudentsByIDs,
  updateStudent,
  deleteStudent,
  deleteStudentByUser,
  deleteStudentsBySchool,
  deleteStudentsByClass,
  getStudentsCarStopIDs,
  updateStudentsDeleteCarStop,
  getStudentIDsBySchool,
  getStudentIDsByClass,
  getStudentsByClassStatusInDate,
  getTripsByStudentInDateLogs,
  getStatisticInMonthBySchool,
}

const parseQuery = require('./parseQuery')
const { createUser, getUsersByIDs, getUserByID, updateUser, deleteUser } = require('./User')
const { getClassesByIDs, getClassByID } = require('./Class')
const { getCarStopsByIDs, getCarStopByID } = require('./CarStop')
const { getSchoolsByIDs, getSchoolByID } = require('./School')
const { getParentsByStudent, getParentsByStudents } = require('./Parent')
const { updateStudentListsRemoveStudentCarStop, updateStudentListsReplaceCarStop } = require('./StudentList')
const { updateTripsRemoveStudent } = require('./Trip')
const { addExtra: addLogExtra } = require('./Log')

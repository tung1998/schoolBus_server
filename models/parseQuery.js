const NUMBER_FIELDS = ['adminType', 'status', 'volume', 'price', 'type', 'seatNumber', 'fuelType', 'fuelCapacity', 'maintenanceDay', 'maintenanceDistance', 'stopType', 'reachTime', 'IDIssueDate', 'DLIssueDate', 'time', 'toll', 'startTime', 'endTime', 'userType', 'liftTime']

/**
 * Parse query.
 * @param {Object} db
 * @param {Object} query
 * @returns {Object}
 */
function parseQuery (db, query) {
  if (query === undefined) return Promise.resolve()
  let temp = {}
  Object.entries(query).forEach(([k, v]) => {
    k = decodeURIComponent(k)
    let i = k.indexOf('/')
    if (i > 0) {
      let s1 = k.slice(0, i)
      let s2 = k.slice(i + 1)
      if (temp[s1] === undefined) temp[s1] = {}
      temp[s1][s2] = query[k]
      delete query[k]
    }
  })
  let arr = Object.entries(temp).map(([key, value]) => {
    let collectionName = process.env[`${key.replace(/(?<=[a-z])([A-Z])/g, '_$1').toUpperCase()}_COLLECTION`]
    return parseQuery(db, value)
      .then(v => (
        db.collection(collectionName)
          .find({ isDeleted: false, ...v })
          .project({ _id: 1 })
          .toArray()
          .then((docs) => {
            query[`${key}ID`] = { $in: docs.map(({ _id }) => String(_id)) }
          })
      ))
  })
  return Promise.all(arr)
    .then(() => {
      Object.entries(query).forEach(([k, v]) => {
        if (typeof v === 'string') {
          if (NUMBER_FIELDS.includes(k)) query[k] = { $eq: Number(v) }
          else query[k] = { $regex: v, $options: 'i' }
        }
      })
      return query
    })
}

module.exports = parseQuery

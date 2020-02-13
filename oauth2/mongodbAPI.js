class mongodbAPI {
  constructor (db) {
    this.db = db
  }

  async connect () {

  }

  write (dataObj) {
    this.db.collection(process.env.OAUTH2_TOKEN_COLLECTION).insertOne(dataObj)
  }

  remove (key, value) {
    this.db.collection(process.env.OAUTH2_TOKEN_COLLECTION).remove({ [key]: value })
  }

  find (key, value) {
    return new Promise((resolve, reject) => {
      this.db.collection(process.env.OAUTH2_TOKEN_COLLECTION)
        .findOne(
          { [key]: value },
          { fields: { _id: 0 } },
        )
        .then((doc) => {
          if (doc) {
            resolve(doc)
          } else {
            reject()
          }
        })
    }).catch(() => false)
  }
}

module.exports = mongodbAPI

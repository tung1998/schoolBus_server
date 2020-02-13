require('localenv')
const express = require('express')

const connection = require('./db/connection')
const initOAuth2 = require('./oauth2/init')
const routes = require('./routes')

connection(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USERNAME, process.env.DB_PASSWORD, process.env.DB_NAME)
  .then((db) => {
    const app = express()
    app.locals.db = db
    initOAuth2(db, app)
    app.use('/', routes)

    app.listen(process.env.PORT - 1, () => {
      console.log(`Listening on port ${process.env.PORT - 1}!`)
    })
  })
  .catch(console.log)

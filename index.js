require('localenv')
const express = require('express')

const connection = require('./db/connection')
const routes = require('./routes')

connection(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USERNAME, process.env.DB_PASSWORD, process.env.DB_NAME)
  .then((db) => {
    const app = express()
    app.locals.db = db
    app.use('/', routes)

    app.listen(process.env.PORT, () => {
      console.log(`Listening on port ${process.env.PORT}!`)
    })
  })
  .catch(console.log)

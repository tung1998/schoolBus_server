require('localenv')
const express = require('express')

const connection = require('./db/connection')
const routes = require('./routes')
const { refreshToken } = require(`./images/refreshToken`)

connection(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USERNAME, process.env.DB_PASSWORD, process.env.DB_NAME)
  .then((db) => {
    setInterval(refreshToken, 30 * 60 * 1000)
    const app = express()
    app.locals.db = db
    app.use('/', routes)

    app.listen(process.env.PORT, () => {
      console.log(`Listening on port ${process.env.PORT}!`)
    })
  })
  .catch(console.log)

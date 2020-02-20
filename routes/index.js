const express = require('express')
const bodyParser = require('body-parser')

const router = express.Router()

router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())
router.use((req, res, next) => {
  req.ip = (req.headers['x-forwarded-for']
    || req.connection.remoteAddress
    || req.socket.remoteAddress
    || (req.connection.socket ? req.connection.socket.remoteAddress : '')).split(',')[0]
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  next()
})

router.use('/Info', require('./Info'))
router.use('/Token', require('./Token'))
router.use('/Log', require('./Log'))
router.use('/User', require('./User'))
router.use('/Administrator', require('./Administrator'))
router.use('/Parent', require('./Parent'))
router.use('/Driver', require('./Driver'))
router.use('/Nanny', require('./Nanny'))
router.use('/Student', require('./Student'))
router.use('/Teacher', require('./Teacher'))
router.use('/School', require('./School'))
router.use('/Class', require('./Class'))
router.use('/Route', require('./Route'))
router.use('/CarModel', require('./CarModel'))
router.use('/StudentTrip', require('./StudentTrip'))
router.use('/CarStopTrip', require('./CarStopTrip'))
router.use('/TripLocation', require('./TripLocation'))
router.use('/CarFuel', require('./CarFuel'))
router.use('/Trip', require('./Trip'))
router.use('/StudentList', require('./StudentList'))
router.use('/Config', require('./Config'))
router.use('/Feedback', require('./Feedback'))
router.use('/Notification', require('./Notification'))
router.use('/CarMaintenance', require('./CarMaintenance'))
router.use('/SMS', require('./SMS'))
router.use('/Module', require('./Module'))
router.use('/ParentRequest', require('./ParentRequest'))
router.use('/Car', require('./Car'))
router.use('/CarStop', require('./CarStop'))

router.use((req, res) => {
  res.status(404).send({ message: 'Not Found' })
})
router.use((err, req, res, next) => {
  if (!res.headersSent) res.status(500).send({ message: err.toString() })
  console.log(err)
})

module.exports = router

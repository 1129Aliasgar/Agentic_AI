const express = require('express')
const router = express.Router()
const mapController = require('../controllers/mapController')

router.get('/destinations', mapController.getDestinations)
router.post('/route', mapController.calculateRoute)

module.exports = router


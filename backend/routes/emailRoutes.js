const express = require('express')
const router = express.Router()
const emailController = require('../controllers/emailController')

router.post('/sort', emailController.sortEmails)

module.exports = router


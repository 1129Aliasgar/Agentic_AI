const express = require('express')
const router = express.Router()
const multer = require('multer')
const docController = require('../controllers/docController')

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt/
    const extname = allowedTypes.test(
      file.originalname.toLowerCase().split('.').pop()
    )
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'))
    }
  },
})

router.post('/summary', upload.single('document'), docController.summarizeDocument)

module.exports = router


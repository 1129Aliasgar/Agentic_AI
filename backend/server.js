const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const emailRoutes = require('./routes/emailRoutes')
const docRoutes = require('./routes/docRoutes')
const mapRoutes = require('./routes/mapRoutes')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware - Allow all origins
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/email', emailRoutes)
app.use('/api/doc', docRoutes)
app.use('/api/map', mapRoutes)

// OAuth2 routes for Gmail/Calendar
app.get('/auth/google', async (req, res) => {
  try {
    const gmailService = require('./utils/gmailService')
    // Add state parameter for CSRF protection and tracking
    const state = Buffer.from(Date.now().toString()).toString('base64')
    const authUrl = await gmailService.getAuthUrl(state)
    res.redirect(authUrl)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate authorization URL',
    })
  }
})

app.get('/auth/google/callback', async (req, res) => {
  try {
    // Capture ALL query parameters from Google
    const queryParams = req.query
    const { code, error, error_description, error_uri, state } = queryParams
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    
    // Handle OAuth error from Google (check all possible error fields)
    // Google sends: error, error_description, error_uri (optional), state
    if (error) {
      let errorMsg = error
      if (error_description) {
        errorMsg = `${error}: ${error_description}`
      }
      // Common Google OAuth errors
      const errorMessages = {
        'access_denied': 'You denied access to Gmail. Please authorize to use Gmail features.',
        'invalid_request': 'Invalid authorization request. Please try again.',
        'unauthorized_client': 'Client not authorized. Please check your Google Cloud Console settings.',
        'unsupported_response_type': 'Unsupported response type. Please contact support.',
        'invalid_scope': 'Invalid scope requested. Please check your Google Cloud Console settings.',
        'server_error': 'Google authorization server error. Please try again later.',
        'temporarily_unavailable': 'Google authorization service temporarily unavailable. Please try again later.',
      }
      
      if (errorMessages[error]) {
        errorMsg = errorMessages[error]
      }
      
      const redirectUrl = `${frontendUrl}/email?auth_error=${encodeURIComponent(errorMsg)}`
      return res.redirect(redirectUrl)
    }
    
    // Check if authorization code is present
    // Google sends: code, state (optional) on success
    if (!code) {
      const errorMsg = 'Authorization code not provided. Please try authorizing again.'
      const redirectUrl = `${frontendUrl}/email?auth_error=${encodeURIComponent(errorMsg)}`
      return res.redirect(redirectUrl)
    }

    // Exchange authorization code for tokens
    const gmailService = require('./utils/gmailService')
    
    try {
      // Save tokens securely on backend
      await gmailService.saveTokens(code)
      
      // Force re-initialization to load new tokens
      await gmailService.initialize()
      
      // Verify tokens were saved successfully
      const fs = require('fs')
      const tokenPath = './config/google-tokens.json'
      if (!fs.existsSync(tokenPath)) {
        throw new Error('Tokens were not saved successfully')
      }
      
      // Redirect to frontend with success message
      // URL will be: http://localhost:3000/email?auth_success=true&message=...
      const redirectUrl = `${frontendUrl}/email?auth_success=true&message=${encodeURIComponent('Gmail API authorized successfully')}`
      return res.redirect(redirectUrl)
    } catch (tokenError) {
      // Token save/initialization failed
      const errorMsg = tokenError.message || 'Failed to save authorization tokens'
      const redirectUrl = `${frontendUrl}/email?auth_error=${encodeURIComponent(errorMsg)}`
      return res.redirect(redirectUrl)
    }
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const errorMsg = error.message || 'Failed to authorize Gmail API'
    const redirectUrl = `${frontendUrl}/email?auth_error=${encodeURIComponent(errorMsg)}`
    return res.redirect(redirectUrl)
  }
})

// Debug endpoint to check OAuth callback (remove in production)
app.get('/auth/google/debug', (req, res) => {
  res.json({
    query: req.query,
    params: req.params,
    headers: req.headers,
    message: 'This endpoint shows what Google sends in the callback',
  })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Agentic Platform API is running' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  })
})

app.listen(PORT, () => {
  // Server started
})


const { google } = require('googleapis')

/**
 * Gmail API Service
 * Handles email retrieval and sorting
 */
class GmailService {
  constructor() {
    this.auth = null
    this.gmail = null
    this.requiresOAuth = false
    this.tokenPath = './config/google-tokens.json'
  }

  /**
   * Initialize Gmail API client
   */
  async initialize() {
    try {
      const fs = require('fs')
      const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH
      let clientId, clientSecret, redirectUri

      // Try to get credentials from JSON file first
      if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
        const credentialsData = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
        
        if (credentialsData.client_email) {
          // Service account format - works directly
          this.auth = new google.auth.GoogleAuth({
            credentials: credentialsData,
            scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/calendar'],
          })
          this.gmail = google.gmail({ version: 'v1', auth: this.auth })
          return true
        } else if (credentialsData.web && credentialsData.web.client_id) {
          // OAuth2 client credentials from JSON file
          clientId = credentialsData.web.client_id
          clientSecret = credentialsData.web.client_secret
          redirectUri = credentialsData.web.redirect_uris?.[0] || process.env.GMAIL_REDIRECT_URI
        }
      }

      // Use env variables if not found in JSON file
      if (!clientId) {
        clientId = process.env.GMAIL_CLIENT_ID
        clientSecret = process.env.GMAIL_CLIENT_SECRET
        redirectUri = process.env.GMAIL_REDIRECT_URI
      }

      // If we have OAuth2 credentials, set them up
      if (clientId && clientSecret) {
        this.auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
        this.gmail = google.gmail({ version: 'v1', auth: this.auth })
        
        // Try to load stored tokens (backend only, never exposed)
        if (fs.existsSync(this.tokenPath)) {
          try {
            const tokens = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'))
            
            // Validate token structure
            if (!tokens.access_token && !tokens.refresh_token) {
              throw new Error('Invalid token format')
            }
            
            this.auth.setCredentials(tokens)
            
            // Verify token is still valid
            try {
              const tokenInfo = await this.auth.getAccessToken()
              if (tokenInfo.token) {
                this.requiresOAuth = false
                return true
              }
            } catch (verifyError) {
              // Token might be expired, try refresh
              if (tokens.refresh_token) {
                try {
                  const { credentials } = await this.auth.refreshAccessToken()
                  this.auth.setCredentials(credentials)
                  // Save refreshed tokens
                  const tokenData = {
                    access_token: credentials.access_token,
                    refresh_token: credentials.refresh_token || tokens.refresh_token,
                    scope: credentials.scope,
                    token_type: credentials.token_type,
                    expiry_date: credentials.expiry_date,
                  }
                  fs.writeFileSync(this.tokenPath, JSON.stringify(tokenData, null, 2), { mode: 0o600 })
                  this.requiresOAuth = false
                  return true
                } catch (refreshError) {
                  // Refresh failed, need re-authorization
                  this.requiresOAuth = true
                }
              } else {
                this.requiresOAuth = true
              }
            }
          } catch (tokenError) {
            // Tokens invalid, need to re-authorize
            this.requiresOAuth = true
          }
        } else {
          this.requiresOAuth = true
        }
        return true
      }

      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Get emails from Gmail
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of emails
   */
  async getEmails(options = {}) {
    if (!this.gmail) {
      const initialized = await this.initialize()
      if (!initialized) {
        throw new Error('Gmail API credentials not configured. Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env file, or provide GOOGLE_SERVICE_ACCOUNT_PATH with a valid service account JSON file.')
      }
    }

    // Check if OAuth2 flow is required
    if (this.requiresOAuth) {
      const authUrl = await this.getAuthUrl()
      throw new Error(`OAuth2 authentication required. Please visit http://localhost:5000/auth/google to authorize Gmail access. After authorization, you can use Gmail features.`)
    }

    try {
      // Get auth client
      let authClient
      try {
        authClient = await this.auth.getClient()
      } catch (authError) {
        if (authError.message.includes('client_email')) {
          throw new Error('Invalid service account JSON. Missing client_email field. Please download a valid service account JSON key from Google Cloud Console.')
        }
        throw new Error(`Gmail API authentication failed: ${authError.message}`)
      }
      
      // Check if token needs refresh
      try {
        if (this.auth.credentials && this.auth.credentials.expiry_date && Date.now() >= this.auth.credentials.expiry_date - 60000) {
          const { credentials } = await this.auth.refreshAccessToken()
          this.auth.setCredentials(credentials)
          // Save refreshed tokens
          const fs = require('fs')
          fs.writeFileSync(this.tokenPath, JSON.stringify(credentials, null, 2))
        }
      } catch (refreshError) {
        // If refresh fails, need to re-authorize
        this.requiresOAuth = true
        throw new Error('Token expired. Please re-authorize at http://localhost:5000/auth/google')
      }
      
      const auth = await authClient.getAccessToken()

      if (!auth.token) {
        throw new Error('Gmail API authentication failed. Please re-authorize at http://localhost:5000/auth/google')
      }

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: options.maxResults || 50,
        q: options.query || '',
      })

      const messages = response.data.messages || []
      const emails = []

      // Limit to avoid timeout
      const maxEmails = Math.min(messages.length, options.maxResults || 50)
      for (let i = 0; i < maxEmails; i++) {
        const message = messages[i]
        try {
          const email = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full',
          })

          emails.push(this.parseEmail(email.data))
        } catch (err) {
          // Skip failed emails silently
        }
      }

      return emails
    } catch (error) {
      if (error.code === 401 || error.message.includes('auth')) {
        throw new Error('Gmail API authentication failed. Please check your service account credentials.')
      }
      throw error
    }
  }

  /**
   * Parse Gmail message to readable format
   */
  parseEmail(message) {
    const headers = message.payload.headers
    const getHeader = (name) => headers.find(h => h.name === name)?.value || ''

    return {
      id: message.id,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      snippet: message.snippet,
      body: this.extractBody(message.payload),
    }
  }

  /**
   * Extract email body from payload
   */
  extractBody(payload) {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8')
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
      }
    }

    return ''
  }

  /**
   * Get OAuth2 authorization URL
   * @param {string} state - Optional state parameter for CSRF protection
   */
  async getAuthUrl(state = null) {
    if (!this.auth) {
      await this.initialize()
    }
    if (!this.auth) {
      throw new Error('Gmail API not initialized')
    }
    const authOptions = {
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/calendar'],
      prompt: 'consent',
    }
    
    // Add state parameter if provided
    if (state) {
      authOptions.state = state
    }
    
    return this.auth.generateAuthUrl(authOptions)
  }

  /**
   * Save OAuth2 tokens after authorization
   * SECURITY: Tokens are stored on backend only, never exposed to frontend
   */
  async saveTokens(code) {
    try {
      const fs = require('fs')
      const path = require('path')
      
      if (!this.auth) {
        await this.initialize()
      }
      
      if (!this.auth) {
        throw new Error('Gmail API not initialized. Please check your credentials.')
      }
      
      // Exchange code for tokens
      const { tokens } = await this.auth.getToken(code)
      this.auth.setCredentials(tokens)
      
      // Ensure config directory exists
      const configDir = path.dirname(this.tokenPath)
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }
      
      // Save tokens to file (backend only, never exposed)
      // SECURITY: Store only essential token data, not full credentials
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
      }
      
      fs.writeFileSync(this.tokenPath, JSON.stringify(tokenData, null, 2), { mode: 0o600 })
      
      // Mark as authorized
      this.requiresOAuth = false
      
      // Return success (tokens not exposed)
      return { success: true }
    } catch (error) {
      throw new Error(`Failed to save tokens: ${error.message}`)
    }
  }
}

module.exports = new GmailService()


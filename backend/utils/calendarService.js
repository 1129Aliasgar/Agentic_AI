const { google } = require('googleapis')

/**
 * Google Calendar API Service
 * Handles event creation and scheduling
 */
class CalendarService {
  constructor() {
    this.auth = null
    this.calendar = null
    this.tokenPath = './config/google-tokens.json'
  }

  /**
   * Initialize Calendar API client
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
            scopes: ['https://www.googleapis.com/auth/calendar'],
          })
          this.calendar = google.calendar({ version: 'v3', auth: this.auth })
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

      if (clientId && clientSecret) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
        
        // Try to load stored tokens (shared with Gmail service)
        if (fs.existsSync(this.tokenPath)) {
          try {
            const tokens = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'))
            oauth2Client.setCredentials(tokens)
          } catch (tokenError) {
            // Tokens invalid, will need to authorize
          }
        }

        this.auth = oauth2Client
        this.calendar = google.calendar({ version: 'v3', auth: oauth2Client })
        return true
      }

      return false
    } catch (error) {
      return false
    }
  }

  /**
   * Create a calendar event
   * @param {Object} eventData - Event details
   * @returns {Promise<Object>} - Created event
   */
  async createEvent(eventData) {
    if (!this.calendar) {
      await this.initialize()
    }

    if (!this.calendar) {
      // Return mock event if API not configured
      return {
        id: `mock-${Date.now()}`,
        summary: eventData.summary,
        start: eventData.start,
        end: eventData.end,
        created: new Date().toISOString(),
        mock: true,
      }
    }

    try {
      const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary'

      const event = {
        summary: eventData.summary || eventData.title,
        description: eventData.description || '',
        start: {
          dateTime: eventData.start?.dateTime || eventData.start,
          timeZone: eventData.timeZone || 'UTC',
        },
        end: {
          dateTime: eventData.end?.dateTime || eventData.end,
          timeZone: eventData.timeZone || 'UTC',
        },
      }

      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
      })

      return response.data
    } catch (error) {
      // Return mock event on error
      return {
        id: `mock-${Date.now()}`,
        summary: eventData.summary || eventData.title,
        start: eventData.start,
        end: eventData.end,
        created: new Date().toISOString(),
        mock: true,
        error: error.message,
      }
    }
  }

  /**
   * Create multiple events from an array
   * @param {Array} events - Array of event data
   * @returns {Promise<Array>} - Array of created events
   */
  async createEvents(events) {
    const results = []
    for (const eventData of events) {
      try {
        const event = await this.createEvent(eventData)
        results.push(event)
      } catch (error) {
        results.push({
          error: error.message,
          data: eventData,
        })
      }
    }
    return results
  }
}

module.exports = new CalendarService()


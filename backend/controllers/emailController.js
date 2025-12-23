const llmAgent = require('../agents/llmAgent')
const gmailService = require('../utils/gmailService')
const calendarService = require('../utils/calendarService')

const sortEmails = async (req, res) => {
  try {
    const { emails, useGmail } = req.body

    let emailData = emails

    // If useGmail is true, fetch emails from Gmail API
    if (useGmail) {
      try {
        const gmailEmails = await gmailService.getEmails({ maxResults: 10 })
        if (!gmailEmails || gmailEmails.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'No emails found in your Gmail account. Please try using manual email input.',
          })
        }
        emailData = gmailEmails.map(email => 
          `From: ${email.from}\nSubject: ${email.subject}\nDate: ${email.date}\n${email.snippet || email.body}`
        ).join('\n\n')
      } catch (gmailError) {
        return res.status(400).json({
          success: false,
          error: gmailError.message || 'Gmail API error. Please use manual email input instead.',
        })
      }
    }

    // Validate email data (only if not using Gmail or if Gmail fetch succeeded)
    if (!emailData || (typeof emailData === 'string' && emailData.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Emails data is required. Please provide emails manually or check your Gmail API configuration.',
      })
    }

    // Allow more context for richer analysis (cap ~8000 chars)
    const limitedEmailData = emailData.length > 8000 
      ? emailData.substring(0, 8000) + '\n\n... (truncated for processing)'
      : emailData

    // Consider up to first 10 emails/blocks
    const emailLines = limitedEmailData.split('\n\n').slice(0, 10).join('\n\n')

    // Use LLM agent to extract detailed, structured information per email
    const prompt = `You are an executive assistant that analyzes emails and returns structured JSON.
For EACH email, extract:
{"from":"","subject":"","date":"","summary":"2-3 sentences","priority":"High|Medium|Low","category":"Work|Personal|Finance|Sales|Support|Other","entities":["names, orgs, products"],"action_items":["explicit tasks with owner if known"],"schedule_suggestion":{"title":"","date":"YYYY-MM-DD","time":"HH:mm","duration_minutes":60}}
Also return a top-level sorted list of {content, priority} and a scheduled list built from the schedule_suggestion entries that are confident.
Emails:
${emailLines}

Return JSON ONLY with this shape:
{"details":[{... per-email ...}],"sorted":[{"content":"text","priority":"High|Medium|Low"}],"scheduled":[{"title":"","date":"YYYY-MM-DD","time":"HH:mm","duration_minutes":60}]}`
    
    // Store emailLines for fallback
    const emailLinesArray = emailLines.split('\n\n').filter(e => e.trim())

    const startTime = Date.now()
    
    // Use Promise.race to add a timeout fallback
    let response
    try {
      const llmPromise = llmAgent.generateResponse(prompt)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('LLM_TIMEOUT')), 45000)
      )
      
      response = await Promise.race([llmPromise, timeoutPromise])
    } catch (timeoutError) {
      if (timeoutError.message === 'LLM_TIMEOUT') {
        // Quick fallback: simple priority sorting without LLM
        const quickSorted = emailLinesArray.map((email) => {
          const emailLower = email.toLowerCase()
          const priority = emailLower.includes('urgent') || emailLower.includes('important') || emailLower.includes('asap')
            ? 'High' 
            : emailLower.includes('meeting') || emailLower.includes('deadline') || emailLower.includes('schedule')
            ? 'Medium'
            : 'Low'
          return { content: email.substring(0, 200), priority }
        })
        response = JSON.stringify({ sorted: quickSorted, scheduled: [] })
      } else {
        throw timeoutError
      }
    }

    // Parse LLM response
    let parsedResponse
    try {
      // Try to extract JSON from response (robust)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? jsonMatch[0] : response
      parsedResponse = JSON.parse(jsonText)
    } catch (parseError) {
      // Fallback: create a simple structure
      const emailLines = emailData.split('\n').filter(line => line.trim())
      parsedResponse = {
        details: emailLines.map(email => ({
          from: '',
          subject: '',
          date: '',
          summary: email.substring(0, 200),
          priority: 'Normal',
          category: 'Other',
          entities: [],
          action_items: [],
          schedule_suggestion: null,
        })),
        sorted: emailLines.map(email => ({
          content: email,
          priority: 'Normal',
        })),
        scheduled: [],
      }
    }

    // Create calendar events for scheduled items
    const scheduledEvents = []
    if (parsedResponse.scheduled && parsedResponse.scheduled.length > 0) {
      for (const eventData of parsedResponse.scheduled) {
        try {
          // Parse date and time
          const eventDateTime = new Date(eventData.date || eventData.time || Date.now())
          const endDateTime = new Date(eventDateTime.getTime() + 60 * 60 * 1000) // Default 1 hour duration

          const calendarEvent = await calendarService.createEvent({
            summary: eventData.title || eventData.subject || 'Scheduled Event',
            description: eventData.description || '',
            start: {
              dateTime: eventDateTime.toISOString(),
            },
            end: {
              dateTime: endDateTime.toISOString(),
            },
            timeZone: 'UTC',
          })

          scheduledEvents.push({
            ...eventData,
            calendarId: calendarEvent.id,
            created: calendarEvent.created || new Date().toISOString(),
            mock: calendarEvent.mock || false,
          })
        } catch (eventError) {
          scheduledEvents.push({
            ...eventData,
            error: eventError.message,
          })
        }
      }
    }

    res.json({
      success: true,
      details: parsedResponse.details || [],
      sorted: parsedResponse.sorted || [],
      scheduled: scheduledEvents,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sort emails',
    })
  }
}

module.exports = {
  sortEmails,
}


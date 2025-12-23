import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNotification } from '../contexts/NotificationContext'
import { Email, ScheduledEvent } from '../types/types'
import { emailApi } from '../api/emailApi'

export default function EmailPage() {
  const { addNotification } = useNotification()
  const [searchParams, setSearchParams] = useSearchParams()
  const [emails, setEmails] = useState<string>('')
  const [useGmail, setUseGmail] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [sortedEmails, setSortedEmails] = useState<Email[] | null>(null)
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[] | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  // Handle OAuth callback redirects
  useEffect(() => {
    // Debug: Log all query parameters
    const allParams = Object.fromEntries(searchParams.entries())
    if (Object.keys(allParams).length > 0) {
      console.log('OAuth Callback - Query Parameters:', allParams)
      console.log('OAuth Callback - Current URL:', window.location.href)
    }
    
    const authSuccess = searchParams.get('auth_success')
    const authErrorParam = searchParams.get('auth_error')
    const message = searchParams.get('message')
    
    // Check for success
    if (authSuccess === 'true') {
      const successMsg = message 
        ? decodeURIComponent(message) 
        : 'Gmail API authorized successfully! You can now use Gmail features.'
      
      console.log('OAuth Success:', successMsg)
      addNotification(successMsg, 'success')
      setAuthError(null) // Clear any previous errors
      setUseGmail(true) // Auto-enable Gmail checkbox
      
      // Clear query params after a delay to allow user to see the URL
      // Keep them visible longer for debugging
      setTimeout(() => {
        setSearchParams({})
        console.log('OAuth: Query parameters cleared')
      }, 5000) // Increased to 5 seconds for visibility
    }
    
    // Check for error
    if (authErrorParam) {
      const errorMsg = decodeURIComponent(authErrorParam)
      console.log('OAuth Error:', errorMsg)
      setAuthError(errorMsg)
      addNotification(`Gmail authorization failed: ${errorMsg}`, 'error')
      
      // Clear query params after a delay
      setTimeout(() => {
        setSearchParams({})
        console.log('OAuth: Query parameters cleared')
      }, 5000) // Increased to 5 seconds for visibility
    }
  }, [searchParams, addNotification, setSearchParams])

  // Handle OAuth authorization button
  const handleAuthorizeGmail = () => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    window.location.href = `${backendUrl}/auth/google`
  }

  const handleSortAndSchedule = async () => {
    if (!useGmail && !emails.trim()) {
      addNotification('Please enter some emails or enable Gmail integration', 'warning')
      return
    }

    setLoading(true)
    setAuthError(null) // Clear any previous auth errors
    try {
      const response = await emailApi.sortAndSchedule({
        emails: emails,
        useGmail: useGmail,
      })
      
      if (response.success) {
        setSortedEmails(response.sorted || [])
        setScheduledEvents(response.scheduled || [])
        setAuthError(null) // Clear auth error on success
        addNotification('Emails sorted and scheduled successfully!', 'success')
      } else {
        const errorMsg = response.error || 'Failed to sort emails'
        // Check if error mentions OAuth requirement
        if (errorMsg.includes('OAuth2') || errorMsg.includes('authorize') || errorMsg.includes('/auth/google')) {
          setAuthError(errorMsg)
        }
        addNotification(errorMsg, 'error')
      }
    } catch (error: any) {
      const errorMessage = error.error || error.message || 'Failed to sort emails. Please try again.'
      // Check if error mentions OAuth requirement
      if (errorMessage.includes('OAuth2') || errorMessage.includes('authorize') || errorMessage.includes('/auth/google')) {
        setAuthError(errorMessage)
      }
      addNotification(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-500 mb-6">Email Management</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useGmail}
                onChange={(e) => setUseGmail(e.target.checked)}
                className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium">
                Use Gmail API to fetch emails (requires Google API credentials)
              </span>
            </label>
          </div>
          
          {!useGmail && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Paste your emails (one per line or in any format):
              </label>
              <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="Enter emails here... (See test-data/email-examples.txt for test examples)"
                className="w-full h-64 bg-gray-800 text-white border border-purple-500/30 rounded-lg p-4 focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Check test-data/email-examples.txt for sample emails to test
              </p>
            </div>
          )}

          {useGmail && (
            <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-400 mb-2">
                📧 Will fetch emails from your Gmail account using Google API
              </p>
              {authError && (
                <div className="mt-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-400 mb-2">
                    ⚠️ {authError}
                  </p>
                  <button
                    onClick={handleAuthorizeGmail}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    🔐 Authorize Gmail Access
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSortAndSchedule}
            disabled={loading}
            className="w-full px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing emails...
              </>
            ) : (
              useGmail ? 'Fetch & Sort Emails from Gmail' : 'Sort & Schedule Emails'
            )}
          </button>
        </div>

        {sortedEmails && (
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-purple-500 mb-4">Sorted Emails</h2>
            <div className="space-y-2">
              {sortedEmails.map((email: Email, index: number) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-400">Priority: {email.priority || 'Normal'}</p>
                  <p className="text-white">{email.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {scheduledEvents && scheduledEvents.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-purple-500 mb-4">Scheduled Events</h2>
            <div className="space-y-2">
              {scheduledEvents.map((event: ScheduledEvent, index: number) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg">
                  <p className="font-semibold text-purple-400">{event.title}</p>
                  <p className="text-sm text-gray-400">
                    {event.date} at {event.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


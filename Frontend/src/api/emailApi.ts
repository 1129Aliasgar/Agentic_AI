import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface EmailSortRequest {
  emails?: string
  useGmail?: boolean
}

export interface EmailSortResponse {
  success: boolean
  sorted?: Array<{
    content: string
    priority: string
  }>
  scheduled?: Array<{
    title: string
    date: string
    time: string
  }>
  error?: string
}

export const emailApi = {
  sortAndSchedule: async (data: EmailSortRequest): Promise<EmailSortResponse> => {
    try {
      console.log('Frontend API: Sending email sort request to backend...')
      const response = await axios.post(`${API_URL}/api/email/sort`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Frontend API: Received response from backend:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Email API error:', error)
      throw {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to process emails',
      }
    }
  },
}


import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface DocSummaryResponse {
  success: boolean
  summary?: string
  error?: string
}

export const docApi = {
  summarize: async (file: File): Promise<DocSummaryResponse> => {
    try {
      console.log('Frontend API: Sending document summary request to backend...', file.name)
      
      const formData = new FormData()
      formData.append('document', file)

      const response = await axios.post(`${API_URL}/api/doc/summary`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      console.log('Frontend API: Received response from backend:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Document API error:', error)
      throw {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to summarize document',
      }
    }
  },
}


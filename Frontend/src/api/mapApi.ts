import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export interface Destination {
  name: string
  lat: number
  lng: number
}

export interface UserLocation {
  lat: number
  lng: number
}

export interface Route {
  distance?: string | number
  duration?: number
  path?: number[][]
  instructions?: string[]
}

export interface DestinationsResponse {
  success: boolean
  destinations?: Destination[]
  defaultLocation?: UserLocation
  error?: string
}

export interface RouteRequest {
  start: UserLocation
  destination: string
}

export interface RouteResponse {
  success: boolean
  route?: Route
  error?: string
}

export const mapApi = {
  getDestinations: async (): Promise<DestinationsResponse> => {
    try {
      console.log('Frontend API: Fetching destinations from backend...')
      const response = await axios.get(`${API_URL}/api/map/destinations`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Frontend API: Received destinations from backend:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Destinations API error:', error)
      throw {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch destinations',
      }
    }
  },

  calculateRoute: async (data: RouteRequest): Promise<RouteResponse> => {
    try {
      console.log('Frontend API: Sending route calculation request to backend...', data)
      const response = await axios.post(`${API_URL}/api/map/route`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Frontend API: Received route response from backend:', response.data)
      return response.data
    } catch (error: any) {
      console.error('Route API error:', error)
      throw {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to calculate route',
      }
    }
  },
}


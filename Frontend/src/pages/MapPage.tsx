import { useState, useEffect } from 'react'
import { useNotification } from '../contexts/NotificationContext'
import { UserLocation, Destination, Route } from '../types/types'
import MapComponent from '../components/MapComponent'
import { mapApi } from '../api/mapApi'

export default function MapPage() {
  const { addNotification } = useNotification()
  // Default to Manmad, Nashik, Maharashtra, India
  const [userLocation, setUserLocation] = useState<UserLocation>({ lat: 20.2486, lng: 74.4356 })
  const [destination, setDestination] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [route, setRoute] = useState<Route | null>(null)
  const [destinations, setDestinations] = useState<Destination[]>([])

  useEffect(() => {
    // Fetch available destinations and set default location
    fetchDestinations()
    
    // Try to get user's current location, but keep default if fails
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          // Keep default Manmad location
          addNotification('Using default location: Manmad, Nashik', 'info')
        }
      )
    }
  }, [addNotification])

  const fetchDestinations = async () => {
    try {
      const response = await mapApi.getDestinations()
      if (response.success) {
        setDestinations(response.destinations || [])
        // Set default location if provided
        if (response.defaultLocation) {
          setUserLocation({
            lat: response.defaultLocation.lat,
            lng: response.defaultLocation.lng,
          })
        }
      }
    } catch (error: any) {
      console.error('Error fetching destinations:', error)
      addNotification(error.error || 'Failed to load destinations. Using default list.', 'warning')
    }
  }

  const handleFindRoute = async () => {
    if (!userLocation || !destination) {
      addNotification('Please select a destination', 'warning')
      return
    }

    setLoading(true)
    try {
      const response = await mapApi.calculateRoute({
        start: userLocation,
        destination: destination,
      })
      
      if (response.success) {
        setRoute(response.route || null)
        addNotification('Route calculated successfully!', 'success')
      } else {
        addNotification(response.error || 'Failed to calculate route', 'error')
      }
    } catch (error: any) {
      console.error('Error finding route:', error)
      const errorMessage = error.error || error.message || 'Failed to find route. Please try again.'
      addNotification(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleManualLocation = () => {
    const latInput = prompt('Enter latitude (e.g., 20.2486 for Manmad):', userLocation.lat.toString())
    const lngInput = prompt('Enter longitude (e.g., 74.4356 for Manmad):', userLocation.lng.toString())
    if (latInput && lngInput) {
      const lat = parseFloat(latInput)
      const lng = parseFloat(lngInput)
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setUserLocation({ lat, lng })
        addNotification('Location updated successfully!', 'success')
      } else {
        addNotification('Invalid coordinates. Please enter valid latitude (-90 to 90) and longitude (-180 to 180)', 'error')
      }
    }
  }

  const handleUseDefaultLocation = () => {
    setUserLocation({ lat: 20.2486, lng: 74.4356 })
    addNotification('Location set to Manmad, Nashik', 'success')
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-500 mb-6">Find Location</h1>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Location</label>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-sm mb-2">
                  Lat: {userLocation.lat.toFixed(6)}, Lng: {userLocation.lng.toFixed(6)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleManualLocation}
                    className="text-sm px-3 py-1 bg-purple-500/20 text-purple-400 hover:text-purple-300 rounded transition-colors"
                  >
                    Change Location
                  </button>
                  <button
                    onClick={handleUseDefaultLocation}
                    className="text-sm px-3 py-1 bg-purple-500/20 text-purple-400 hover:text-purple-300 rounded transition-colors"
                  >
                    Use Manmad (Default)
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Destination</label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-gray-800 text-white border border-purple-500/30 rounded-lg p-4 focus:outline-none focus:border-purple-500"
              >
                <option value="">Select a destination</option>
                {destinations.map((dest, index) => (
                  <option key={index} value={dest.name}>
                    {dest.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleFindRoute}
            disabled={loading || !userLocation || !destination}
            className="w-full px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating Route...' : 'Find Route'}
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 mb-6" style={{ height: '500px' }}>
          <MapComponent
            userLocation={userLocation}
            destination={destination}
            route={route}
            destinations={destinations}
          />
        </div>

        {route && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-purple-500 mb-4">Route Information</h2>
            <div className="bg-gray-800 p-6 rounded-lg">
              <p className="text-white mb-2">
                <span className="font-semibold">Distance:</span> {route.distance?.toString() || 'N/A'} km
              </p>
              <p className="text-white mb-2">
                <span className="font-semibold">Estimated Time:</span> {route.duration?.toString() || 'N/A'} minutes
              </p>
              {route.instructions && route.instructions.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold mb-2">Directions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-300">
                    {route.instructions.map((instruction: string, index: number) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


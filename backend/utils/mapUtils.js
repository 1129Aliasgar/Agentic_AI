const axios = require('axios')

/**
 * Manmad, Nashik, Maharashtra, India locations
 * Default location: Manmad city center
 */
const DEFAULT_LOCATION = {
  name: 'Manmad',
  lat: 20.2486,
  lng: 74.4356,
}

const COLLEGE_LOCATIONS = [
  { name: 'Manmad Railway Station', lat: 20.2530, lng: 74.4400 },
  { name: 'Manmad Bus Stand', lat: 20.2450, lng: 74.4320 },
  { name: 'Manmad City Center', lat: 20.2486, lng: 74.4356 },
  { name: 'Nashik Road', lat: 20.2600, lng: 74.4500 },
  { name: 'Manmad Market', lat: 20.2470, lng: 74.4330 },
  { name: 'Manmad Hospital', lat: 20.2500, lng: 74.4380 },
  { name: 'Manmad School', lat: 20.2460, lng: 74.4340 },
  { name: 'Manmad Park', lat: 20.2490, lng: 74.4370 },
  { name: 'Manmad Post Office', lat: 20.2480, lng: 74.4360 },
  { name: 'Manmad Police Station', lat: 20.2510, lng: 74.4390 },
  { name: 'Manmad College', lat: 20.2475, lng: 74.4350 },
  { name: 'Manmad Temple', lat: 20.2495, lng: 74.4365 },
  { name: 'Manmad Library', lat: 20.2485, lng: 74.4345 },
  { name: 'Manmad Stadium', lat: 20.2505, lng: 74.4375 },
  { name: 'Manmad Shopping Mall', lat: 20.2478, lng: 74.4338 },
]

/**
 * OSRM Routing API URL
 */
const OSRM_API_URL = process.env.OSRM_API_URL || 'http://router.project-osrm.org'

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (coord1, coord2) => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat)
  const dLng = toRadians(coord2.lng - coord1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180)
}

/**
 * Get default location (Manmad)
 * @returns {Object} - Default location
 */
const getDefaultLocation = () => {
  return DEFAULT_LOCATION
}

/**
 * Get all available destinations
 * @returns {Array} - Array of destination objects
 */
const getDestinations = () => {
  return COLLEGE_LOCATIONS
}

/**
 * Find destination by name
 * @param {string} name - Destination name
 * @returns {Object|null} - Destination object or null
 */
const findDestination = (name) => {
  return COLLEGE_LOCATIONS.find(
    (loc) => loc.name.toLowerCase() === name.toLowerCase()
  )
}

/**
 * Calculate route using OSRM API
 * @param {Object} start - {lat, lng}
 * @param {string} destinationName - Name of the destination
 * @returns {Promise<Object>} - Route information
 */
const calculateRoute = async (start, destinationName) => {
  const destination = findDestination(destinationName)

  if (!destination) {
    throw new Error(`Destination "${destinationName}" not found`)
  }

  try {
    // Use OSRM API for route calculation
    // Format: /route/v1/{profile}/{coordinates}?options
    // Coordinates format: {lng},{lat};{lng},{lat}
    const profile = 'driving' // Options: driving, walking, cycling
    const coordinates = `${start.lng},${start.lat};${destination.lng},${destination.lat}`
    const osrmUrl = `${OSRM_API_URL}/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true`

    const response = await axios.get(osrmUrl)

    if (response.data.code === 'Ok' && response.data.routes.length > 0) {
      const route = response.data.routes[0]
      const leg = response.data.routes[0].legs[0]
      
      // Convert duration from seconds to minutes
      const duration = Math.round(route.duration / 60)
      const distance = (route.distance / 1000).toFixed(2) // Convert to km

      // Extract path coordinates
      const path = route.geometry.coordinates.map(coord => [coord[1], coord[0]]) // Convert [lng, lat] to [lat, lng]

      // Extract step-by-step instructions
      const instructions = []
      if (leg.steps) {
        leg.steps.forEach((step, index) => {
          const instruction = step.maneuver.instruction || `Step ${index + 1}`
          const distance = (step.distance / 1000).toFixed(2)
          instructions.push(`${instruction} (${distance} km)`)
        })
      } else {
        instructions.push(`Start at your current location`)
        instructions.push(`Navigate to ${destinationName}`)
        instructions.push(`Arrive at ${destinationName}`)
      }

      return {
        distance: distance,
        duration: duration,
        path: path,
        instructions: instructions,
        destination: destination,
        source: 'OSRM',
      }
    } else {
      throw new Error('OSRM API returned no route')
    }
  } catch (error) {
    // Fallback to simple calculation
    
    // Fallback to simple calculation if OSRM fails
    const distance = calculateDistance(start, destination)
    const estimatedTime = Math.round(distance * 2) // Rough estimate: 2 minutes per km

    const path = [
      [start.lat, start.lng],
      [destination.lat, destination.lng],
    ]

    const instructions = [
      `Start at your current location (${start.lat.toFixed(6)}, ${start.lng.toFixed(6)})`,
      `Head towards ${destinationName}`,
      `Arrive at ${destinationName}`,
    ]

    return {
      distance: distance.toFixed(2),
      duration: estimatedTime,
      path: path,
      instructions: instructions,
      destination: destination,
      source: 'fallback',
    }
  }
}

module.exports = {
  getDefaultLocation,
  getDestinations,
  findDestination,
  calculateRoute,
  calculateDistance,
}


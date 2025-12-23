const mapUtils = require('../utils/mapUtils')

const getDestinations = (req, res) => {
  try {
    const destinations = mapUtils.getDestinations()
    const defaultLocation = mapUtils.getDefaultLocation()

    res.json({
      success: true,
      destinations: destinations,
      defaultLocation: defaultLocation,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch destinations',
    })
  }
}

const calculateRoute = async (req, res) => {
  try {
    const { start, destination } = req.body

    if (!start || !start.lat || !start.lng) {
      return res.status(400).json({
        success: false,
        error: 'Start location is required',
      })
    }

    if (!destination) {
      return res.status(400).json({
        success: false,
        error: 'Destination is required',
      })
    }

    const route = await mapUtils.calculateRoute(start, destination)

    res.json({
      success: true,
      route: route,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate route',
    })
  }
}

module.exports = {
  getDestinations,
  calculateRoute,
}


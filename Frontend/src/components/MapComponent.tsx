import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon issue
if (typeof window !== 'undefined') {
  // @ts-ignore - Leaflet internal property
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface Route {
  path?: number[][]
  distance?: string | number
  duration?: number
  instructions?: string[]
}

interface UserLocation {
  lat: number
  lng: number
}

// Component to update map view when route changes
function MapUpdater({ route, userLocation }: { route: Route | null; userLocation: UserLocation | null }) {
  const map = useMap()

  useEffect(() => {
    if (route && route.path && route.path.length > 0) {
      const latlngs = route.path.map((coord: number[]) => [coord[0], coord[1]] as [number, number])
      const bounds = L.latLngBounds(latlngs)
      map.fitBounds(bounds, { padding: [20, 20] })
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13)
    }
  }, [route, userLocation, map])

  return null
}

interface Destination {
  name: string
  lat: number
  lng: number
}

interface MapComponentProps {
  userLocation: UserLocation | null
  destination: string | null
  route: Route | null
  destinations: Destination[]
}

export default function MapComponent({ userLocation, destination, route, destinations }: MapComponentProps) {
  // Default to Manmad, Nashik, Maharashtra, India
  const defaultCenter: [number, number] = [20.2486, 74.4356]
  const center: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : defaultCenter

  // Create custom icons
  const userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  })

  const destinationIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  })

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {/* User location marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Your Location (Manmad)</Popup>
        </Marker>
      )}

      {/* Destination markers */}
      {destinations.map((dest, index) => (
        <Marker key={index} position={[dest.lat, dest.lng]} icon={destinationIcon}>
          <Popup>{dest.name}</Popup>
        </Marker>
      ))}

      {/* Route polyline */}
      {route && route.path && route.path.length > 0 && (
        <Polyline
          positions={route.path.map((coord: number[]) => [coord[0], coord[1]] as [number, number])}
          color="#9333EA"
          weight={4}
          opacity={0.7}
        />
      )}

      {/* Map updater component */}
      <MapUpdater route={route} userLocation={userLocation} />
    </MapContainer>
  )
}


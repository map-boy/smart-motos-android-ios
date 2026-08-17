export const MAPBOX_CONFIG = {
  // Replace with your actual Mapbox access token
  ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  
  // Mapbox API endpoints
  DIRECTIONS_API: 'https://api.mapbox.com/directions/v5/mapbox/driving',
  GEOCODING_API: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  MATRIX_API: 'https://api.mapbox.com/directions-matrix/v1/mapbox/driving',
  
  // Default map style
  MAP_STYLE: 'mapbox://styles/mapbox/streets-v12',
  
  // Navigation settings
  NAVIGATION_SETTINGS: {
    voiceInstructions: true,
    bannerInstructions: true,
    simulateRoute: false,
  }
};

export const getDirectionsUrl = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  waypoints?: Array<{ latitude: number; longitude: number }>
) => {
  const coordinates = [
    `${origin.longitude},${origin.latitude}`,
    ...(waypoints?.map(wp => `${wp.longitude},${wp.latitude}`) || []),
    `${destination.longitude},${destination.latitude}`
  ].join(';');
  
  return `${MAPBOX_CONFIG.DIRECTIONS_API}/${coordinates}?access_token=${MAPBOX_CONFIG.ACCESS_TOKEN}&geometries=geojson&overview=full&steps=true&annotations=distance,duration`;
};

export const getGeocodingUrl = (query: string) => {
  return `${MAPBOX_CONFIG.GEOCODING_API}/${encodeURIComponent(query)}.json?access_token=${MAPBOX_CONFIG.ACCESS_TOKEN}&country=RW`;
}; 
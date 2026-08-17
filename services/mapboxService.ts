import { MAPBOX_CONFIG, getDirectionsUrl, getGeocodingUrl } from '../config/mapbox';

export interface MapboxDirectionsResponse {
  routes: Array<{
    geometry: {
      coordinates: Array<[number, number]>;
      type: string;
    };
    legs: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        distance: number;
        duration: number;
        geometry: {
          coordinates: Array<[number, number]>;
        };
        maneuver: {
          instruction: string;
          location: [number, number];
        };
      }>;
    }>;
    distance: number;
    duration: number;
  }>;
  waypoints: Array<{
    location: [number, number];
    name: string;
  }>;
}

export interface MapboxGeocodingResponse {
  features: Array<{
    id: string;
    type: string;
    place_type: string[];
    relevance: number;
    properties: {
      accuracy?: string;
      address?: string;
      category?: string;
      maki?: string;
      wikidata?: string;
      short_code?: string;
    };
    text: string;
    place_name: string;
    bbox: [number, number, number, number];
    center: [number, number];
    geometry: {
      type: string;
      coordinates: [number, number];
    };
  }>;
}

export interface NavigationRoute {
  coordinates: Array<{ latitude: number; longitude: number }>;
  distance: number;
  duration: number;
  steps: Array<{
    distance: number;
    duration: number;
    instruction: string;
    coordinates: Array<{ latitude: number; longitude: number }>;
  }>;
}

class MapboxService {
  private static instance: MapboxService;

  private constructor() {}

  public static getInstance(): MapboxService {
    if (!MapboxService.instance) {
      MapboxService.instance = new MapboxService();
    }
    return MapboxService.instance;
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    waypoints?: Array<{ latitude: number; longitude: number }>
  ): Promise<NavigationRoute | null> {
    try {
      const url = getDirectionsUrl(origin, destination, waypoints);
      const response = await fetch(url);
      const data: MapboxDirectionsResponse = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];

        return {
          coordinates: route.geometry.coordinates.map(coord => ({
            latitude: coord[1],
            longitude: coord[0]
          })),
          distance: leg.distance,
          duration: leg.duration,
          steps: leg.steps.map(step => ({
            distance: step.distance,
            duration: step.duration,
            instruction: step.maneuver.instruction,
            coordinates: step.geometry.coordinates.map(coord => ({
              latitude: coord[1],
              longitude: coord[0]
            }))
          }))
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const url = getGeocodingUrl(address);
      const response = await fetch(url);
      const data: MapboxGeocodingResponse = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          latitude: feature.center[1],
          longitude: feature.center[0]
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const url = `${MAPBOX_CONFIG.GEOCODING_API}/${longitude},${latitude}.json?access_token=${MAPBOX_CONFIG.ACCESS_TOKEN}&types=poi,address`;
      const response = await fetch(url);
      const data: MapboxGeocodingResponse = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Get ETA between two points
   */
  async getETA(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<{ distance: number; duration: number } | null> {
    try {
      const route = await this.getDirections(origin, destination);
      if (route) {
        return {
          distance: route.distance,
          duration: route.duration
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting ETA:', error);
      return null;
    }
  }

  /**
   * Get real-time route updates
   */
  async getRealTimeRoute(
    currentLocation: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<NavigationRoute | null> {
    // This would typically integrate with real-time traffic data
    // For now, we'll use the standard directions API
    return this.getDirections(currentLocation, destination);
  }
}

export default MapboxService; 
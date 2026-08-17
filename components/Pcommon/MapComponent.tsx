import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { MapPin, Car } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import MapboxService from '@/services/mapboxService';
import { MAPBOX_CONFIG } from '@/config/mapbox';

interface MapComponentProps {
  userLocation: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
  nearbyDrivers?: AvailableRide[];
  assignedDriver?: DriverInfo | null;
  routePolyline?: string | null;
  selectedPickup?: { latitude: number; longitude: number } | null;
  selectedDropoff?: { latitude: number; longitude: number } | null;
  onMapTap?: (event: any) => void;
  isSelectingLocation?: 'pickup' | 'dropoff' | null;
}

interface AvailableRide {
  id: string;
  location: { latitude: number; longitude: number };
}

interface DriverInfo {
  id: string;
  name: string;
  rating: number;
  plate: string;
  avatar: string;
  location?: { latitude: number; longitude: number };
}

export default function MapComponent({
  userLocation,
  destination,
  nearbyDrivers = [],
  assignedDriver,
  routePolyline,
  selectedPickup,
  selectedDropoff,
  onMapTap,
  isSelectingLocation,
}: MapComponentProps) {
  const mapRef = useRef<Mapbox.MapView>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<
    Array<{ latitude: number; longitude: number }>
  >([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const mapboxService = MapboxService.getInstance();

  // Initialize Mapbox only once when component mounts
  useEffect(() => {
    let isMounted = true;

    const initializeMapbox = async () => {
      try {
        if (isMounted && !isInitialized) {
          // Set access token
          Mapbox.setAccessToken(MAPBOX_CONFIG.ACCESS_TOKEN);
          setIsInitialized(true);
          console.log('Mapbox initialized successfully');
        }
      } catch (error) {
        console.error('Error initializing Mapbox:', error);
      }
    };

    initializeMapbox();

    return () => {
      isMounted = false;
    };
  }, [isInitialized]);

  // Handle map ready state
  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
    console.log('Map is ready');
  }, []);

  // Handle map tap events
  const handleMapTap = useCallback(
    (event: any) => {
      console.log('Map tapped:', event); // Debug log
      console.log('Event type:', typeof event); // Debug log
      console.log('Event keys:', Object.keys(event || {})); // Debug log

      if (onMapTap && isSelectingLocation) {
        console.log('Calling onMapTap with event'); // Debug log

        // Check if this is a React Native touch event
        if (event.nativeEvent) {
          const { locationX, locationY } = event.nativeEvent;
          console.log('Touch coordinates:', { locationX, locationY }); // Debug log

          // Convert screen coordinates to map coordinates
          if (mapRef.current) {
            mapRef.current
              .getCoordinateFromView([locationX, locationY])
              .then((coordinates: number[]) => {
                console.log('Map coordinates:', coordinates); // Debug log
                const [longitude, latitude] = coordinates;
                const mapEvent = {
                  geometry: {
                    coordinates: [longitude, latitude],
                  },
                };
                onMapTap(mapEvent);
              })
              .catch((error: any) => {
                console.error('Error converting coordinates:', error);
                // Fallback: try to use the event as-is
                onMapTap(event);
              });
          } else {
            console.log('Map ref not available'); // Debug log
            onMapTap(event);
          }
        } else if (event.geometry?.coordinates) {
          // Mapbox format: [longitude, latitude]
          const [longitude, latitude] = event.geometry.coordinates;
          const mapEvent = {
            geometry: {
              coordinates: [longitude, latitude],
            },
          };
          onMapTap(mapEvent);
        } else {
          // Try passing the event as-is
          onMapTap(event);
        }
      } else {
        console.log(
          'Not calling onMapTap - onMapTap:',
          !!onMapTap,
          'isSelectingLocation:',
          isSelectingLocation
        ); // Debug log
      }
    },
    [onMapTap, isSelectingLocation]
  );

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      setIsMapReady(false);
      setIsInitialized(false);
    };
  }, []);

  useEffect(() => {
    if (userLocation && destination && isMapReady) {
      loadRoute();
    }
  }, [userLocation, destination, isMapReady]);

  useEffect(() => {
    if (routePolyline && isMapReady) {
      const coordinates = decodePolyline(routePolyline);
      setRouteCoordinates(coordinates);
    }
  }, [routePolyline, isMapReady]);

  const loadRoute = async () => {
    if (!userLocation || !destination) return;

    try {
      const route = await mapboxService.getDirections(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: destination.latitude, longitude: destination.longitude }
      );

      if (route) {
        setRouteCoordinates(route.coordinates);
      }
    } catch (error) {
      console.error('Error loading route:', error);
    }
  };

  const decodePolyline = (polyline: string) => {
    if (!polyline) return [];
    try {
      return polyline.split('|').map((point) => {
        const [lat, lng] = point.split(',').map(Number);
        return { latitude: lat, longitude: lng };
      });
    } catch (e) {
      console.error('Error decoding polyline:', e);
      return [];
    }
  };

  const fitToCoordinates = () => {
    // This will be handled by the initialRegion prop
    // No need for manual camera control
  };

  useEffect(() => {
    if (userLocation) {
      fitToCoordinates();
    }
  }, [userLocation, destination, assignedDriver]);

  // Don't render map until initialized
  if (!isInitialized) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={Mapbox.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        onMapIdle={handleMapReady}
        onTouchStart={handleMapTap}
      >
        {/* Route line */}
        {routeCoordinates.length > 0 && (
          <Mapbox.ShapeSource
            id="routeSource"
            shape={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates.map((coord) => [
                  coord.longitude,
                  coord.latitude,
                ]),
              },
            }}
          >
            <Mapbox.LineLayer
              id="routeLine"
              style={{
                lineColor: Colors.primary.default,
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* User's Location Marker - Always shown by default */}
        {userLocation && (
          <Mapbox.PointAnnotation
            id="userLocation"
            coordinate={[userLocation.longitude, userLocation.latitude]}
            title="Your Location"
          >
            <View style={styles.userMarker}>
              <MapPin size={24} color={Colors.primary.default} />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Destination Marker */}
        {destination && (
          <Mapbox.PointAnnotation
            id="destination"
            coordinate={[destination.longitude, destination.latitude]}
            title="Destination"
          >
            <View style={styles.destinationMarker}>
              <MapPin size={24} color={Colors.secondary.default} />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Nearby Drivers Markers */}
        {nearbyDrivers
          .filter(
            (driver) =>
              driver.location &&
              typeof driver.location.latitude === 'number' &&
              typeof driver.location.longitude === 'number'
          )
          .map((driver) => (
            <Mapbox.PointAnnotation
              key={driver.id}
              id={`driver-${driver.id}`}
              coordinate={[driver.location.longitude, driver.location.latitude]}
              title="Available Driver"
            >
              <View style={styles.driverMarker}>
                <Car size={22} color={Colors.neutral.white} />
              </View>
            </Mapbox.PointAnnotation>
          ))}

        {/* Assigned Driver Marker (highlighted) */}
        {assignedDriver?.location && (
          <Mapbox.PointAnnotation
            id="assignedDriver"
            coordinate={[
              assignedDriver.location.longitude,
              assignedDriver.location.latitude,
            ]}
            title="Your Driver"
          >
            <View style={styles.assignedDriverMarker}>
              <Car size={24} color={Colors.neutral.white} />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Selected Pickup Location Marker */}
        {selectedPickup && (
          <Mapbox.PointAnnotation
            id="selectedPickup"
            coordinate={[selectedPickup.longitude, selectedPickup.latitude]}
            title="Selected Pickup"
          >
            <View style={styles.selectedPickupMarker}>
              <MapPin size={24} color={Colors.primary.default} />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Selected Dropoff Location Marker */}
        {selectedDropoff && (
          <Mapbox.PointAnnotation
            id="selectedDropoff"
            coordinate={[selectedDropoff.longitude, selectedDropoff.latitude]}
            title="Selected Dropoff"
          >
            <View style={styles.selectedDropoffMarker}>
              <MapPin size={24} color={Colors.secondary.default} />
            </View>
          </Mapbox.PointAnnotation>
        )}
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    backgroundColor: Colors.neutral.white,
    padding: 8,
    borderRadius: 24,
    borderColor: Colors.primary.default,
    borderWidth: 3,
  },
  destinationMarker: {
    backgroundColor: Colors.neutral.white,
    padding: 8,
    borderRadius: 24,
    borderColor: Colors.secondary.default,
    borderWidth: 3,
  },
  driverMarker: {
    backgroundColor: Colors.neutral.dark,
    padding: 6,
    borderRadius: 18,
  },
  assignedDriverMarker: {
    backgroundColor: Colors.primary.default,
    padding: 8,
    borderRadius: 24,
    borderColor: Colors.neutral.white,
    borderWidth: 2,
  },
  selectedPickupMarker: {
    backgroundColor: Colors.primary.default,
    padding: 8,
    borderRadius: 24,
    borderColor: Colors.neutral.white,
    borderWidth: 2,
  },
  selectedDropoffMarker: {
    backgroundColor: Colors.secondary.default,
    padding: 8,
    borderRadius: 24,
    borderColor: Colors.neutral.white,
    borderWidth: 2,
  },
});

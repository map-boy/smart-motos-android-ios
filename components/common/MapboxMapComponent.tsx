import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Alert, TouchableOpacity } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Location, MarkerData } from '../../types';
import { MAPBOX_CONFIG } from '../../config/mapbox';
import MapboxService, { NavigationRoute } from '../../services/mapboxService';

interface MapboxMapComponentProps {
  routeCoordinates: Location[];
  currentLocation: Location | null;
  markers?: MarkerData[];
  destination?: Location;
  showNavigation?: boolean;
  onRouteUpdate?: (route: NavigationRoute) => void;
  onLocationUpdate?: (location: Location) => void;
}

const MapboxMapComponent = ({
  routeCoordinates,
  currentLocation,
  markers,
  destination,
  showNavigation = false,
  onRouteUpdate,
  onLocationUpdate,
}: MapboxMapComponentProps) => {
  const mapRef = useRef<Mapbox.MapView>(null);
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const mapboxService = MapboxService.getInstance();

  useEffect(() => {
    // Initialize Mapbox with access token
    Mapbox.setAccessToken(MAPBOX_CONFIG.ACCESS_TOKEN);
  }, []);

  useEffect(() => {
    if (currentLocation && destination) {
      loadRoute();
    }
  }, [currentLocation, destination]);

  const loadRoute = async () => {
    if (!currentLocation || !destination) return;

    try {
      const newRoute = await mapboxService.getDirections(
        currentLocation,
        destination
      );
      if (newRoute) {
        setRoute(newRoute);
        onRouteUpdate?.(newRoute);
      }
    } catch (error) {
      console.error('Error loading route:', error);
      Alert.alert('Error', 'Failed to load route');
    }
  };

  const fitToRoute = () => {
    if (mapRef.current && route && route.coordinates.length > 0) {
      const centerCoord =
        route.coordinates[Math.floor(route.coordinates.length / 2)];
      mapRef.current.setCamera({
        centerCoordinate: [centerCoord.longitude, centerCoord.latitude],
        zoomLevel: 14,
        animationDuration: 1000,
      });
    }
  };

  const startNavigation = () => {
    if (!route) return;
    console.log('Starting navigation with route:', route);
    // This would integrate with Mapbox Navigation SDK
  };

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={MAPBOX_CONFIG.MAP_STYLE}
      >
        {/* Route line */}
        {route && (
          <Mapbox.ShapeSource
            id="routeSource"
            shape={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route.coordinates.map((coord) => [
                  coord.longitude,
                  coord.latitude,
                ]),
              },
            }}
          >
            <Mapbox.LineLayer
              id="routeLine"
              style={{
                lineColor: '#0066FF',
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Current location marker */}
        {currentLocation && (
          <Mapbox.PointAnnotation
            id="currentLocation"
            coordinate={[currentLocation.longitude, currentLocation.latitude]}
          >
            <View style={styles.motorcycleMarker}>
              <FontAwesome name="motorcycle" size={20} color="#000" />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Destination marker */}
        {destination && (
          <Mapbox.PointAnnotation
            id="destination"
            coordinate={[destination.longitude, destination.latitude]}
          >
            <View style={styles.destinationMarker}>
              <Ionicons name="location" size={24} color="#FF0000" />
            </View>
          </Mapbox.PointAnnotation>
        )}

        {/* Custom markers */}
        {markers?.map((marker) => (
          <Mapbox.PointAnnotation
            key={marker.id}
            id={marker.id}
            coordinate={[
              marker.coordinate.longitude,
              marker.coordinate.latitude,
            ]}
            title={marker.title}
            snippet={marker.description}
            onSelected={marker.onPress}
          >
            <View style={styles.locationMarker}>
              <Ionicons name="location" size={24} color="#00BCD4" />
            </View>
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>

      {/* Navigation controls */}
      {showNavigation && route && (
        <View style={styles.navigationControls}>
          <View style={styles.routeInfo}>
            <Text style={styles.routeText}>
              Distance: {(route.distance / 1000).toFixed(1)} km
            </Text>
            <Text style={styles.routeText}>
              Duration: {Math.round(route.duration / 60)} min
            </Text>
          </View>
          <View style={styles.navigationButtons}>
            <TouchableOpacity style={styles.navButton} onPress={fitToRoute}>
              <Ionicons name="locate" size={24} color="#0066FF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={startNavigation}
            >
              <Ionicons name="navigate" size={24} color="#0066FF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  motorcycleMarker: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
    borderColor: '#000',
  },
  destinationMarker: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  locationMarker: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 5,
    borderWidth: 2,
    borderColor: '#00BCD4',
  },
  navigationControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfo: {
    marginBottom: 10,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    padding: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapboxMapComponent;

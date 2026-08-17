import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapboxMapComponent from '../common/MapboxMapComponent';
import MapboxService, { NavigationRoute } from '../../services/mapboxService';
import { Location as LocationType } from '../../types';

interface RealTimeNavigationProps {
  pickupLocation: LocationType;
  dropoffLocation: LocationType;
  isNavigatingToPickup: boolean;
  onArrivedAtPickup: () => void;
  onArrivedAtDropoff: () => void;
  onCancelNavigation: () => void;
  bookingStatus: string | null;
}

const RealTimeNavigation: React.FC<RealTimeNavigationProps> = ({
  pickupLocation,
  dropoffLocation,
  isNavigatingToPickup,
  onArrivedAtPickup,
  onArrivedAtDropoff,
  onCancelNavigation,
  bookingStatus,
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(
    null
  );
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [eta, setEta] = useState<{ distance: number; duration: number } | null>(
    null
  );
  const [isNearDestination, setIsNearDestination] = useState(false);
  const [locationWatcher, setLocationWatcher] =
    useState<Location.LocationSubscription | null>(null);

  const mapboxService = MapboxService.getInstance();

  useEffect(() => {
    initializeLocation();
    return () => {
      cleanupLocationWatcher();
    };
  }, []);

  useEffect(() => {
    if (currentLocation) {
      const destination = isNavigatingToPickup
        ? pickupLocation
        : dropoffLocation;
      updateRoute(currentLocation, destination);
      checkProximity(currentLocation, destination);
    }
  }, [currentLocation, isNavigatingToPickup, pickupLocation, dropoffLocation]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Location permission is required for navigation'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      startLocationWatching();
    } catch (error) {
      console.error('Error initializing location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const startLocationWatching = async () => {
    try {
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (location) => {
          const newLocation: LocationType = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setCurrentLocation(newLocation);
        }
      );

      setLocationWatcher(watcher);
    } catch (error) {
      console.error('Error starting location watcher:', error);
    }
  };

  const cleanupLocationWatcher = () => {
    if (locationWatcher) {
      locationWatcher.remove();
      setLocationWatcher(null);
    }
  };

  const updateRoute = async (
    origin: LocationType,
    destination: LocationType
  ) => {
    try {
      const newRoute = await mapboxService.getDirections(origin, destination);
      if (newRoute) {
        setRoute(newRoute);
        setEta({
          distance: newRoute.distance,
          duration: newRoute.duration,
        });
      }
    } catch (error) {
      console.error('Error updating route:', error);
    }
  };

  const checkProximity = (current: LocationType, destination: LocationType) => {
    const distance = calculateDistance(current, destination);
    // Use 100m for pickup, 50m for dropoff
    const proximityThreshold = isNavigatingToPickup ? 100 : 50;
    console.log('[DEBUG] Proximity check:', {
      current,
      destination,
      distance,
      proximityThreshold,
      isNavigatingToPickup,
    });
    setIsNearDestination(distance <= proximityThreshold);
    console.log(
      '[DEBUG] isNearDestination set to:',
      distance <= proximityThreshold
    );
  };

  const calculateDistance = (
    point1: LocationType,
    point2: LocationType
  ): number => {
    const R = 6371e3;
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handleRouteUpdate = (newRoute: NavigationRoute) => {
    setRoute(newRoute);
    setEta({
      distance: newRoute.distance,
      duration: newRoute.duration,
    });
  };

  const handleLocationUpdate = (location: LocationType) => {
    setCurrentLocation(location);
  };

  return (
    <View style={styles.container}>
      <MapboxMapComponent
        routeCoordinates={route?.coordinates || []}
        currentLocation={currentLocation}
        destination={isNavigatingToPickup ? pickupLocation : dropoffLocation}
        showNavigation={true}
        onRouteUpdate={handleRouteUpdate}
        onLocationUpdate={handleLocationUpdate}
      />

      <View style={styles.navigationHeader}>
        <View style={styles.headerContent}>
          <View style={styles.navigationInfo}>
            <Text style={styles.navigationTitle}>
              {isNavigatingToPickup
                ? 'Navigating to Pickup'
                : 'Navigating to Destination'}
            </Text>
            <Text style={styles.locationText}>
              {isNavigatingToPickup ? 'Pickup Location' : 'Dropoff Location'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancelNavigation}
          >
            <Ionicons name="close" size={24} color="#FF0000" />
          </TouchableOpacity>
        </View>
      </View>

      {eta && (
        <View style={styles.etaCard}>
          <View style={styles.etaInfo}>
            <View style={styles.etaItem}>
              <Ionicons name="time-outline" size={20} color="#0066FF" />
              <Text style={styles.etaText}>{formatDuration(eta.duration)}</Text>
            </View>
            <View style={styles.etaItem}>
              <Ionicons name="location-outline" size={20} color="#0066FF" />
              <Text style={styles.etaText}>{formatDistance(eta.distance)}</Text>
            </View>
          </View>
          {isNearDestination && (
            <View style={styles.arrivalIndicator}>
              <FontAwesome name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.arrivalText}>Near destination</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.actionButtons}>
        {(() => {
          console.log('[DEBUG] Render Arrived button check:', {
            isNavigatingToPickup,
            isNearDestination,
            bookingStatus,
          });
          return null;
        })()}
        {isNavigatingToPickup &&
          isNearDestination &&
          (bookingStatus === 'driver_assigned' ||
            bookingStatus === 'accepted') && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={onArrivedAtPickup}
            >
              <Ionicons name="checkmark" size={24} color="#FFF" />
              <Text style={styles.actionButtonText}>Arrived at Pickup</Text>
            </TouchableOpacity>
          )}
        {!isNavigatingToPickup && isNearDestination && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={onArrivedAtDropoff}
          >
            <Ionicons name="checkmark" size={24} color="#FFF" />
            <Text style={styles.actionButtonText}>Arrived at Destination</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navigationHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navigationInfo: {
    flex: 1,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  cancelButton: {
    padding: 5,
  },
  etaCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 130 : 110,
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
  etaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  arrivalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  arrivalText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#0066FF',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RealTimeNavigation;

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

interface PassengerTrackingProps {
  pickupLocation: LocationType;
  dropoffLocation: LocationType;
  driverLocation: LocationType | null;
  driverName: string;
  driverRating: number;
  vehicleInfo: string;
  estimatedArrival: string;
  onCancelRide: () => void;
  onContactDriver: () => void;
}

const PassengerTracking: React.FC<PassengerTrackingProps> = ({
  pickupLocation,
  dropoffLocation,
  driverLocation,
  driverName,
  driverRating,
  vehicleInfo,
  estimatedArrival,
  onCancelRide,
  onContactDriver,
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(
    null
  );
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [eta, setEta] = useState<{ distance: number; duration: number } | null>(
    null
  );
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
    if (driverLocation && pickupLocation) {
      updateRoute(driverLocation, pickupLocation);
    }
  }, [driverLocation, pickupLocation]);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Location permission is required for tracking'
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

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome
          key={i}
          name={i <= rating ? 'star' : 'star-o'}
          size={16}
          color="#FFD700"
        />
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <MapboxMapComponent
        routeCoordinates={route?.coordinates || []}
        currentLocation={driverLocation}
        destination={pickupLocation}
        showNavigation={false}
        onRouteUpdate={handleRouteUpdate}
        onLocationUpdate={handleLocationUpdate}
        markers={[
          {
            id: 'pickup',
            coordinate: pickupLocation,
            title: 'Pickup Location',
            description: pickupLocation.address || 'Pickup',
          },
          {
            id: 'dropoff',
            coordinate: dropoffLocation,
            title: 'Dropoff Location',
            description: dropoffLocation.address || 'Dropoff',
          },
        ]}
      />

      <View style={styles.driverInfoHeader}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={24} color="#FFF" />
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{driverName}</Text>
            <View style={styles.ratingContainer}>
              {renderStars(driverRating)}
              <Text style={styles.ratingText}>{driverRating.toFixed(1)}</Text>
            </View>
            <Text style={styles.vehicleInfo}>{vehicleInfo}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={onContactDriver}
        >
          <Ionicons name="call" size={20} color="#0066FF" />
        </TouchableOpacity>
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
          <Text style={styles.estimatedArrival}>
            Estimated arrival: {estimatedArrival}
          </Text>
        </View>
      )}

      <View style={styles.rideDetailsCard}>
        <View style={styles.locationInfo}>
          <View style={styles.locationItem}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={16} color="#4CAF50" />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationAddress}>
                {pickupLocation.address || 'Pickup location'}
              </Text>
            </View>
          </View>
          <View style={styles.locationItem}>
            <View style={styles.locationIcon}>
              <Ionicons name="location-outline" size={16} color="#FF5722" />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.locationAddress}>
                {dropoffLocation.address || 'Dropoff location'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={onCancelRide}
        >
          <Ionicons name="close" size={20} color="#FF0000" />
          <Text style={styles.cancelButtonText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  driverInfoHeader: {
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
  },
  contactButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    padding: 10,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 10,
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
  estimatedArrival: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  rideDetailsCard: {
    position: 'absolute',
    bottom: 100,
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
  locationInfo: {
    gap: 12,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
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
  cancelButton: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  cancelButtonText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PassengerTracking;

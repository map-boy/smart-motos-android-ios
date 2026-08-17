import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { Location } from '../../types';
import MapComponent from '../common/MapComponent';
import { rideService } from '../../services/ride';

interface DriverWaitingScreenProps {
  driverInfo: any;
  pickupLocation: Location;
  destinationLocation: Location;
  onDriverArrived: () => void;
  onCancelRide: () => void;
}

const { width, height } = Dimensions.get('window');

export const DriverWaitingScreen: React.FC<DriverWaitingScreenProps> = ({
  driverInfo,
  pickupLocation,
  destinationLocation,
  onDriverArrived,
  onCancelRide,
}) => {
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [passengerLocation, setPassengerLocation] = useState<Location | null>(
    null
  );
  const [distanceToDriver, setDistanceToDriver] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [locationSubscription, setLocationSubscription] =
    useState<ExpoLocation.LocationSubscription | null>(null);
  const [driverArrived, setDriverArrived] = useState<boolean>(false);

  // Start tracking passenger location
  useEffect(() => {
    startLocationTracking();

    // Cleanup location subscription
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const startLocationTracking = async () => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Location permission is required to track your ride.'
        );
        return;
      }

      const subscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const newLocation: Location = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: '',
          };
          setPassengerLocation(newLocation);

          // Calculate distance to driver if driver location is available
          if (driverLocation) {
            calculateDistance(newLocation, driverLocation);
          }
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error(
        '[DriverWaitingScreen] Error starting location tracking:',
        error
      );
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (loc1: Location, loc2: Location) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) *
        Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    setDistanceToDriver(distance);

    // Estimate time based on average speed (assuming 30 km/h in city)
    const estimatedTimeMinutes = (distance / 30) * 60;
    setEstimatedTime(Math.round(estimatedTimeMinutes));
  };

  // Update driver location (this would be called from WebSocket updates)
  const updateDriverLocation = (location: Location) => {
    setDriverLocation(location);
    if (passengerLocation) {
      calculateDistance(passengerLocation, location);
    }
  };

  // Mock driver location for demo (in real app, this would come from WebSocket)
  useEffect(() => {
    // Simulate driver approaching
    const interval = setInterval(() => {
      if (passengerLocation) {
        // Create a mock driver location that gets closer over time
        const mockDriverLocation: Location = {
          latitude: passengerLocation.latitude + (Math.random() - 0.5) * 0.01,
          longitude: passengerLocation.longitude + (Math.random() - 0.5) * 0.01,
          address: '',
        };
        updateDriverLocation(mockDriverLocation);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [passengerLocation]);

  useEffect(() => {
    // Subscribe to ride status updates
    const handleRideUpdate = (update: any) => {
      console.log(
        '[DriverWaitingScreen] handleRideUpdate called with:',
        update
      );
      let status = update.status;
      console.log('[DriverWaitingScreen] Original status:', status);
      if (status === 'arrived_at_pickup') status = 'driver_arrived';
      console.log('[DriverWaitingScreen] Processed status:', status);
      if (status === 'driver_arrived') {
        console.log(
          '[DriverWaitingScreen] Detected driver_arrived status, setting driverArrived to true'
        );
        setDriverArrived(true);
        // Call onDriverArrived after a short delay to show the banner
        setTimeout(() => {
          console.log(
            '[DriverWaitingScreen] Calling onDriverArrived after banner display'
          );
          onDriverArrived();
        }, 3000); // Show banner for 3 seconds
      } else {
        console.log(
          '[DriverWaitingScreen] Status is not driver_arrived, ignoring'
        );
      }
    };
    console.log('[DriverWaitingScreen] Adding ride update listener');
    rideService.addRideUpdateListener(handleRideUpdate);
    return () => {
      console.log('[DriverWaitingScreen] Removing ride update listener');
      rideService.removeRideUpdateListener(handleRideUpdate);
    };
  }, [onDriverArrived]);

  // Log pickup and destination locations
  //console.log('[DriverWaitingScreen] pickupLocation:', pickupLocation);
  //console.log(
  //  '[DriverWaitingScreen] destinationLocation:',
  //  destinationLocation
  //);

  // Defensive: check for valid locations
  if (
    !pickupLocation ||
    !destinationLocation ||
    typeof pickupLocation.latitude !== 'number' ||
    typeof pickupLocation.longitude !== 'number' ||
    typeof destinationLocation.latitude !== 'number' ||
    typeof destinationLocation.longitude !== 'number'
  ) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'red' }}>
          Waiting for valid pickup and destination locations...
        </Text>
      </View>
    );
  }

  const routeCoordinates = [pickupLocation, destinationLocation];
  const markers = [
    // Passenger marker
    ...(passengerLocation
      ? [
          {
            id: 'passenger',
            coordinate: passengerLocation,
            title: 'Your Location',
            description: 'You are here',
          },
        ]
      : []),
    // Driver marker
    ...(driverLocation
      ? [
          {
            id: 'driver',
            coordinate: driverLocation,
            title: driverInfo?.name || 'Driver',
            description: `${distanceToDriver.toFixed(1)} km away`,
          },
        ]
      : []),
  ];

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapComponent
        routeCoordinates={routeCoordinates}
        currentLocation={driverLocation || pickupLocation}
        markers={markers}
      />

      {/* Driver Arrived Banner */}
      {driverArrived && (
        <View style={styles.arrivedBanner}>
          <View style={styles.arrivedBannerContent}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.arrivedBannerText}>Driver has arrived!</Text>
          </View>
        </View>
      )}

      {/* Waiting overlay */}
      <View style={styles.waitingOverlay}>
        <View style={styles.waitingCard}>
          <View style={styles.waitingHeader}>
            <Ionicons name="car" size={24} color="#FFD700" />
            <Text style={styles.waitingTitle}>Driver is on the way</Text>
          </View>

          <View style={styles.driverInfoRow}>
            <Image
              source={{
                uri:
                  driverInfo?.avatar ||
                  'https://randomuser.me/api/portraits/men/32.jpg',
              }}
              style={styles.driverAvatar}
            />
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>
                {driverInfo?.name || 'Driver Name'}
              </Text>
              <View style={styles.ratingRow}>
                <FontAwesome name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {driverInfo?.rating || '5.0'}
                </Text>
              </View>
              <Text style={styles.vehicleInfo}>
                {driverInfo?.vehicle_type || 'Moto'} -{' '}
                {driverInfo?.license_number || 'PL8S'}
              </Text>
            </View>
            <View style={styles.distanceInfo}>
              <Text style={styles.distanceText}>
                {distanceToDriver.toFixed(1)} km
              </Text>
              <Text style={styles.timeText}>~{estimatedTime} min</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      Math.max(0, 100 - distanceToDriver * 20)
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Driver is {distanceToDriver.toFixed(1)} km away
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.callButton}>
              <FontAwesome name="phone" size={16} color="#FFD700" />
              <Text style={styles.callButtonText}>Call Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton}>
              <FontAwesome name="comment" size={16} color="#FFD700" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancelRide}
            >
              <FontAwesome name="times" size={16} color="#FF4444" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  waitingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  waitingCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#666',
  },
  distanceInfo: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  messageButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  arrivedBanner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 20,
  },
  arrivedBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedBannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default DriverWaitingScreen;

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useRide } from '../../hooks/useRideContext';
import { useAuth } from '../../hooks/AuthContext';
import { Ride, RideStatus, Location as LocationType } from '../../types';
import { API_URL, WS_URL } from '../../config';
import { getAuthToken } from '../../services/auth';
import MapComponent from '../../components/common/MapComponent';
import Button from '../../components/common/Button';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import InvoiceScreen from '../../app/Ride/invoice';
import PaymentScreen from '../../app/Ride/payment';
import { rideService } from '../../services/ride';

export default function ActiveRideScreen() {
  const wsRef = useRef<WebSocket | null>(null);
  const { rideState } = useRide();
  const { user } = useAuth();
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [rideStatus, setRideStatus] = useState<RideStatus>('driver_assigned');
  const [banner, setBanner] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [driverLocation, setDriverLocation] = useState<LocationType | null>(
    null
  );
  const [passengerLocation, setPassengerLocation] =
    useState<LocationType | null>(null);
  const [distanceToDriver, setDistanceToDriver] = useState<number>(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(0);
  const [locationSubscription, setLocationSubscription] =
    useState<ExpoLocation.LocationSubscription | null>(null);

  useEffect(() => {
    // Initialize ride from context or fetch from API
    if (rideState.bookingDetails.bookingId) {
      fetchRideDetails(rideState.bookingDetails.bookingId);
    }
    // WebSocket connection for ride updates
    const wsUrl = (typeof WS_URL === 'function' ? WS_URL() : WS_URL) || '';
    if (wsUrl && rideState.bookingDetails.bookingId) {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        // Optionally authenticate or subscribe to booking events
        ws.send(
          JSON.stringify({
            type: 'subscribe',
            booking_id: rideState.bookingDetails.bookingId,
            user_type: 'passenger',
          })
        );
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[ActiveRide] WebSocket message received:', data);

          if (data.type === 'ride_update') {
            console.log(
              '[ActiveRide] Received ride_update status:',
              data.status
            );
            let normalizedStatus = data.status;
            if (normalizedStatus === 'arrived_at_pickup')
              normalizedStatus = 'driver_arrived';
            console.log('[ActiveRide] Normalized status:', normalizedStatus);
            setRideStatus(normalizedStatus);
            if (normalizedStatus === 'driver_arrived') {
              setBanner('The driver is here');
              console.log('[ActiveRide] Banner set: The driver is here');
            } else if (normalizedStatus === 'in_progress') {
              setBanner('Your trip has started');
              console.log('[ActiveRide] Banner set: Your trip has started');
            } else if (normalizedStatus === 'paused') {
              setBanner('Your trip has been put on hold');
              console.log(
                '[ActiveRide] Banner set: Your trip has been put on hold'
              );
            } else if (normalizedStatus === 'resumed') {
              setBanner('Your trip has resumed');
              console.log('[ActiveRide] Banner set: Your trip has resumed');
            } else if (normalizedStatus === 'completed') {
              setBanner('Trip completed!');
              setShowInvoice(true);
              console.log('[ActiveRide] Banner set: Trip completed!');
            }
          } else if (
            data.type === 'driver_location_update' &&
            data.driver_id === currentRide?.driverId
          ) {
            // Update driver location
            const newDriverLocation: LocationType = {
              latitude: data.location.latitude,
              longitude: data.location.longitude,
              address: '',
            };
            updateDriverLocation(newDriverLocation);
          }
        } catch (e) {
          console.error('[ActiveRide] Error parsing WebSocket message:', e);
        }
      };
      ws.onerror = (e) => {
        // Optionally handle errors
      };
      ws.onclose = () => {
        wsRef.current = null;
      };
      return () => {
        ws.close();
      };
    }
  }, []);

  // Listen for ride status updates as soon as bookingId is available
  useEffect(() => {
    const bookingId = rideState.bookingDetails.bookingId;
    if (!bookingId) return;
    const handleRideUpdate = (update: any) => {
      console.log('[ActiveRideScreen] handleRideUpdate called with:', update);
      // If update is a ride object
      if (update.id === bookingId && update.status) {
        let status = update.status;
        if (status === 'arrived_at_pickup') status = 'driver_arrived';
        console.log(
          '[ActiveRideScreen] Updating rideStatus from direct ride object:',
          status
        );
        setRideStatus(status);
        return;
      }
      // If update is { ride: { ... } }
      if (update.ride && update.ride.id === bookingId) {
        let status = update.ride.status;
        if (status === 'arrived_at_pickup') status = 'driver_arrived';
        console.log(
          '[ActiveRideScreen] Updating rideStatus from update.ride:',
          status
        );
        setRideStatus(status);
        return;
      }
      // If update is { booking_id, status }
      if (update.booking_id === bookingId && update.status) {
        let status = update.status;
        if (status === 'arrived_at_pickup') status = 'driver_arrived';
        console.log(
          '[ActiveRideScreen] Updating rideStatus from booking_id/status:',
          status
        );
        setRideStatus(status);
        return;
      }
    };
    rideService.addRideUpdateListener(handleRideUpdate);
    return () => {
      rideService.removeRideUpdateListener(handleRideUpdate);
    };
  }, [rideState.bookingDetails.bookingId]);

  // Start location tracking when driver is assigned
  useEffect(() => {
    if (rideStatus === 'driver_assigned' && currentRide?.driverId) {
      startLocationTracking();
    }

    // Cleanup location subscription
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [rideStatus, currentRide?.driverId]);

  const fetchRideDetails = async (bookingId: string) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      });

      if (response.ok) {
        const bookingData = await response.json();
        console.log('[ActiveRide] Booking details:', bookingData);

        // Convert booking data to Ride format
        const ride: Ride = {
          id: bookingData.id,
          riderId: user?.id || '',
          driverId: bookingData.driver_id,
          pickup: {
            latitude: JSON.parse(bookingData.pickup_location).lat,
            longitude: JSON.parse(bookingData.pickup_location).lng,
            address: rideState.bookingDetails.pickup?.description || '',
          },
          destination: {
            latitude: JSON.parse(bookingData.dropoff_location).lat,
            longitude: JSON.parse(bookingData.dropoff_location).lng,
            address: rideState.bookingDetails.dropoff?.description || '',
          },
          status: bookingData.status as RideStatus,
          fare: bookingData.fare,
          distance: rideState.bookingDetails.distance || 0,
          duration: rideState.bookingDetails.duration || 0,
          createdAt: new Date(bookingData.booking_time),
        };

        setCurrentRide(ride);
        setRideStatus(ride.status);

        // Fetch driver info
        if (bookingData.driver_id) {
          fetchDriverInfo(bookingData.driver_id);
        }
      }
    } catch (error) {
      console.error('[ActiveRide] Error fetching ride details:', error);
    }
  };

  const fetchDriverInfo = async (driverId: string) => {
    try {
      const response = await fetch(`${API_URL}/driver/${driverId}`, {
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      });

      if (response.ok) {
        const driverData = await response.json();
        setDriverInfo(driverData);

        // Set driver location from driver data
        if (driverData.location) {
          setDriverLocation({
            latitude: driverData.location.latitude,
            longitude: driverData.location.longitude,
            address: '',
          });
        }
      }
    } catch (error) {
      console.error('[ActiveRide] Error fetching driver info:', error);
    }
  };

  // Start tracking passenger location
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
          const newLocation: LocationType = {
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
      console.error('[ActiveRide] Error starting location tracking:', error);
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (loc1: LocationType, loc2: LocationType) => {
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

  // Update driver location from WebSocket
  const updateDriverLocation = (location: LocationType) => {
    setDriverLocation(location);
    if (passengerLocation) {
      calculateDistance(passengerLocation, location);
    }
  };

  const handleStartRide = async () => {
    try {
      const response = await fetch(
        `${API_URL}/bookings/${currentRide?.id}/start`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        setRideStatus('in_progress');
        Alert.alert('Ride Started', 'Your ride is now in progress!');
      } else {
        Alert.alert('Error', 'Failed to start ride');
      }
    } catch (error) {
      console.error('[ActiveRide] Error starting ride:', error);
      Alert.alert('Error', 'Failed to start ride');
    }
  };

  const handlePauseRide = async () => {
    try {
      const response = await fetch(
        `${API_URL}/bookings/${currentRide?.id}/pause`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        setRideStatus('paused');
        Alert.alert('Ride Paused', 'Your ride has been paused.');
      } else {
        Alert.alert('Error', 'Failed to pause ride');
        console.log('[ActiveRide] Error pausing ride:', response);
      }
    } catch (error) {
      console.error('[ActiveRide] Error pausing ride:', error);
      Alert.alert('Error', 'Failed to pause ride');
    }
  };

  const handleResumeRide = async () => {
    try {
      const response = await fetch(
        `${API_URL}/bookings/${currentRide?.id}/resume`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        setRideStatus('in_progress');
        Alert.alert('Ride Resumed', 'Your ride has been resumed.');
      } else {
        Alert.alert('Error', 'Failed to resume ride');
      }
    } catch (error) {
      console.error('[ActiveRide] Error resuming ride:', error);
      Alert.alert('Error', 'Failed to resume ride');
    }
  };

  const handleCompleteRide = async () => {
    try {
      const response = await fetch(
        `${API_URL}/bookings/${currentRide?.id}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        setRideStatus('completed');
        Alert.alert('Ride Completed', 'Your ride has been completed!');
        // Navigate to payment screen
        router.push('/Ride/payment');
      } else {
        Alert.alert('Error', 'Failed to complete ride');
      }
    } catch (error) {
      console.error('[ActiveRide] Error completing ride:', error);
      Alert.alert('Error', 'Failed to complete ride');
    }
  };

  const handleCancelRide = async () => {
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel this ride?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${API_URL}/bookings/${currentRide?.id}/cancel`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${await getAuthToken()}`,
                },
              }
            );

            if (response.ok) {
              setRideStatus('cancelled');
              Alert.alert('Ride Cancelled', 'Your ride has been cancelled.');
              router.back();
            } else {
              Alert.alert('Error', 'Failed to cancel ride');
            }
          } catch (error) {
            console.error('[ActiveRide] Error cancelling ride:', error);
            Alert.alert('Error', 'Failed to cancel ride');
          }
        },
      },
    ]);
  };

  const pauseRide = async () => {
    try {
      const response = await fetch(
        `${API_URL}/bookings/${currentRide?.id}/pause`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        setRideStatus('paused');
        Alert.alert('Ride Paused', 'Your ride has been paused.');
      } else {
        Alert.alert('Error', 'Failed to pause ride');
      }
    } catch (error) {
      console.error('[ActiveRide] Error pausing ride:', error);
      Alert.alert('Error', 'Failed to pause ride');
    }
  };

  const resumeRide = async () => {
    try {
      const response = await fetch(
        `${API_URL}/bookings/${currentRide?.id}/resume`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        setRideStatus('in_progress');
        Alert.alert('Ride Resumed', 'Your ride has been resumed.');
      } else {
        Alert.alert('Error', 'Failed to resume ride');
      }
    } catch (error) {
      console.error('[ActiveRide] Error resuming ride:', error);
      Alert.alert('Error', 'Failed to resume ride');
    }
  };

  const confirmRide = () => {
    setShowInvoice(true);
  };

  const goToPayment = () => {
    setShowInvoice(false);
    setShowPayment(true);
  };

  if (!currentRide) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </SafeAreaView>
    );
  }

  const routeCoordinates = [currentRide.pickup, currentRide.destination];
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
    <SafeAreaView style={styles.container}>
      {banner === 'The driver is here' && (
        <View style={styles.arrivedBanner}>
          <Text style={styles.arrivedBannerText}>The driver is here</Text>
          <View style={styles.arrivedBannerLine} />
        </View>
      )}
      {banner && banner !== 'The driver is here' && (
        <View style={styles.statusOverlay}>
          <Text style={styles.statusOverlayText}>{banner}</Text>
        </View>
      )}
      <MapComponent
        routeCoordinates={routeCoordinates}
        currentLocation={driverLocation || currentRide.pickup}
        markers={markers}
      />
      {(rideStatus === 'in_progress' || rideStatus === 'paused') && (
        <View style={styles.bottomCard}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {rideStatus === 'in_progress' && (
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={handlePauseRide}
              >
                <Ionicons name="pause" size={20} color="#FFD700" />
                <Text style={styles.pauseButtonText}>Pause</Text>
              </TouchableOpacity>
            )}
            {rideStatus === 'paused' && (
              <TouchableOpacity
                style={styles.resumeButton}
                onPress={handleResumeRide}
              >
                <Ionicons name="play" size={20} color="#FFD700" />
                <Text style={styles.resumeButtonText}>Resume</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteRide}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.completeButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {rideStatus === 'completed' && !showInvoice && (
        <View style={styles.bottomCard}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => setShowInvoice(true)}
          >
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      )}
      {showInvoice && <InvoiceScreen ride={currentRide} />}
      {showPayment && <PaymentScreen />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  rideInfo: {
    padding: 16,
    backgroundColor: '#fff',
  },
  driverInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  phoneInfo: {
    fontSize: 14,
    color: '#666',
  },
  rideDetails: {
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    marginBottom: 4,
  },
  fareText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  actionButtons: {
    gap: 12,
  },
  statusOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
    zIndex: 10,
    alignItems: 'center',
  },
  statusOverlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Waiting overlay styles
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
  driverAvatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  driverDetails: {
    flex: 1,
  },
  driverNameSmall: {
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
  vehicleInfoSmall: {
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
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bookTripTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  driverName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  driverRating: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  vehicleInfo: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  rideTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  iconButton: {
    marginLeft: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  shareText: {
    marginLeft: 8,
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  bottomCardCompleted: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
  arrivedBanner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivedBannerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '400',
    marginBottom: 12,
    textAlign: 'center',
  },
  arrivedBannerLine: {
    width: '90%',
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  pauseButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  resumeButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#222',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});

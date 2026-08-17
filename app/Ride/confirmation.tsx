import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import MapComponent from '../../components/common/MapComponent';
import { RideStatusCard } from '../../components/common/RideStatusCard';
import { Driver, Ride, Location, MarkerData } from '../../types';
import { rideService } from '../../services/ride';
import { useRide, LocationDetails } from '../../hooks/useRideContext';
import { useAuth } from '../../hooks/AuthContext';
import { API_URL } from '../../config';
import { getAuthToken } from '../../services/auth';
import { FontAwesome } from '@expo/vector-icons';
import DriverWaitingScreen from '../../components/passenger/DriverWaitingScreen';

// Custom hook to wait for driver acceptance (WebSocket + polling fallback)
function useWaitForDriverAcceptance(
  rideId: string | number | undefined,
  onAccepted: (ride: any) => void,
  onRejected: () => void
) {
  useEffect(() => {
    if (!rideId) return;
    let polling: ReturnType<typeof setInterval> | null = null;
    let isActive = true;

    // Handler for WebSocket events
    const handleMessage = (data: any) => {
      console.log('[useWaitForDriverAcceptance] handleMessage', data);
      // Log the values and types being compared
      if (data.type === 'ride_update') {
        console.log(
          '[useWaitForDriverAcceptance] Comparing rideId:',
          String(rideId),
          'data.ride?.id:',
          String(data.ride?.id),
          'Equal:',
          String(data.ride?.id) === String(rideId)
        );
      }
      if (
        (data.type === 'ride_accepted' &&
          String(data.data?.id) === String(rideId)) ||
        (data.type === 'ride_update' &&
          String(data.ride?.id) === String(rideId) &&
          data.ride?.status === 'accepted')
      ) {
        if (isActive) {
          console.log('[useWaitForDriverAcceptance] onAccepted triggered');
          onAccepted(data.data || data.ride);
        }
      } else if (
        (data.type === 'driver_rejected' &&
          String(data.data?.id) === String(rideId)) ||
        (data.type === 'ride_update' &&
          String(data.ride?.id) === String(rideId) &&
          data.ride?.status === 'rejected')
      ) {
        if (isActive) {
          console.log('[useWaitForDriverAcceptance] onRejected triggered');
          onRejected();
        }
      }
    };
    rideService.addMessageHandler(handleMessage);

    // Polling fallback
    const poll = async () => {
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_URL}/bookings/${rideId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const ride = await res.json();
          if (ride.status === 'accepted') {
            if (isActive) onAccepted(ride);
          } else if (ride.status === 'rejected') {
            if (isActive) onRejected();
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };
    polling = setInterval(poll, 3000);

    return () => {
      isActive = false;
      rideService.removeMessageHandler(handleMessage);
      if (polling) clearInterval(polling);
    };
  }, [rideId, onAccepted, onRejected]);
}

export default function RideConfirmation() {
  const router = useRouter();
  const { rideState, updateBookingDetails } = useRide();
  const { user } = useAuth();
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<Driver[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([]);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);
  const [waitingForDriver, setWaitingForDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showWaitingScreen, setShowWaitingScreen] = useState(false);
  const [acceptedDriver, setAcceptedDriver] = useState<any>(null);

  // console.log(
  //   'RideConfirmation render: currentRide =',
  //   currentRide,
  //   'nearbyDrivers =',
  //   nearbyDrivers,
  //   'user =',
  //   user
  // );

  // Ensure ride service is set up with current user
  useEffect(() => {
    if (user) {
      // console.log(
      //   '[RideConfirmation] Setting up ride service with user:',
      //   user
      // );
      // Map 'passenger' role to 'rider' for the ride service
      const rideServiceUser = {
        ...user,
        role: 'rider' as const,
      };
      rideService.setCurrentUser(rideServiceUser);
    }
  }, [user]);

  useEffect(() => {
    // Use existing booking details instead of creating a new ride
    const initializeRide = async () => {
      const pickup = rideState.bookingDetails.pickup;
      const dropoff = rideState.bookingDetails.dropoff;
      const bookingId = rideState.bookingDetails.bookingId;

      //console.log(
      //  '[RideConfirmation] Initializing with booking details:',
      //  rideState.bookingDetails
      //);

      if (pickup && dropoff && bookingId) {
        try {
          const pickupLocation: Location = {
            latitude: pickup.coords.lat,
            longitude: pickup.coords.lng,
            address: pickup.description,
          };

          const destinationLocation: Location = {
            latitude: dropoff.coords.lat,
            longitude: dropoff.coords.lng,
            address: dropoff.description,
          };

          // Create a ride object from existing booking instead of making a new request
          const existingRide = {
            id: bookingId,
            riderId: user?.id || 'rider-123',
            pickup: pickupLocation,
            destination: destinationLocation,
            status: 'requested' as const,
            fare: rideState.bookingDetails.fare || 0,
            distance: rideState.bookingDetails.distance || 0,
            duration: rideState.bookingDetails.duration || 0,
            createdAt: new Date(),
          };

          console.log('[RideConfirmation] Using existing ride:', existingRide);
          setCurrentRide(existingRide);
          // Add the ride to rideService's activeRides map so it can be found by WebSocket updates
          rideService.setActiveRide(existingRide);
          setRouteCoordinates([pickupLocation, destinationLocation]);
        } catch (error) {
          console.error('[RideConfirmation] Error initializing ride:', error);
          Alert.alert('Error', 'Failed to initialize ride');
          router.replace('/Ride');
        }
      } else {
        console.log(
          '[RideConfirmation] Missing booking details, redirecting to Ride'
        );
        router.replace('/Ride');
      }
    };

    initializeRide();
  }, [rideState.bookingDetails, user]);

  useEffect(() => {
    if (!currentRide) return;

    const handleMessage = (data: any) => {
      // console.log('[RideConfirmation] WebSocket message received:', data);
      // console.log('[RideConfirmation] Current ride ID:', currentRide.id);
      // console.log('[RideConfirmation] Message type:', data.type);
      // console.log('[RideConfirmation] Message riderId:', data.riderId);
      // console.log(
      //   '[RideConfirmation] Current ride riderId:',
      //   currentRide.riderId
      // );

      if (
        data.type === 'rider_notification' &&
        data.riderId === currentRide.riderId
      ) {
        // console.log(
        //   '[RideConfirmation] Processing rider notification:',
        //   data.notificationType
        // );
        switch (data.notificationType) {
          case 'nearby_drivers':
            // console.log(
            //   '[RideConfirmation] Processing nearby_drivers notification'
            // );
            // console.log('[RideConfirmation] Raw driver data:', data.data);
            const mappedDrivers = data.data.map((driver: any) => ({
              id: driver.id,
              name: driver.name || 'Unknown Driver',
              phone: driver.phone || '',
              email: '',
              role: 'driver',
              isAvailable: driver.status === 'available',
              currentLocation: driver.location,
              vehicle: {
                make: driver.service_provider || 'Unknown',
                model: driver.vehicle_type || 'Unknown',
                year: 0,
                plateNumber: driver.license_number || '',
                type: driver.vehicle_type || 'bike',
              },
              rating: 5,
              earnings: 0,
              completedRides: 0,
              avatar_url: '',
            }));
            // console.log(
            //   '[RideConfirmation] Setting nearbyDrivers:',
            //   mappedDrivers
            // );
            setNearbyDrivers(mappedDrivers);
            break;
          case 'ride_accepted':
            // console.log(
            //   '[RideConfirmation] Processing ride_accepted notification'
            // );
            setCurrentRide(data.data);
            router.push('/Ride/active-ride');
            break;
          case 'driver_rejected':
            // console.log(
            //   '[RideConfirmation] Processing driver_rejected notification'
            // );
            Alert.alert('Driver Unavailable', 'Please select another driver');
            break;
          default:
          // console.log(
          //   '[RideConfirmation] Unknown notification type:',
          //   data.notificationType
          // );
        }
      } else {
        // console.log(
        //   '[RideConfirmation] Message not for this rider or wrong type'
        // );
      }
    };

    // console.log('[RideConfirmation] Adding WebSocket message handler');
    rideService.addMessageHandler(handleMessage);

    return () => {
      console.log('[RideConfirmation] Removing WebSocket message handler');
      rideService.removeMessageHandler(handleMessage);
    };
  }, [currentRide]);

  // Handler for driver acceptance/rejection after booking
  useWaitForDriverAcceptance(
    waitingForDriver ? currentRide?.id : undefined,
    (ride) => {
      console.log('[RideConfirmation] onAccepted called', ride);
      // Merge the new ride status with the previous ride's details
      setCurrentRide((prev) =>
        prev
          ? {
              ...prev,
              ...ride, // update status, driverId, etc.
              pickup: prev.pickup, // preserve pickup
              destination: prev.destination, // preserve destination
            }
          : null
      );
      setWaitingForDriver(false);
      setAcceptedDriver(ride.driver || selectedDriver);
      console.log('[RideConfirmation] Setting showWaitingScreen to true');
      setShowWaitingScreen(true);
    },
    () => {
      console.log('[RideConfirmation] onRejected called');
      setWaitingForDriver(false);
      Alert.alert('Driver Unavailable', 'Please select another driver');
    }
  );

  const handleDriverSelect = async (driver: Driver) => {
    setSelectedDriver(driver);
  };

  const handleCancelSelect = () => {
    setSelectedDriver(null);
  };

  const confirmBookingWithDriver = async (driver: Driver) => {
    try {
      console.log(
        '[RideConfirmation] Confirming booking with driver:',
        driver.id
      );

      // Use the correct bookingId from ride state/context
      const bookingId = rideState.bookingDetails.bookingId;
      if (!bookingId) {
        Alert.alert('Error', 'No booking ID found. Please try again.');
        return;
      }

      // Update the booking with the selected driver
      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/assign-driver`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getAuthToken('passenger')}`,
          },
          body: JSON.stringify({
            driver_id: driver.id,
          }),
        }
      );

      if (response.ok) {
        const bookingData = await response.json();
        console.log(
          '[RideConfirmation] Driver assigned successfully:',
          bookingData
        );

        // Update the current ride with driver info
        setCurrentRide((prev) =>
          prev
            ? {
                ...prev,
                driverId: driver.id,
                status: 'driver_assigned',
              }
            : null
        );
        setWaitingForDriver(true); // Start waiting for driver response
        // router.push('/Ride/active-ride'); // Now handled by hook
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to assign driver');
      }
    } catch (error) {
      console.error('[RideConfirmation] Error confirming booking:', error);
      Alert.alert('Error', 'Failed to confirm booking');
    }
  };

  // Function to fetch nearby drivers via REST API
  const fetchNearbyDrivers = async () => {
    if (!currentRide) return;

    try {
      console.log('[RideConfirmation] Fetching nearby drivers via REST API');
      const response = await fetch(`${API_URL}/demand/nearby-drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: currentRide.pickup.latitude,
          longitude: currentRide.pickup.longitude,
          radius: 5, // 5km radius
        }),
      });

      if (response.ok) {
        const drivers = await response.json();
        //console.log('[RideConfirmation] REST API drivers received:', drivers);

        const mappedDrivers = drivers.map((driver: any) => ({
          id: driver.id,
          name: driver.name || 'Unknown Driver',
          phone: driver.phone || '',
          email: '',
          role: 'driver',
          isAvailable: driver.status === 'available',
          currentLocation: driver.location,
          vehicle: {
            make: driver.service_provider || 'Unknown',
            model: driver.vehicle_type || 'Unknown',
            year: 0,
            plateNumber: driver.license_number || '',
            type: driver.vehicle_type || 'bike',
          },
          rating: 5,
          earnings: 0,
          completedRides: 0,
          avatar_url: '',
        }));

        setNearbyDrivers(mappedDrivers);
      } else {
        console.error(
          '[RideConfirmation] Failed to fetch nearby drivers:',
          response.status
        );
      }
    } catch (error) {
      console.error('[RideConfirmation] Error fetching nearby drivers:', error);
    }
  };

  // Start polling for nearby drivers
  useEffect(() => {
    if (currentRide) {
      // Initial fetch
      fetchNearbyDrivers();

      // Set up polling every 10 seconds
      const interval = setInterval(fetchNearbyDrivers, 10000);
      setPollingInterval(interval);

      console.log('[RideConfirmation] Started polling for nearby drivers');

      return () => {
        if (interval) {
          clearInterval(interval);
          console.log('[RideConfirmation] Stopped polling for nearby drivers');
        }
      };
    }
  }, [currentRide]);

  if (!currentRide) return null;

  //console.log('[RideConfirmation] waitingForDriver:', waitingForDriver);
  //console.log('Rendering RideStatusCard with nearbyDrivers:', nearbyDrivers);

  // Show waiting screen when driver accepts
  if (showWaitingScreen && acceptedDriver && currentRide) {
    console.log('[RideConfirmation] Rendering DriverWaitingScreen');
    console.log('[RideConfirmation] showWaitingScreen:', showWaitingScreen);
    console.log('[RideConfirmation] acceptedDriver:', acceptedDriver);
    console.log('[RideConfirmation] currentRide:', currentRide);
    return (
      <DriverWaitingScreen
        driverInfo={acceptedDriver}
        pickupLocation={currentRide.pickup}
        destinationLocation={currentRide.destination}
        onDriverArrived={() => {
          console.log('[RideConfirmation] onDriverArrived callback called!');
          console.log('[RideConfirmation] Setting showWaitingScreen to false');
          setShowWaitingScreen(false);
          console.log('[RideConfirmation] Navigating to /Ride/active-ride');
          router.push('/Ride/active-ride');
        }}
        onCancelRide={() => {
          setShowWaitingScreen(false);
          setWaitingForDriver(false);
          setAcceptedDriver(null);
          // Handle ride cancellation
          Alert.alert('Ride Cancelled', 'Your ride has been cancelled.');
        }}
      />
    );
  }

  const driverMarkers: MarkerData[] = nearbyDrivers.map((driver) => ({
    id: driver.id,
    coordinate: driver.currentLocation || currentRide.pickup,
    title: driver.name,
    description: `${driver.vehicle.make} ${driver.vehicle.model} - ${driver.vehicle.plateNumber}`,
    onPress: () => handleDriverSelect(driver),
  }));

  if (waitingForDriver) {
    return (
      <View style={styles.container}>
        <MapComponent
          routeCoordinates={routeCoordinates}
          currentLocation={currentRide.pickup}
          markers={driverMarkers}
        />
        <RideStatusCard
          ride={currentRide}
          nearbyDrivers={nearbyDrivers}
          onDriverSelect={handleDriverSelect}
          onRefreshDrivers={fetchNearbyDrivers}
        />
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 10,
              elevation: 4,
            }}
          >
            <Text
              style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}
            >
              Waiting for driver to accept...
            </Text>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapComponent
        routeCoordinates={routeCoordinates}
        currentLocation={currentRide.pickup}
        markers={driverMarkers}
      />
      {/* Show driver card if a driver is selected */}
      {selectedDriver && (
        <View style={styles.bottomCard}>
          <Text style={styles.bookTripTitle}>BOOK TRIP</Text>
          <View style={styles.driverRow}>
            <Image
              source={{
                uri:
                  selectedDriver.avatar_url ||
                  'https://randomuser.me/api/portraits/men/32.jpg',
              }}
              style={styles.driverAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{selectedDriver.name}</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginVertical: 2,
                }}
              >
                <FontAwesome name="star" size={14} color="#FFD700" />
                <Text style={styles.driverRating}>
                  {selectedDriver.rating || '5.0'}
                </Text>
              </View>
              <Text style={styles.vehicleInfo}>
                {selectedDriver.vehicle.model || 'Moto'} -{' '}
                {selectedDriver.vehicle.plateNumber || 'PL8S'}
              </Text>
              <Text style={styles.rideTime}>KG 18 Ave 8:00 AM</Text>
            </View>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="comment" size={20} color="#FFD700" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="phone" size={20} color="#FFD700" />
            </TouchableOpacity>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSelect}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bookNowButton}
              onPress={() => confirmBookingWithDriver(selectedDriver)}
            >
              <Text style={styles.bookNowText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* If no driver selected, show the list or map as usual */}
      {!selectedDriver && (
        <RideStatusCard
          ride={currentRide}
          nearbyDrivers={nearbyDrivers}
          onDriverSelect={handleDriverSelect}
          onRefreshDrivers={fetchNearbyDrivers}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000', // changed to black
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
    color: '#FFD700', // yellow
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
    color: '#fff', // white
  },
  driverRating: {
    marginLeft: 4,
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  vehicleInfo: {
    fontSize: 13,
    color: '#FFD700', // yellow
    marginTop: 2,
  },
  rideTime: {
    fontSize: 12,
    color: '#FFD700', // yellow
    marginTop: 2,
  },
  iconButton: {
    marginLeft: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#222', // dark background
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#222', // dark background
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: '#FFD700', // yellow
    fontWeight: 'bold',
    fontSize: 15,
  },
  bookNowButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginLeft: 8,
  },
  bookNowText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

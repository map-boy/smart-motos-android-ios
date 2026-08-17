import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  NetworkProvider,
  useNetwork,
} from '@/components/common/NetworkProvider';
import MapComponent from '@/components/common/MapComponent';
import { spacing, typography, borderRadius } from '@/styles/theme';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import { colors } from '@/styles/theme';
import { Menu } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '@/config';
import { getAuthToken } from '@/services/auth';
import { rideService } from '@/services/ride';
import { useAuth } from '@/hooks/AuthContext';

// Define a type for ride request data
interface RideRequest {
  id: string;
  riderName: string;
  rating: number;
  fare: string;
  distance: string;
  pickup: string;
  dropoff: string;
  pickupCoords: { latitude: number; longitude: number };
  dropoffCoords: { latitude: number; longitude: number };
  passenger_id: number;
  booking_id: number;
}

function RidesScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rideRequestState, setRideRequestState] = useState('idle'); // 'idle', 'scanning', 'requests_available', 'request_details'
  const [availableRequests, setAvailableRequests] = useState<RideRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RideRequest | null>(
    null
  );
  const networkState = useNetwork();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const router = useRouter();
  const { user } = useAuth();

  // Stats data
  const stats = {
    acceptance: 95.0,
    rating: 4.75,
    cancellation: 2.0,
  };

  // Route data (simplified for demo)
  const routeCoordinates = [
    { latitude: -1.944, longitude: 30.0618 }, // Example coordinates (Kigali area)
    { latitude: -1.95, longitude: 30.07 },
    { latitude: -1.955, longitude: 30.08 },
    { latitude: -1.96, longitude: 30.09 },
    { latitude: -1.965, longitude: 30.1 },
  ];

  // Route info
  const routeInfo = [
    { time: '56 min', distance: 'km', position: 'top' },
    { time: '58 min', distance: '24.4 km', position: 'middle' },
    { time: '56 min', distance: '25 km', position: 'bottom' },
  ];

  // Setup WebSocket connection for real-time ride requests
  useEffect(() => {
    if (user && isOnline) {
      // Map 'driver' role to 'driver' for the ride service
      const rideServiceUser = {
        ...user,
        role: 'driver' as const,
      };
      rideService.setCurrentUser(rideServiceUser);
    }
  }, [user, isOnline]);

  // Listen for WebSocket messages (ride requests)
  useEffect(() => {
    if (!isOnline) return;

    const handleMessage = (data: any) => {
      console.log('[DriverRides] WebSocket message received:', data);

      if (data.type === 'driver_notification' && data.driverId === user?.id) {
        if (data.data?.type === 'ride_request') {
          const booking = data.data.booking;
          const rideRequest: RideRequest = {
            id: booking.id.toString(),
            riderName: booking.passenger_name || 'Unknown Rider',
            rating: 5, // Default rating
            fare: `$${booking.fare}`,
            distance: 'Calculating...', // Will be calculated
            pickup: booking.pickup_location?.address || 'Pickup location',
            dropoff: booking.dropoff_location?.address || 'Dropoff location',
            pickupCoords: {
              latitude: booking.pickup_location?.latitude || 0,
              longitude: booking.pickup_location?.longitude || 0,
            },
            dropoffCoords: {
              latitude: booking.dropoff_location?.latitude || 0,
              longitude: booking.dropoff_location?.longitude || 0,
            },
            passenger_id: booking.passenger_id,
            booking_id: booking.id,
          };

          // Add to available requests
          setAvailableRequests((prev) => [...prev, rideRequest]);
          setRideRequestState('requests_available');
        }
      }
    };

    rideService.addMessageHandler(handleMessage);

    return () => {
      rideService.removeMessageHandler(handleMessage);
    };
  }, [isOnline, user]);

  useEffect(() => {
    // Auto-switch to offline mode when network is disconnected
    if (!networkState.isConnected) {
      setIsOnline(false);
    }

    // Request location permissions
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, [networkState.isConnected]);

  const toggleOnlineStatus = () => {
    // Only allow going online if network is connected
    if (!isOnline && !networkState.isConnected) {
      Alert.alert(
        'Network Required',
        'You need an internet connection to go online'
      );
      return;
    }
    setIsOnline(!isOnline);

    if (isOnline) {
      // Going offline - clear any pending requests
      setAvailableRequests([]);
      setRideRequestState('idle');
      setSelectedRequest(null);
    }
  };

  const handleHailRide = async () => {
    setRideRequestState('scanning');

    try {
      // Fetch bookings assigned to the driver and are pending/driver_assigned
      const token = await getAuthToken('driver');
      const response = await fetch(`${API_URL}/driver/my-bookings`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const myBookings = await response.json();
        console.log('[DriverRides] My assigned bookings:', myBookings);

        const rideRequests: RideRequest[] = myBookings.map((booking: any) => {
          // If pickup_location and dropoff_location are objects, use as-is; if strings, try to parse
          let pickupObj = booking.pickup_location;
          let dropoffObj = booking.dropoff_location;
          if (typeof pickupObj === 'string') {
            try {
              pickupObj = JSON.parse(pickupObj);
            } catch {
              pickupObj = {};
            }
          }
          if (typeof dropoffObj === 'string') {
            try {
              dropoffObj = JSON.parse(dropoffObj);
            } catch {
              dropoffObj = {};
            }
          }
          return {
            id: booking.id.toString(),
            riderName: booking.passenger?.name || 'Unknown Rider',
            rating: 5, // Default rating
            fare: booking.fare ? `$${booking.fare}` : 'N/A',
            distance: 'Calculating...', // Will be calculated
            pickup: pickupObj.address || 'Pickup location',
            dropoff: dropoffObj.address || 'Dropoff location',
            pickupCoords: {
              latitude: pickupObj.latitude ?? pickupObj.lat ?? 0,
              longitude: pickupObj.longitude ?? pickupObj.lng ?? 0,
            },
            dropoffCoords: {
              latitude: dropoffObj.latitude ?? dropoffObj.lat ?? 0,
              longitude: dropoffObj.longitude ?? dropoffObj.lng ?? 0,
            },
            passenger_id: booking.passenger_id,
            booking_id: booking.id,
          };
        });

        setAvailableRequests(rideRequests);
        setRideRequestState('requests_available');
      } else {
        console.error('[DriverRides] Failed to fetch my bookings');
        console.log(response);
        console.log(token);
        setRideRequestState('idle');
      }
    } catch (error) {
      console.error('[DriverRides] Error fetching pending bookings:', error);
      console.log(error);
      setRideRequestState('idle');
    }
  };

  const handleMarkerPress = (request: RideRequest) => {
    setSelectedRequest(request);
    setRideRequestState('request_details');
  };

  const handleReject = async () => {
    if (selectedRequest) {
      try {
        const token = await getAuthToken();
        const response = await fetch(
          `${API_URL}/bookings/${selectedRequest.booking_id}/reject`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          console.log('[DriverRides] Ride rejected successfully');
          // Remove from available requests
          setAvailableRequests((prev) =>
            prev.filter((req) => req.id !== selectedRequest.id)
          );
        } else {
          console.error('[DriverRides] Failed to reject ride');
        }
      } catch (error) {
        console.error('[DriverRides] Error rejecting ride:', error);
      }
    }

    setSelectedRequest(null);
    setRideRequestState('scanning'); // Go back to scanning for other requests
  };

  const handleAccept = async () => {
    if (selectedRequest) {
      try {
        const token = await getAuthToken('driver');
        const response = await fetch(
          `${API_URL}/driver/accept-booking/${selectedRequest.booking_id}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          console.log('[DriverRides] Ride accepted successfully');

          // Navigate to the navigate-pickup screen with ride data
          router.push({
            pathname: '/driver/rides/navigate-pickup',
            params: {
              rideData: JSON.stringify(selectedRequest),
              bookingId: selectedRequest.booking_id.toString(),
            },
          });

          // Reset state after accepting
          setRideRequestState('idle');
          setAvailableRequests([]);
          setSelectedRequest(null);
        } else {
          let errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText };
          }
          Alert.alert('Error', errorData.error || 'Failed to accept ride');
          console.log(errorData);
        }
      } catch (error) {
        console.error('[DriverRides] Error accepting ride:', error);
        Alert.alert('Error', 'Failed to accept ride');
      }
    }
  };

  const renderRideRequestDetails = () => {
    if (!selectedRequest) return null;

    return (
      <View style={styles.rideRequestContainer}>
        <View style={styles.rideRequestHeader}>
          <Text style={styles.rideRequestTitle}>Ride Request</Text>
        </View>

        <View style={styles.riderInfo}>
          {/* Replace with actual rider image */}
          <Image
            source={{
              uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-05-02%20215507-YaoGHTbbSX0Yy08KmjYtLH34ltoiYQ.png',
            }}
            style={styles.riderImage}
          />
          <View style={styles.riderDetails}>
            <Text style={styles.riderName}>{selectedRequest.riderName}</Text>
            <View style={styles.ratingContainer}>
              {[...Array(selectedRequest.rating)].map((_, index) => (
                <FontAwesome
                  key={index}
                  name="star"
                  size={16}
                  color={colors.primary.main}
                />
              ))}
              {[...Array(5 - selectedRequest.rating)].map((_, index) => (
                <FontAwesome
                  key={index + selectedRequest.rating}
                  name="star-o"
                  size={16}
                  color={colors.primary.main}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.rideRequestInfo}>
          <View style={styles.infoRow}>
            <FontAwesome name="money" size={18} color={colors.text.primary} />
            <Text style={styles.infoText}>{selectedRequest.fare}</Text>
          </View>
          <View style={styles.infoRow}>
            <FontAwesome name="road" size={18} color={colors.text.primary} />
            <Text style={styles.infoText}>{selectedRequest.distance}</Text>
          </View>
        </View>

        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Pickup</Text>
          <Text style={styles.locationText}>{selectedRequest.pickup}</Text>
          <Text style={styles.locationLabel}>Dropoff</Text>
          <Text style={styles.locationText}>{selectedRequest.dropoff}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleReject}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : (
        <>
          <MapComponent
            routeCoordinates={routeCoordinates}
            currentLocation={
              location?.coords
                ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }
                : null
            }
            markers={
              rideRequestState === 'requests_available'
                ? availableRequests.map((request) => ({
                    id: request.id,
                    coordinate: {
                      latitude: request.pickupCoords.latitude,
                      longitude: request.pickupCoords.longitude,
                    },
                    title: request.riderName,
                    description: `Fare: ${request.fare}, Distance: ${request.distance}`,
                    onPress: () => handleMarkerPress(request),
                  }))
                : []
            }
          />

          {/* Top Info Bar */}
          <View style={styles.topInfoContainer}>
            <View style={styles.hamburgerContainer}>
              <FloatingActionButton
                icon={<Menu color={colors.text.primary} size={24} />}
                position="top-left"
                backgroundColor={colors.background.paper}
                onPress={() => navigation.openDrawer()}
                style={styles.menuButton}
              />
            </View>

            {/* Time and Distance Box (conditionally visible) */}
            {rideRequestState !== 'requests_available' &&
              rideRequestState !== 'request_details' && (
                <View style={styles.timeDistanceBox}>
                  <View style={styles.carIconContainer}>
                    <Ionicons name="car" size={18} color="#555" />
                  </View>
                  <View>
                    <Text style={styles.timeText}>{routeInfo[0].time}</Text>
                    <Text style={styles.distanceText}>
                      {routeInfo[0].distance}
                    </Text>
                  </View>
                </View>
              )}

            <TouchableOpacity style={styles.profileButton}>
              <Image
                source={{
                  uri: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-05-02%20215507-YaoGHTbbSX0Yy08KjuYtLH34ltoiYQ.png',
                }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>

          {/* Middle Info Box (conditionally visible) */}
          {rideRequestState !== 'requests_available' &&
            rideRequestState !== 'request_details' && (
              <View style={styles.middleInfoBox}>
                <View style={styles.carIconContainer}>
                  <Ionicons name="car" size={18} color="#555" />
                </View>
                <View>
                  <Text style={styles.timeText}>{routeInfo[1].time}</Text>
                  <Text style={styles.distanceText}>
                    {routeInfo[1].distance}
                  </Text>
                </View>
              </View>
            )}

          {/* Bottom Info Box (conditionally visible) */}
          {rideRequestState !== 'requests_available' &&
            rideRequestState !== 'request_details' && (
              <View style={styles.bottomInfoBox}>
                <View style={styles.carIconContainer}>
                  <Ionicons name="car" size={18} color="#555" />
                </View>
                <View>
                  <Text style={styles.timeText}>{routeInfo[2].time}</Text>
                  <Text style={styles.distanceText}>
                    {routeInfo[2].distance}
                  </Text>
                </View>
              </View>
            )}

          {/* Status Buttons / Hail Ride / Scanning (conditionally visible) */}
          <View style={styles.statusButtonsContainer}>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#000' }]}
              onPress={toggleOnlineStatus}
            >
              <FontAwesome name="user" size={20} color="#FFD700" />
              <Text style={styles.statusText}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </TouchableOpacity>

            {rideRequestState === 'idle' && isOnline && (
              <TouchableOpacity
                style={styles.hailRideButton}
                onPress={handleHailRide}
              >
                <Text style={styles.hailRideText}>hail ride</Text>
              </TouchableOpacity>
            )}

            {rideRequestState === 'scanning' && (
              <View style={styles.scanningContainer}>
                <Text style={styles.scanningText}>Scanning...</Text>
              </View>
            )}

            {/* Zoom Button (always visible) */}
            <TouchableOpacity style={styles.zoomButton}>
              <Ionicons name="locate" size={24} color="#555" />
            </TouchableOpacity>
          </View>

          {/* Bottom Panel (conditionally visible) */}
          {rideRequestState === 'idle' && (
            <View style={styles.bottomPanel}>
              <View style={styles.bottomPanelHandle} />

              <Text
                style={[
                  styles.connectionStatus,
                  { color: isOnline ? '#FFD700' : 'white' },
                ]}
              >
                {isOnline ? "You're back Online" : 'You are currently offline'}
              </Text>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <FontAwesome name="check" size={20} color="#FFD700" />
                  </View>
                  <Text style={styles.statValue}>{stats.acceptance}%</Text>
                  <Text style={styles.statLabel}>Acceptance</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <FontAwesome name="star" size={20} color="#FFD700" />
                  </View>
                  <Text style={styles.statValue}>{stats.rating}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <FontAwesome name="times" size={20} color="#FF0000" />
                  </View>
                  <Text style={styles.statValue}>{stats.cancellation}%</Text>
                  <Text style={styles.statLabel}>Cancellation</Text>
                </View>
              </View>
            </View>
          )}

          {/* Ride Request Details View (conditionally rendered as a bottom sheet) */}
          {rideRequestState === 'request_details' && renderRideRequestDetails()}
        </>
      )}
    </SafeAreaView>
  );
}

// Add error styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: spacing.md,
  },
  menuButton: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topInfoContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  hamburgerContainer: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  timeDistanceBox: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  carIconContainer: {
    marginRight: 8,
  },
  timeText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  distanceText: {
    fontSize: 14,
    color: '#555',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  middleInfoBox: {
    position: 'absolute',
    left: 20,
    top: '50%',
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bottomInfoBox: {
    position: 'absolute',
    right: 20,
    bottom: 250,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  statusButtonsContainer: {
    position: 'absolute',
    bottom: 180,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 14,
  },
  statusText: {
    color: '#FFD700',
    marginTop: 4,
    fontSize: 12,
    fontFamily: typography.fontFamily.bold,
  },
  hailRideButton: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 20,
  },
  hailRideText: {
    color: 'white',
    fontFamily: typography.fontFamily.bold,
  },
  scanningContainer: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 20,
  },
  scanningText: {
    color: 'white',
    fontFamily: typography.fontFamily.bold,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  bottomPanelHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#555',
    borderRadius: 3,
    marginBottom: 15,
  },
  connectionStatus: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 5,
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'white',
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#333',
  },
  rideRequestContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  rideRequestHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rideRequestTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  riderImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    marginRight: spacing.md,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  rideRequestInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  locationInfo: {
    marginBottom: spacing.xl,
  },
  locationLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  locationText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary.contrastText,
  },
  rejectButton: {
    backgroundColor: colors.error.main,
    marginRight: spacing.md,
  },
  acceptButton: {
    backgroundColor: colors.primary.main,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.error.main,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
  },
});

export default RidesScreen;

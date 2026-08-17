import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RealTimeNavigation from '@/components/driver/RealTimeNavigation';
import { colors } from '@/styles/theme';
import { spacing, typography, borderRadius } from '@/styles/theme';
import { API_URL } from '@/config';
import { getAuthToken } from '@/services/auth';
import { Location } from '@/types';

interface RideData {
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

export default function NavigatePickupScreen() {
  // --- New State for backend booking status ---
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);

  const params = useLocalSearchParams();
  const router = useRouter();
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [rideStatus, setRideStatus] = useState<
    'navigating' | 'arrived' | 'started' | 'completed'
  >('navigating');
  const [isNavigatingToPickup, setIsNavigatingToPickup] = useState(true);

  useEffect(() => {
    if (params.rideData) {
      try {
        console.log('Received params.rideData:', params.rideData);
        const parsedRideData = JSON.parse(params.rideData as string);
        setRideData(parsedRideData);
        // Fetch booking status from backend
        fetchBookingStatus(parsedRideData.booking_id);
      } catch (error) {
        console.error('Error parsing ride data:', error);
        Alert.alert('Error', 'Invalid ride data');
        router.back();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.rideData]);

  // Helper to fetch booking status from backend
  const fetchBookingStatus = async (bookingId: number) => {
    try {
      const token = await getAuthToken();
      console.log(
        'Fetching booking status for bookingId:',
        bookingId,
        'with token:',
        token ? 'Present' : 'Missing'
      );
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched booking status:', data.status);
        setBookingStatus(data.status || null);
      } else {
        console.warn('Failed to fetch booking status. Response:', response);
        setBookingStatus(null);
      }
    } catch (err) {
      console.error('Error fetching booking status:', err);
      setBookingStatus(null);
    }
  };

  const handleArrivedAtPickup = async () => {
    if (!rideData) {
      console.warn('handleArrivedAtPickup called but rideData is null');
      return;
    }

    // Defensive: Only allow if bookingStatus is correct
    if (bookingStatus !== 'accepted' && bookingStatus !== 'en_route') {
      console.warn('Cannot mark arrival: bookingStatus is', bookingStatus);
      Alert.alert(
        'Cannot mark arrival',
        'Ride is not in the correct state to mark arrival.'
      );
      return;
    }

    setRideStatus('arrived');
    setIsNavigatingToPickup(false);

    try {
      const token = await getAuthToken('driver');
      console.log(
        'handleArrivedAtPickup: booking_id:',
        rideData.booking_id,
        'token:',
        token ? 'Present' : 'Missing'
      );
      console.log(
        'Making API request to:',
        `${API_URL}/bookings/${rideData.booking_id}/arrived`
      );

      const response = await fetch(
        `${API_URL}/bookings/${rideData.booking_id}/arrived`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Response is not JSON (likely HTML error page)
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        Alert.alert(
          'Server Error',
          'The server returned an error. Please check your connection and try again.'
        );
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        // Refresh backend status after marking arrival
        fetchBookingStatus(rideData.booking_id);
        Alert.alert(
          'Arrived at Pickup',
          'You have arrived at the pickup location'
        );
      } else {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        // Refresh backend status in case of error
        fetchBookingStatus(rideData.booking_id);
        Alert.alert(
          'Error',
          errorData.error ||
            errorData.message ||
            'Failed to update arrival status'
        );
      }
    } catch (error) {
      console.error('Error updating arrival status:', error);

      // Check if it's a JSON parse error
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        Alert.alert(
          'Server Error',
          'The server returned an invalid response. Please try again later.'
        );
      } else {
        Alert.alert(
          'Network Error',
          'Failed to connect to the server. Please check your internet connection.'
        );
      }
    }
  };

  const handleArrivedAtDropoff = async () => {
    if (!rideData) return;

    setRideStatus('completed');

    try {
      const token = await getAuthToken('driver');
      console.log(
        'Making API request to:',
        `${API_URL}driver/complete-booking/${rideData.booking_id}`
      );
      console.log('Booking ID:', rideData.booking_id);

      const response = await fetch(
        `${API_URL}/driver/complete-booking/${rideData.booking_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        Alert.alert(
          'Server Error',
          'The server returned an error. Please check your connection and try again.'
        );
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        Alert.alert('Ride Completed', 'Your ride has been completed!');
        router.push('/driver/rides');
      } else {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        Alert.alert(
          'Error',
          errorData.error || errorData.message || 'Failed to complete ride'
        );
      }
    } catch (error) {
      console.error('Error completing ride:', error);

      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        Alert.alert(
          'Server Error',
          'The server returned an invalid response. Please try again later.'
        );
      } else {
        Alert.alert(
          'Network Error',
          'Failed to connect to the server. Please check your internet connection.'
        );
      }
    }
  };

  const handleCancelNavigation = () => {
    Alert.alert(
      'Cancel Navigation',
      'Are you sure you want to cancel navigation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            if (!rideData) return;

            try {
              const token = await getAuthToken();
              console.log(
                'Making API request to:',
                `${API_URL}/bookings/${rideData.booking_id}/cancel`
              );
              console.log('Booking ID:', rideData.booking_id);

              const response = await fetch(
                `${API_URL}/bookings/${rideData.booking_id}/cancel`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              console.log('Response status:', response.status);

              // Check if response is JSON
              const contentType = response.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();
                console.error('Non-JSON response received:', textResponse);
                Alert.alert(
                  'Server Error',
                  'The server returned an error. Please check your connection and try again.'
                );
                return;
              }

              if (response.ok) {
                const data = await response.json();
                console.log('Success response:', data);
                Alert.alert('Ride Cancelled', 'The ride has been cancelled');
                router.push('/driver/rides');
              } else {
                const errorData = await response.json();
                console.error('API error response:', errorData);
                Alert.alert(
                  'Error',
                  errorData.error ||
                    errorData.message ||
                    'Failed to cancel ride'
                );
              }
            } catch (error) {
              console.error('Error cancelling ride:', error);

              if (
                error instanceof SyntaxError &&
                error.message.includes('JSON')
              ) {
                Alert.alert(
                  'Server Error',
                  'The server returned an invalid response. Please try again later.'
                );
              } else {
                Alert.alert(
                  'Network Error',
                  'Failed to connect to the server. Please check your internet connection.'
                );
              }
            }
          },
        },
      ]
    );
  };

  const handleStartRide = async () => {
    if (!rideData) return;

    try {
      const token = await getAuthToken('driver');
      console.log(
        'Making API request to:',
        `${API_URL}/bookings/${rideData.booking_id}/start`
      );
      console.log('Booking ID:', rideData.booking_id);

      const response = await fetch(
        `${API_URL}/bookings/${rideData.booking_id}/start`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse);
        Alert.alert(
          'Server Error',
          'The server returned an error. Please check your connection and try again.'
        );
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data);
        setRideStatus('started');
        Alert.alert('Ride Started', 'Your ride is now in progress!');
      } else {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        Alert.alert(
          'Error',
          errorData.error || errorData.message || 'Failed to start ride'
        );
      }
    } catch (error) {
      console.error('Error starting ride:', error);

      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        Alert.alert(
          'Server Error',
          'The server returned an invalid response. Please try again later.'
        );
      } else {
        Alert.alert(
          'Network Error',
          'Failed to connect to the server. Please check your internet connection.'
        );
      }
    }
  };

  if (!rideData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ride data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pickupLocation: Location = {
    latitude: rideData.pickupCoords.latitude,
    longitude: rideData.pickupCoords.longitude,
    address: rideData.pickup,
  };

  const dropoffLocation: Location = {
    latitude: rideData.dropoffCoords.latitude,
    longitude: rideData.dropoffCoords.longitude,
    address: rideData.dropoff,
  };

  return (
    <SafeAreaView style={styles.container}>
      <RealTimeNavigation
        pickupLocation={pickupLocation}
        dropoffLocation={dropoffLocation}
        isNavigatingToPickup={isNavigatingToPickup}
        onArrivedAtPickup={handleArrivedAtPickup}
        onArrivedAtDropoff={handleArrivedAtDropoff}
        onCancelNavigation={handleCancelNavigation}
        bookingStatus={bookingStatus}
      />

      {/* Ride Info Overlay */}
      <View style={styles.rideInfoOverlay}>
        <View style={styles.rideInfo}>
          <Text style={styles.riderName}>{rideData.riderName}</Text>
          <Text style={styles.rideDetails}>
            Fare: {rideData.fare} • Distance: {rideData.distance}
          </Text>
          <Text style={styles.rideStatus}>
            Status: {rideStatus.charAt(0).toUpperCase() + rideStatus.slice(1)}
          </Text>
        </View>

        {/* Action Buttons */}
        {rideStatus === 'arrived' && (
          <TouchableOpacity
            style={styles.startRideButton}
            onPress={handleStartRide}
          >
            <Ionicons name="play" size={20} color="#FFF" />
            <Text style={styles.startRideButtonText}>Start Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
  },
  rideInfoOverlay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rideInfo: {
    marginBottom: spacing.md,
  },
  riderName: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  rideDetails: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  rideStatus: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontWeight: '500',
  },
  startRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  startRideButtonText: {
    color: '#FFF',
    fontSize: typography.fontSize.md,
    fontWeight: '600',
  },
});

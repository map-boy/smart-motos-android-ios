import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';
import { useRide } from '@/hooks/useRideContext';
import MapboxService from '@/services/mapboxService';
import { createBooking } from '@/services/bookingService';

export default function FareEstimateScreen() {
  const { rideState, updateBookingDetails, setRideStatus } = useRide();
  const [loading, setLoading] = useState(false);
  const mapboxService = MapboxService.getInstance();

  // Get real booking details from context
  const { pickup, dropoff, distance, duration, fare } =
    rideState.bookingDetails;

  // Calculate real fare if not already calculated
  const calculateFare = async () => {
    console.log(
      'Fare estimate screen - booking details:',
      rideState.bookingDetails
    ); // Debug log
    console.log('Pickup:', pickup); // Debug log
    console.log('Dropoff:', dropoff); // Debug log

    if (!pickup?.coords || !dropoff?.coords) {
      console.log('Missing coordinates - pickup coords:', pickup?.coords); // Debug log
      console.log('Missing coordinates - dropoff coords:', dropoff?.coords); // Debug log

      if (!pickup) {
        Alert.alert(
          'Missing Pickup Location',
          'Please go back to the map and select a pickup location, or your current location will be used as pickup.',
          [
            {
              text: 'Go Back',
              onPress: () => router.back(),
            },
            {
              text: 'Use Current Location',
              onPress: () => {
                // This would need to be handled by going back to map screen
                router.back();
              },
            },
          ]
        );
      } else if (!dropoff) {
        Alert.alert(
          'Missing Dropoff Location',
          'Please go back to the map and select a dropoff location.',
          [
            {
              text: 'Go Back',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Pickup and dropoff locations are required.');
      }
      return;
    }

    if (fare) {
      // Fare already calculated, proceed
      console.log('Fare already calculated:', fare); // Debug log
      return;
    }

    setLoading(true);
    try {
      // Get route details from Mapbox
      const route = await mapboxService.getDirections(
        { latitude: pickup.coords.lat, longitude: pickup.coords.lng },
        { latitude: dropoff.coords.lat, longitude: dropoff.coords.lng }
      );

      if (route) {
        const distanceKm = route.distance / 1000; // Convert to km
        const durationMin = route.duration / 60; // Convert to minutes

        // Calculate fare based on distance and time
        // Base fare: 500 RWF, Distance rate: 200 RWF/km, Time rate: 50 RWF/min
        const baseFare = 500;
        const distanceFare = distanceKm * 200;
        const timeFare = durationMin * 50;
        const calculatedFare = Math.round(baseFare + distanceFare + timeFare);

        console.log('Calculated fare:', calculatedFare); // Debug log

        // Update booking details with real data
        updateBookingDetails({
          distance: distanceKm,
          duration: durationMin,
          fare: calculatedFare,
          polyline: route.coordinates
            .map((coord) => `${coord.latitude},${coord.longitude}`)
            .join('|'),
        });
      }
    } catch (error) {
      console.error('Error calculating fare:', error);
      Alert.alert('Error', 'Could not calculate fare. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Fare estimate screen mounted'); // Debug log
    console.log('Initial booking details:', rideState.bookingDetails); // Debug log
    console.log('Ride state status:', rideState.status); // Debug log

    calculateFare();
  }, []);

  // Re-calculate fare when pickup or dropoff changes
  useEffect(() => {
    if (pickup?.coords && dropoff?.coords && !fare) {
      console.log('Pickup or dropoff changed, recalculating fare'); // Debug log
      calculateFare();
    }
  }, [pickup?.coords, dropoff?.coords, fare]);

  const handleConfirm = async () => {
    if (!fare) {
      Alert.alert('Error', 'Please wait for fare calculation to complete.');
      return;
    }

    setLoading(true);

    try {
      // Prepare booking details
      // Only send required fields
      const bookingDetails: any = {
        pickup_location: pickup?.coords,
        dropoff_location: dropoff?.coords,
        payment_method: rideState.bookingDetails.paymentMethod || 'cash',
      };
      if (rideState.bookingDetails.bargainAmount) {
        bookingDetails.bargain_amount = rideState.bookingDetails.bargainAmount;
      }

      console.log('Booking payload being sent:', bookingDetails);
      const response = await createBooking(bookingDetails);
      console.log('Booking API response:', response);

      // Treat HTTP 201 or presence of booking_id as success
      if (response && (response.booking_id || response.status === 'pending')) {
        // Save bookingId to context
        updateBookingDetails({ bookingId: response.booking_id });
        setRideStatus('searching');
        router.push('/Ride/confirmation');
      } else {
        Alert.alert(
          'Booking Failed',
          response?.error || 'Could not create booking.'
        );
        console.log(response?.error);
        console.log(response);
        console.log(bookingDetails);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return 'Less than 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)} km`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fare Estimate</Text>

      <View style={styles.card}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Pickup:</Text>
            <Text style={styles.value} numberOfLines={2}>
              {pickup?.description || 'Selected location'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Drop-off:</Text>
            <Text style={styles.value} numberOfLines={2}>
              {dropoff?.description || 'Selected location'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Summary</Text>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Distance:</Text>
            <Text style={styles.value}>
              {distance ? formatDistance(distance) : 'Calculating...'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Duration:</Text>
            <Text style={styles.value}>
              {duration ? formatDuration(duration) : 'Calculating...'}
            </Text>
          </View>
        </View>

        <View style={styles.fareSection}>
          <Text style={styles.fareLabel}>Estimated Fare:</Text>
          <Text style={styles.fareAmount}>
            {fare ? `${fare.toLocaleString()} RWF` : 'Calculating...'}
          </Text>
        </View>
      </View>

      <Button
        title={loading ? 'Calculating...' : 'Confirm & Book'}
        onPress={handleConfirm}
        style={styles.button}
        disabled={loading || !fare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    padding: Layout.spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary.default,
    marginBottom: Layout.spacing.l,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 16,
    padding: Layout.spacing.l,
    marginBottom: Layout.spacing.xl,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
  },
  section: {
    marginBottom: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.m,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.s,
  },
  label: {
    fontSize: 16,
    color: Colors.neutral.dark,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: Colors.neutral.black,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  fareSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral.light,
    paddingTop: Layout.spacing.m,
    alignItems: 'center',
  },
  fareLabel: {
    fontSize: 16,
    color: Colors.neutral.dark,
    marginBottom: Layout.spacing.xs,
  },
  fareAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary.default,
  },
  button: {
    marginTop: Layout.spacing.xl,
  },
});

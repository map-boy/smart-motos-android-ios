import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import { useRide, BookingDetails } from '@/hooks/useRideContext';
import { ChevronLeft, Search } from 'lucide-react-native';
import { bookingService } from '@/services/bookingService';
import { LocationPicker } from '@/components/Pcommon/LocationPicker';
import MapboxService from '@/services/mapboxService';

// Dummy payment methods for demonstration
const PAYMENT_METHODS = [
  { label: 'Cash', value: 'cash' },
  { label: 'Mobile Money', value: 'mobile_money' },
  { label: 'Card', value: 'card' },
];

export default function BookRideScreen() {
  const { rideState, updateBookingDetails, setRideStatus } = useRide();
  const [loading, setLoading] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const mapboxService = MapboxService.getInstance();

  const handleLocationSelect = async (
    type: 'pickup' | 'dropoff',
    location: string,
    coordinates: { lat: number; lng: number }
  ) => {
    if (type === 'pickup') {
      setPickupCoords(coordinates);
      updateBookingDetails({
        pickup: { description: location, coords: coordinates },
      });
    } else {
      setDropoffCoords(coordinates);
      updateBookingDetails({
        dropoff: { description: location, coords: coordinates },
      });
    }

    // If both locations are selected, calculate route using Mapbox
    if (
      (type === 'pickup' && dropoffCoords) ||
      (type === 'dropoff' && pickupCoords)
    ) {
      const origin = type === 'pickup' ? coordinates : pickupCoords!;
      const destination = type === 'pickup' ? dropoffCoords! : coordinates;

      try {
        const route = await mapboxService.getDirections(
          { latitude: origin.lat, longitude: origin.lng },
          { latitude: destination.lat, longitude: destination.lng }
        );

        if (route) {
          updateBookingDetails({
            distance: route.distance / 1000, // Convert to km
            duration: route.duration / 60, // Convert to minutes
            polyline: JSON.stringify(route.coordinates), // Store route coordinates
          });
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    }
  };

  const handleDone = async () => {
    if (!pickupCoords || !dropoffCoords) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations');
      return;
    }

    if (!rideState.bookingDetails.paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    try {
      setLoading(true);
      const bookingPayload = {
        pickup_location: pickupCoords,
        dropoff_location: dropoffCoords,
        pickup_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        payment_method: rideState.bookingDetails.paymentMethod,
        bargain_amount: rideState.bookingDetails.bargainAmount,
      };
      console.log('Booking payload being sent:', bookingPayload);
      const booking = await bookingService.createBooking(bookingPayload);
      console.log('Booking response:', booking);

      updateBookingDetails({
        bookingId:
          typeof booking.booking_id === 'string' ||
          typeof booking.booking_id === 'number'
            ? booking.booking_id.toString()
            : undefined,
        driverId:
          typeof booking.driver_id === 'string' ||
          typeof booking.driver_id === 'number'
            ? booking.driver_id.toString()
            : (console.warn(
                'driver_id is undefined or null, skipping driverId assignment in updateBookingDetails. Value:',
                booking.driver_id
              ),
              undefined),
        fare: booking.fare,
        status: booking.status,
      });

      setRideStatus('booking_map');
      router.push('/Ride/confirmation');
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';

      if (errorMessage.includes('No available drivers nearby')) {
        Alert.alert(
          'No Drivers Available',
          'Sorry, there are no available drivers nearby. Please try again in a few moments.'
        );
      } else {
        Alert.alert(
          'Booking Error',
          'Failed to create your booking. Please check your details and try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BOOK RIDE</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <LocationPicker
            label="Pickup Location"
            placeholder="Enter pickup location"
            value={rideState.bookingDetails.pickup?.description ?? ''}
            onLocationSelect={(location, coords) =>
              handleLocationSelect('pickup', location, coords)
            }
            style={styles.input}
            labelStyle={styles.inputLabel}
          />

          <LocationPicker
            label="Drop-off Location"
            placeholder="Enter drop-off location"
            value={rideState.bookingDetails.dropoff?.description ?? ''}
            onLocationSelect={(location, coords) =>
              handleLocationSelect('dropoff', location, coords)
            }
            style={styles.input}
            labelStyle={styles.inputLabel}
          />

          {rideState.bookingDetails.distance && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoText}>
                Distance: {rideState.bookingDetails.distance.toFixed(1)} km
              </Text>
              <Text style={styles.routeInfoText}>
                Duration: {Math.round(rideState.bookingDetails.duration || 0)}{' '}
                mins
              </Text>
            </View>
          )}

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Mode of payment</Text>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={styles.paymentMethodItem}
                onPress={() =>
                  updateBookingDetails({ paymentMethod: method.value })
                }
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    rideState.bookingDetails.paymentMethod === method.value &&
                      styles.selectedPaymentMethodText,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Bargain Amount (Optional)</Text>
            <Input
              placeholder="Enter amount in RWF"
              value={rideState.bookingDetails.bargainAmount?.toString() || ''}
              onChangeText={(text) => {
                const amount = text ? parseFloat(text) : undefined;
                updateBookingDetails({ bargainAmount: amount });
              }}
              keyboardType="numeric"
              style={styles.fareInput}
            />
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomButtonContainer}>
        <Button
          title={loading ? 'Creating Booking...' : 'Confirm Booking'}
          onPress={handleDone}
          style={styles.doneButton}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.neutral.black,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    backgroundColor: Colors.neutral.black,
  },
  backButton: {
    padding: Layout.spacing.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.white,
  },
  searchButton: {
    padding: Layout.spacing.s,
  },
  content: {
    padding: Layout.spacing.xl,
  },
  input: {
    backgroundColor: Colors.neutral.white,
    color: Colors.neutral.black,
    borderRadius: Layout.borderRadius.m,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.m,
    marginBottom: Layout.spacing.m,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Layout.spacing.s,
    color: Colors.neutral.white,
  },
  routeInfo: {
    backgroundColor: Colors.neutral.dark,
    borderRadius: Layout.borderRadius.m,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.l,
  },
  routeInfoText: {
    color: Colors.neutral.white,
    fontSize: 14,
    marginBottom: Layout.spacing.xs,
  },
  sectionContainer: {
    marginTop: Layout.spacing.l,
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Layout.spacing.m,
    color: Colors.neutral.white,
  },
  paymentMethodItem: {
    paddingVertical: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.dark,
  },
  paymentMethodText: {
    fontSize: 16,
    color: Colors.neutral.light,
  },
  selectedPaymentMethodText: {
    fontWeight: 'bold',
    color: Colors.primary.default,
  },
  fareContainer: {
    marginBottom: Layout.spacing.xl,
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Layout.spacing.s,
    color: Colors.neutral.white,
  },
  fareInput: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Layout.borderRadius.m,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.m,
  },
  bottomButtonContainer: {
    padding: Layout.spacing.xl,
    backgroundColor: Colors.neutral.black,
  },
  doneButton: {
    width: '100%',
  },
});

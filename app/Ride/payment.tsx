import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import { useRide } from '../../hooks/useRideContext';
import { useAuth } from '../../hooks/AuthContext';
import { Ride } from '../../types';
import { API_URL, STRIPE_PUBLIC_KEY } from '../../config';
import { getAuthToken } from '../../services/auth';
import Button from '../../components/common/Button';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'mobile_money', label: 'Mobile Money', icon: '📱' },
  { id: 'card', label: 'Card', icon: '💳' },
];

export default function PaymentScreen() {
  const stripe = useStripe();
  const { rideState } = useRide();
  const { user } = useAuth();
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rideState.bookingDetails.bookingId) {
      fetchRideDetails(rideState.bookingDetails.bookingId);
    }
  }, []);

  const fetchRideDetails = async (bookingId: string) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${await getAuthToken()}`,
        },
      });

      if (response.ok) {
        const bookingData = await response.json();
        console.log('[Payment] Booking details:', bookingData);

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
          status: bookingData.status,
          fare: bookingData.fare,
          distance: rideState.bookingDetails.distance || 0,
          duration: rideState.bookingDetails.duration || 0,
          createdAt: new Date(bookingData.booking_time),
        };

        setCurrentRide(ride);
        setSelectedPaymentMethod(bookingData.payment_method || '');
      }
    } catch (error) {
      console.error('[Payment] Error fetching ride details:', error);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    // Stripe integration for card payments
    if (selectedPaymentMethod === 'card') {
      setLoading(true);
      try {
        // Get publishable key from config (or .env)
        const STRIPE_PUBLISHABLE_KEY = STRIPE_PUBLIC_KEY;
        if (!STRIPE_PUBLISHABLE_KEY) {
          Alert.alert('Stripe Error', 'Stripe publishable key not configured.');
          setLoading(false);
          return;
        }

        // Create payment intent on backend
        const paymentIntentRes = await fetch(
          `${API_URL}/bookings/${currentRide?.id}/create-payment-intent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await getAuthToken()}`,
            },
            body: JSON.stringify({
              amount: Math.round((currentRide?.fare || 0) * 104), // e.g. cents
            }),
          }
        );

        const paymentIntent = await paymentIntentRes.json();
        if (!paymentIntent.clientSecret) {
          Alert.alert(
            'Stripe Error',
            paymentIntent.error || 'Failed to create payment intent'
          );
          setLoading(false);
          return;
        }

        // Present PaymentSheet
        const initSheet = await stripe.initPaymentSheet({
          paymentIntentClientSecret: paymentIntent.clientSecret,
          merchantDisplayName: 'SmartMotos',
        });
        if (initSheet.error) {
          Alert.alert('Stripe Error', initSheet.error.message);
          setLoading(false);
          return;
        }
        const presentSheet = await stripe.presentPaymentSheet();
        if (presentSheet.error) {
          Alert.alert('Payment Failed', presentSheet.error.message);
          setLoading(false);
          return;
        }

        // Confirm payment on backend
        const confirmRes = await fetch(
          `${API_URL}/bookings/${currentRide?.id}/pay`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await getAuthToken()}`,
            },
            body: JSON.stringify({
              payment_method: selectedPaymentMethod,
              amount: currentRide?.fare,
              stripe_payment_intent: paymentIntent.id,
            }),
          }
        );

        if (confirmRes.ok) {
          Alert.alert(
            'Payment Successful',
            'Your payment has been processed successfully!',
            [
              {
                text: 'Rate Driver',
                onPress: () => router.push('/Ride/rating'),
              },
              {
                text: 'Done',
                onPress: () => router.push('/(tabs)'),
              },
            ]
          );
        } else {
          const errorData = await confirmRes.json();
          Alert.alert(
            'Payment Failed',
            errorData.error || 'Payment processing failed'
          );
        }
      } catch (error) {
        console.error('[Stripe Payment] Error:', error);
        Alert.alert('Error', 'Stripe payment failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fallback for other payment methods
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/bookings/${currentRide?.id}/pay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getAuthToken()}`,
          },
          body: JSON.stringify({
            payment_method: selectedPaymentMethod,
            amount: currentRide?.fare,
          }),
        }
      );

      if (response.ok) {
        const paymentData = await response.json();
        console.log('[Payment] Payment successful:', paymentData);

        Alert.alert(
          'Payment Successful',
          'Your payment has been processed successfully!',
          [
            {
              text: 'Rate Driver',
              onPress: () => router.push('/Ride/rating'),
            },
            {
              text: 'Done',
              onPress: () => router.push('/(tabs)'),
            },
          ]
        );
      } else {
        const errorData = await response.json();
        Alert.alert(
          'Payment Failed',
          errorData.error || 'Payment processing failed'
        );
      }
    } catch (error) {
      console.error('[Payment] Error processing payment:', error);
      Alert.alert('Error', 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  if (!currentRide) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLIC_KEY}
      merchantIdentifier="merchant.com.smartmotos"
      urlScheme="smartmotos"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.subtitle}>Complete your ride payment</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.rideSummary}>
            <Text style={styles.sectionTitle}>Ride Summary</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>From:</Text>
              <Text style={styles.summaryValue}>
                {currentRide.pickup.address}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>To:</Text>
              <Text style={styles.summaryValue}>
                {currentRide.destination.address}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Distance:</Text>
              <Text style={styles.summaryValue}>
                {currentRide.distance.toFixed(1)} km
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>
                {Math.round(currentRide.duration)} min
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Fare:</Text>
              <Text style={styles.fareAmount}>
                ${currentRide.fare.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  selectedPaymentMethod === method.id &&
                    styles.selectedPaymentMethod,
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                <Text style={styles.paymentIcon}>{method.icon}</Text>
                <Text
                  style={[
                    styles.paymentLabel,
                    selectedPaymentMethod === method.id &&
                      styles.selectedPaymentLabel,
                  ]}
                >
                  {method.label}
                </Text>
                {selectedPaymentMethod === method.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                ${currentRide.fare.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Platform Fee:</Text>
              <Text style={styles.totalValue}>
                ${(currentRide.fare * 0.04).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.finalTotal]}>
              <Text style={styles.finalTotalLabel}>Total:</Text>
              <Text style={styles.finalTotalValue}>
                ${(currentRide.fare * 1.04).toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            text={loading ? 'Processing...' : 'Pay Now'}
            onPress={handlePayment}
            variant="primary"
            size="large"
            disabled={loading || !selectedPaymentMethod}
          />
        </View>
      </SafeAreaView>
    </StripeProvider>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  rideSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  paymentSection: {
    marginBottom: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedPaymentMethod: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  paymentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentLabel: {
    flex: 1,
    fontSize: 16,
  },
  selectedPaymentLabel: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  totalSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 8,
    marginTop: 8,
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
});

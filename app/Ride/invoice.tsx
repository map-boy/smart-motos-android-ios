import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ride } from '../../types';

interface InvoiceScreenProps {
  ride?: Ride;
}

export default function InvoiceScreen({ ride }: InvoiceScreenProps) {
  // Use real ride data if available, otherwise fallback to placeholder
  const pickup = ride?.pickup?.address || 'Pickup location';
  const dropoff = ride?.destination?.address || 'Dropoff location';
  const tripFare = ride?.fare ?? 0;
  // If you have a waiting fee, use it; otherwise, set to 0
  const waitingFee = 0;
  const total = tripFare + waitingFee;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.invoiceTitle}>INVOICE</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.pointRow}>
          <View style={styles.iconCol}>
            <Text style={styles.pickupIcon}>📍</Text>
            <View style={styles.verticalLine} />
            <Text style={styles.dropoffIcon}>📍</Text>
          </View>
          <View style={styles.addressCol}>
            <Text style={styles.pointLabel}>Pickup point</Text>
            <Text style={styles.pointText}>{pickup}</Text>
            <View style={{ height: 16 }} />
            <Text style={styles.pointLabel}>Drop point</Text>
            <Text style={styles.pointText}>{dropoff}</Text>
          </View>
        </View>
        <View style={styles.fareBox}>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Trip fare</Text>
            <Text style={styles.fareValue}>Rwf {tripFare}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Waiting fee</Text>
            <Text style={styles.fareValue}>Rwf {waitingFee}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Total</Text>
            <Text style={styles.fareValue}>Rwf {total}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => router.push('/Ride/payment')}
        >
          <Text style={styles.payButtonText}>Pay now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
    backgroundColor: '#222',
  },
  invoiceTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  pointRow: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  iconCol: {
    alignItems: 'center',
    marginRight: 16,
  },
  pickupIcon: {
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 2,
  },
  verticalLine: {
    width: 2,
    height: 24,
    backgroundColor: '#FFD700',
    marginVertical: 2,
  },
  dropoffIcon: {
    fontSize: 20,
    color: '#FFD700',
    marginTop: 2,
  },
  addressCol: {
    flex: 1,
  },
  pointLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pointText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 2,
  },
  fareBox: {
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    padding: 16,
    marginBottom: 32,
    backgroundColor: '#111',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fareLabel: {
    color: '#fff',
    fontSize: 15,
  },
  fareValue: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: 'bold',
  },
  payButton: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
});

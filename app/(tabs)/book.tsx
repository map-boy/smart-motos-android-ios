import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Map, List, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRide } from '@/hooks/useRideContext';

const POPULAR_DESTINATIONS = [
  'African Leadership University',
  'Rwanda Art Museum',
  'Kimironko Market',
  'Kigali Convention Centre',
];

export default function BookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setRideStatus } = useRide();

  const handleBookByMap = () => {
    setRideStatus('booking_map');
    router.push('/Ride/map');
  };

  const handleBookByForm = () => {
    setRideStatus('booking_form');
    router.push('/Ride/book');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.welcomeText}>Welcome to SmartMotos</Text>
          <Text style={styles.subtitle}>Your trusted ride-hailing partner</Text>
        </View>

        {/* Booking Options */}
        <View style={styles.bookingOptions}>
          <TouchableOpacity
            style={[styles.bookingCard, styles.mapCard]}
            onPress={handleBookByMap}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, styles.mapIconContainer]}>
                <Map size={32} color={Colors.primary.default} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Book by Map</Text>
                <Text style={styles.cardDescription}>
                  Select your pickup and dropoff locations directly on the map
                </Text>
              </View>
              <ArrowRight size={24} color={Colors.primary.default} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bookingCard, styles.formCard]}
            onPress={handleBookByForm}
          >
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, styles.formIconContainer]}>
                <List size={32} color={Colors.secondary.default} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>Book by Form</Text>
                <Text style={styles.cardDescription}>
                  Enter your ride details manually for precise scheduling
                </Text>
              </View>
              <ArrowRight size={24} color={Colors.secondary.default} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Popular Destinations */}
        <View style={styles.destinationsSection}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <View style={styles.destinationsList}>
            {POPULAR_DESTINATIONS.map((destination, index) => (
              <TouchableOpacity
                key={index}
                style={styles.destinationItem}
                onPress={handleBookByMap}
              >
                <View style={styles.destinationIcon}>
                  <MapPin size={20} color={Colors.primary.default} />
                </View>
                <Text style={styles.destinationText}>{destination}</Text>
                <ArrowRight size={20} color={Colors.neutral.dark} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    padding: Layout.spacing.xl,
    paddingTop: 60,
    backgroundColor: Colors.primary.default,
    borderBottomLeftRadius: Layout.borderRadius.xl,
    borderBottomRightRadius: Layout.borderRadius.xl,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.neutral.white,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.neutral.lightest,
    opacity: 0.9,
  },
  bookingOptions: {
    padding: Layout.spacing.l,
    gap: Layout.spacing.m,
    marginTop: -Layout.spacing.xl,
  },
  bookingCard: {
    borderRadius: Layout.borderRadius.l,
    backgroundColor: Colors.neutral.white,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.default,
  },
  formCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary.default,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.l,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.m,
  },
  mapIconContainer: {
    backgroundColor: Colors.primary.light,
  },
  formIconContainer: {
    backgroundColor: Colors.secondary.light,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.neutral.dark,
    lineHeight: 20,
  },
  destinationsSection: {
    padding: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.m,
  },
  destinationsList: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Layout.borderRadius.l,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  destinationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.m,
  },
  destinationText: {
    flex: 1,
    fontSize: 16,
    color: Colors.neutral.black,
  },
});

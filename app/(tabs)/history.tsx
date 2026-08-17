import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, SafeAreaView } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const USER_AVATAR = 'https://randomuser.me/api/portraits/men/32.jpg';
const DRIVER_AVATAR = 'https://randomuser.me/api/portraits/men/45.jpg';

const TRIPS = Array(6).fill({
  driver: 'Kamana Emmanuel',
  plate: 'JDM PL8S',
  route: 'ALU - Kimironko',
  price: 'Rwf1000',
  distance: '5.5km',
  rating: 5,
  driverAvatar: DRIVER_AVATAR,
});

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.secondary.default }}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Trip History</Text>
          <Image source={{ uri: USER_AVATAR }} style={styles.avatar} />
        </View>
        <ScrollView contentContainerStyle={{ ...styles.scrollContent, paddingBottom: insets.bottom + 80 }} showsVerticalScrollIndicator={false}>
          {TRIPS.map((trip, idx) => (
            <View key={idx} style={styles.card}>
              <Image source={{ uri: trip.driverAvatar }} style={styles.driverAvatar} />
              <View style={styles.cardContent}>
                <Text style={styles.plate}>{trip.plate}</Text>
                <Text style={styles.driver}>{trip.driver}</Text>
                <Text style={styles.route}>{trip.route}</Text>
                <View style={styles.ratingRow}>
                  {Array.from({ length: trip.rating }).map((_, i) => (
                    <Text key={i} style={styles.star}>★</Text>
                  ))}
                </View>
              </View>
              <View style={styles.rightContent}>
                <Text style={styles.price}>{trip.price}</Text>
                <Text style={styles.distance}>{trip.distance}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary.default,
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.xl,
    marginBottom: 16,
  },
  title: {
    color: Colors.neutral.white,
    fontSize: 26,
    fontWeight: '700',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary.default,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.xl,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary.default,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary.default,
    marginBottom: 16,
    padding: 12,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.primary.default,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  plate: {
    color: Colors.primary.default,
    fontWeight: '700',
    fontSize: 15,
  },
  driver: {
    color: Colors.neutral.white,
    fontSize: 13,
    fontWeight: '500',
  },
  route: {
    color: Colors.neutral.white,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  star: {
    color: Colors.primary.default,
    fontSize: 15,
    marginRight: 2,
  },
  rightContent: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  price: {
    color: Colors.primary.default,
    fontWeight: '700',
    fontSize: 20,
  },
  distance: {
    color: Colors.neutral.white,
    fontSize: 13,
    marginTop: 2,
  },
});
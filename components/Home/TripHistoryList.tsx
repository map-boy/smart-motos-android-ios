import { View, StyleSheet, Image, Text } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';

const TRIP_DATA = [
  {
    id: '1',
    driverName: 'Kamana Emmanuel',
    plateNumber: 'JDM PL8S',
    route: 'ALU - Kimironko',
    rating: 5,
    cost: 'Rwf1000',
    distance: '5.5km',
    avatar: 'https://images.pexels.com/photos/1933873/pexels-photo-1933873.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  // Add more trip data as needed
];

function TripCard({ trip }: { trip: typeof TRIP_DATA[0] }) {
  return (
    <View style={styles.tripCard}>
      <View style={styles.tripInfo}>
        <Image source={{ uri: trip.avatar }} style={styles.driverAvatar} />
        <View style={styles.tripDetails}>
          <Text style={styles.plateNumber}>{trip.plateNumber}</Text>
          <Text style={styles.driverName}>{trip.driverName}</Text>
          <Text style={styles.route}>{trip.route}</Text>
          <View style={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <Text key={i} style={[styles.star, i < trip.rating && styles.starFilled]}>
                ★
              </Text>
            ))}
          </View>
        </View>
        <View style={styles.tripMetrics}>
          <Text style={styles.cost}>{trip.cost}</Text>
          <Text style={styles.distance}>{trip.distance}</Text>
        </View>
      </View>
    </View>
  );
}

export default function TripHistoryList() {
  return (
    <View style={styles.container}>
      {TRIP_DATA.map((trip) => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.l,
  },
  tripCard: {
    backgroundColor: Colors.secondary.default,
    borderRadius: Layout.borderRadius.l,
    marginBottom: Layout.spacing.m,
    padding: Layout.spacing.m,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Layout.spacing.m,
  },
  tripDetails: {
    flex: 1,
  },
  plateNumber: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  driverName: {
    color: Colors.neutral.light,
    fontSize: 14,
  },
  route: {
    color: Colors.neutral.light,
    fontSize: 14,
    marginTop: 2,
  },
  rating: {
    flexDirection: 'row',
    marginTop: 4,
  },
  star: {
    color: Colors.neutral.light,
    fontSize: 16,
    marginRight: 2,
  },
  starFilled: {
    color: Colors.primary.default,
  },
  tripMetrics: {
    alignItems: 'flex-end',
  },
  cost: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: '600',
  },
  distance: {
    color: Colors.neutral.light,
    fontSize: 14,
    marginTop: 4,
  },
});
import React from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import MapView from '@/components/common/MapView'; // Assuming MapView is a reusable component
import { colors, typography, spacing, borderRadius } from '@/styles/theme';
import { Star } from 'lucide-react-native';

const RIDER_IMAGE =
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=300';

export default function InProgressScreen() {
  const router = useRouter();

  const handlePauseTrip = () => {
    // TODO: Implement pause logic
    console.log('Trip paused');
    // Maybe navigate to a paused state screen or change state in this screen
  };

  const handleArrived = () => {
    // Navigate to the completed screen
    router.push('/driver/rides/completed');
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -1.9550, // Example starting point for in-progress
          longitude: 30.0800,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        // TODO: Add marker for destination
        // TODO: Draw route line from current location to destination
      />

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.riderInfo}>
          <Image source={{ uri: RIDER_IMAGE }} style={styles.riderImage} />
          <View style={styles.riderDetails}>
            <Text style={styles.riderName}>Akuzwe G.</Text>
            <View style={styles.ratingContainer}>
              {[...Array(4)].map((_, index) => (
                <Star
                  key={index}
                  size={16}
                  color={colors.primary.main}
                  fill={colors.primary.main}
                />
              ))}
               {[...Array(1)].map((_, index) => (
                <Star
                  key={index+4}
                  size={16}
                  color={colors.primary.main}
                  fill={colors.background.paper}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.tripInfo}>
           <Text style={styles.fareText}>1500 Rwf</Text>
           <Text style={styles.distanceText}>11.1Km</Text>
        </View>

         <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Destination</Text>
          <Text style={styles.locationText}>Rwanda Art Museum</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.pauseButton]} onPress={handlePauseTrip}>
              <Text style={styles.actionButtonText}>Pause trip</Text>
            </TouchableOpacity>
             <TouchableOpacity style={[styles.actionButton, styles.arrivedButton]} onPress={handleArrived}>
              <Text style={styles.actionButtonText}>Arrived</Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
   tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  fareText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
  },
  distanceText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    alignSelf: 'flex-end',
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
  pauseButton: {
      backgroundColor: colors.secondary.main,
      marginRight: spacing.md
  },
  arrivedButton: {
      backgroundColor: colors.primary.main,
  }
}); 
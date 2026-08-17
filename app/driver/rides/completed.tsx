import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '@/styles/theme';
import { Check } from 'lucide-react-native';

export default function CompletedScreen() {
  const router = useRouter();

  const handleRatePassenger = () => {
    // Navigate to the rating screen
    router.push('/driver/rides/rating');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Check size={80} color={colors.primary.main} />
        </View>
        <Text style={styles.title}>Trip Finished</Text>

        {/* TODO: Add trip summary details here (e.g., fare, distance) */}

        <TouchableOpacity style={styles.rateButton} onPress={handleRatePassenger}>
          <Text style={styles.rateButtonText}>Rate Passenger</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
    marginBottom: spacing.xl,
  },
  rateButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  rateButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: colors.primary.contrastText,
  },
});

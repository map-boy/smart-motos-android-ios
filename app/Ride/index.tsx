import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';

export default function RideEntryScreen() {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>How would you like to book your ride?</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/Ride/map')}
          >
            <Text style={styles.buttonText}>Choose by Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/Ride/book')}
          >
            <Text style={styles.buttonText}>Choose by Form</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xl + (Platform.OS === 'android' ? 24 : 0), // extra bottom padding for nav bar
    backgroundColor: Colors.neutral.white,
  },
  container: {
    width: '100%',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: Layout.spacing.xl,
    paddingHorizontal: 16,
    width: '100%',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary.default,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Layout.spacing.xl,
  },
  button: {
    backgroundColor: Colors.primary.default,
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    width: '90%',
    maxWidth: 400,
    shadowColor: Colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: Colors.neutral.white,
    fontSize: 20,
    fontWeight: '700',
  },
}); 
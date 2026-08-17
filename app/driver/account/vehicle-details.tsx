import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/styles/theme';
import { Stack } from 'expo-router';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  phoneNumber: string;
};

// Assuming VehicleDetailsScreen will have different form fields
// This is a placeholder based on the previous form structure.
// Replace with actual vehicle details fields (e.g., make, model, year, plate number)
type VehicleDetailsData = {
  make: string;
  model: string;
  year: string;
  plateNumber: string;
};

export default function VehicleDetailsScreen() {
  // const navigation = useNavigation(); // Not needed with Stack.Screen header

  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetailsData>({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
  });

  const handleChange = (field: keyof VehicleDetailsData, value: string) => {
    setVehicleDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save logic here
    console.log('Saving vehicle details:', vehicleDetails);
    // navigation.goBack(); // Not needed if navigating using router
  };

  return (
    <SafeAreaView style={styles.container}> {/* Use container style for safe area */}
      <Stack.Screen
        options={{
          title: 'Vehicle details', // Set title here
          headerStyle: { backgroundColor: colors.background.default },
          headerTintColor: colors.text.primary,
          headerShadowVisible: false,
        }}
      />
      <StatusBar barStyle="light-content" />

      <View style={styles.formContainer}> {/* Use formContainer style */}
        {/* Replace with actual vehicle details input groups */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Make</Text>
          <TextInput
            style={styles.input}
            value={vehicleDetails.make}
            onChangeText={(text) => handleChange('make', text)}
            placeholder="Enter vehicle make"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            value={vehicleDetails.model}
            onChangeText={(text) => handleChange('model', text)}
            placeholder="Enter vehicle model"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Year</Text>
          <TextInput
            style={styles.input}
            value={vehicleDetails.year}
            onChangeText={(text) => handleChange('year', text)}
            placeholder="Enter vehicle year"
            placeholderTextColor={colors.text.secondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Plate Number</Text>
          <TextInput
            style={styles.input}
            value={vehicleDetails.plateNumber}
            onChangeText={(text) => handleChange('plateNumber', text)}
            placeholder="Enter plate number"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default, // Use theme color
    padding: spacing.md, // Use theme spacing
  },
  // Removed custom header styles
  formContainer: {
    padding: spacing.md, // Use theme spacing
    backgroundColor: colors.background.paper, // Use theme color
    borderRadius: borderRadius.md, // Use theme border radius
    marginTop: spacing.md, // Use theme spacing
  },
  inputGroup: {
    marginBottom: spacing.lg, // Use theme spacing
  },
  label: {
    fontFamily: typography.fontFamily.semiBold, // Use theme typography
    fontSize: typography.fontSize.md, // Use theme font size
    color: colors.text.primary, // Use theme color
    marginBottom: spacing.xs, // Use theme spacing
    marginTop: spacing.sm, // Use theme spacing
  },
  input: {
    backgroundColor: colors.background.default, // Use theme color
    color: colors.text.primary, // Use theme color
    padding: spacing.sm, // Use theme spacing
    borderRadius: borderRadius.sm, // Use theme border radius
    fontSize: typography.fontSize.md, // Use theme font size
    fontFamily: typography.fontFamily.regular, // Use theme typography
  },
  // Removed inputText and selectInput styles as they were for a dropdown/select
  // Removed phoneInput style as it was specific to the account details form
  saveButton: {
    marginTop: spacing.lg, // Use theme spacing
    backgroundColor: colors.primary.main, // Use theme color
    paddingVertical: spacing.md, // Use theme spacing
    borderRadius: borderRadius.md, // Use theme border radius
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.primary.contrastText, // Use theme color
    fontSize: typography.fontSize.lg, // Use theme font size
    fontFamily: typography.fontFamily.bold, // Use theme typography
  },
});
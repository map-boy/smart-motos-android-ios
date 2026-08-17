import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '@/styles/theme';
import ReadOnlyField from '@/components/common/ReadOnlyField';
import InputField from '@/components/common/InputField';
import Button from '@/components/common/Button';
import { getDriverProfile, updateDriverProfile } from '@/services/profile';
import type { DriverProfile } from '@/services/profile';
import Dropdown from '@/components/common/Dropdown';

export default function ProfileSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [formData, setFormData] = useState({
    vehicle_type: '',
    service_provider: '',
    license_number: '',
  });
  const [errors, setErrors] = useState({
    vehicle_type: '',
    service_provider: '',
    license_number: '',
  });

  const vehicleTypes = [
    { label: 'Bike', value: 'bike' },
    { label: 'Car', value: 'car' },
  ];

  const serviceProviders = [
    { label: 'MTN', value: 'MTN' },
    { label: 'Airtel', value: 'Airtel' },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const result = await getDriverProfile();
      if (result.success && result.data) {
        setProfile(result.data);
        setFormData({
          vehicle_type: result.data.vehicle_type || '',
          service_provider: result.data.service_provider || '',
          license_number: result.data.license_number || '',
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to load profile');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while loading profile');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      vehicle_type: '',
      service_provider: '',
      license_number: '',
    };
    let isValid = true;

    if (!formData.vehicle_type) {
      newErrors.vehicle_type = 'Vehicle type is required';
      isValid = false;
    }

    if (!formData.service_provider) {
      newErrors.service_provider = 'Service provider is required';
      isValid = false;
    }

    if (!formData.license_number) {
      newErrors.license_number = 'License number is required';
      isValid = false;
    } else if (formData.license_number.length < 5) {
      newErrors.license_number = 'License number must be at least 5 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const result = await updateDriverProfile(formData);

      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully');
        await fetchProfile();
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        <ReadOnlyField label="Phone Number" value={profile?.phone || ''} />

        <Dropdown
          label="Vehicle Type"
          options={vehicleTypes}
          value={formData.vehicle_type}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, vehicle_type: value }))
          }
          error={errors.vehicle_type}
          placeholder="Select vehicle type"
        />

        <Dropdown
          label="Service Provider"
          options={serviceProviders}
          value={formData.service_provider}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, service_provider: value }))
          }
          error={errors.service_provider}
          placeholder="Select service provider"
        />

        <InputField
          label="License Number"
          value={formData.license_number}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, license_number: text }))
          }
          placeholder="Enter license number"
          error={errors.license_number}
        />

        <ReadOnlyField label="Status" value={profile?.status || ''} />

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Note: Phone number and status cannot be changed. Contact support if
            you need to update these details.
          </Text>
        </View>

        <Button
          text="Save Changes"
          onPress={handleSave}
          loading={saving}
          fullWidth
          style={styles.saveButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    gap: spacing.md,
  },
  infoContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
  },
  infoText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});

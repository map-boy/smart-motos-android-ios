import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { colors, typography, spacing } from '@/styles/theme';
import Button from '@/components/common/Button';
import InputField from '@/components/common/InputField';
import SocialButtons from '@/components/common/SocialButtons';
import CameraCapture from '../../../components/common/CameraCapture';
import { useAuth } from '@/hooks/AuthContext';

export default function DriverSignupScreen() {
  const { signUpEmail, googleAuth } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    licenseNumber: '',
  });
  const [serviceProvider, setServiceProvider] = useState<'MTN' | 'Airtel'>('MTN');
  const [vehicleType, setVehicleType] = useState<'bike' | 'car'>('bike');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const validateForm = () => {
    const newErrors = { fullName: '', email: '', password: '', licenseNumber: '' };
    let valid = true;

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      valid = false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Enter a valid email address';
      valid = false;
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    if (!licenseNumber) {
      newErrors.licenseNumber = 'License number is required';
      valid = false;
    }
    if (!licenseImage) {
      Alert.alert('Error', 'A clear photo of your license is required.');
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const result = await signUpEmail(
      email.trim(),
      password,
      undefined,
      {
        name: fullName.trim(),
        phone: phoneNumber.trim() || undefined,
        service_provider: serviceProvider,
        vehicle_type: vehicleType,
        license_number: licenseNumber,
        licenseImageUri: licenseImage || undefined,
      }
    );
    setLoading(false);

    if (result.success) {
      router.replace('/driver/home');
    } else {
      Alert.alert('Signup failed', result.error || 'Please try again');
    }
  };

  const handleGoogleSignup = async () => {
    if (!licenseNumber || !licenseImage) {
      Alert.alert('Error', 'License number and a photo of your license are required before continuing with Google.');
      return;
    }
    setLoading(true);
    const result = await googleAuth({
      name: fullName.trim(),
      phone: phoneNumber.trim() || undefined,
      service_provider: serviceProvider,
      vehicle_type: vehicleType,
      license_number: licenseNumber,
      licenseImageUri: licenseImage,
    });
    setLoading(false);
    if (result.success) {
      router.replace('/driver/home');
    } else {
      Alert.alert('Google sign-up failed', result.error || 'Please try again');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Text style={styles.headerTitle}>Create New Account</Text>

        <View style={styles.form}>
          <InputField
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
          />

          <InputField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <InputField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            error={errors.password}
          />

          <InputField
            placeholder="Phone Number (optional)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />

          <View style={{ marginBottom: 12 }}>
            <Text style={{ marginBottom: 4, color: colors.text.secondary }}>Service Provider</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => setServiceProvider('MTN')} style={{ marginRight: 16 }}>
                <Text style={{ color: serviceProvider === 'MTN' ? colors.primary.main : colors.text.secondary }}>MTN</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setServiceProvider('Airtel')}>
                <Text style={{ color: serviceProvider === 'Airtel' ? colors.primary.main : colors.text.secondary }}>Airtel</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ marginBottom: 4, color: colors.text.secondary }}>Vehicle Type</Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => setVehicleType('bike')} style={{ marginRight: 16 }}>
                <Text style={{ color: vehicleType === 'bike' ? colors.primary.main : colors.text.secondary }}>Bike</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setVehicleType('car')}>
                <Text style={{ color: vehicleType === 'car' ? colors.primary.main : colors.text.secondary }}>Car</Text>
              </TouchableOpacity>
            </View>
          </View>

          <InputField
            placeholder="License Number"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            error={errors.licenseNumber}
          />

          <View style={{ marginBottom: 16 }}>
            <Text style={{ marginBottom: 6, color: colors.text.secondary }}>License Photo (Required)</Text>
            {licenseImage ? (
              <View style={{ alignItems: 'center' }}>
                <Image source={{ uri: licenseImage }} style={{ width: 220, height: 120, borderRadius: 8, marginBottom: 8 }} />
                <Button text="Retake Photo" onPress={() => setShowCamera(true)} style={{ marginBottom: 6 }} fullWidth />
              </View>
            ) : (
              <Button text="Take Photo of License" onPress={() => setShowCamera(true)} fullWidth style={{ marginBottom: 6 }} />
            )}
          </View>

          {showCamera && (
            <CameraCapture
              onCapture={(uri: string) => {
                setLicenseImage(uri);
                setShowCamera(false);
              }}
              onCancel={() => setShowCamera(false)}
            />
          )}

          <Button
            text="Create Account"
            onPress={handleSignup}
            loading={loading}
            fullWidth
            style={styles.signupButton}
            disabled={!licenseImage}
          />

          <SocialButtons onGooglePress={handleGoogleSignup} />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/driver/auth/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.default, paddingTop: spacing.xl },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.xl },
  content: { flex: 1, padding: spacing.xl },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['3xl'],
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  form: { width: '100%' },
  signupButton: { marginTop: spacing.md },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  loginText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  loginLink: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: colors.primary.main,
  },
});
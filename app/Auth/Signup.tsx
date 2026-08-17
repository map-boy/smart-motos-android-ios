import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import SocialAuthButtons from '@/components/UI/SocialAuthButtons';
import { useAuth } from '@/hooks/AuthContext';

export default function Signup() {
  const { signUpEmail, googleAuth } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field in errors && errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = { fullName: '', email: '', password: '' };
    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
      isValid = false;
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    const result = await signUpEmail(
      formData.email.trim(),
      formData.password,
      { name: formData.fullName.trim(), phone: formData.phone.trim() || undefined }
    );
    setLoading(false);

    if (result.success) {
      router.push('/(tabs)');
    } else {
      Alert.alert('Signup failed', result.error || 'Please try again');
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    const result = await googleAuth();
    setLoading(false);

    if (result.success) {
      router.push('/(tabs)');
    } else {
      Alert.alert('Google sign-up failed', result.error || 'Please try again');
    }
  };

  const navigateToLogin = () => router.navigate('/Auth/Login');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Create New Account</Text>
      </View>

      <View style={styles.formContainer}>
        <Input
          label="Full Name"
          placeholder="John Doe"
          value={formData.fullName}
          onChangeText={(value) => updateFormData('fullName', value)}
          error={errors.fullName}
        />
        <Input
          label="Email"
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(value) => updateFormData('email', value)}
          error={errors.email}
        />
        <Input
          label="Password"
          placeholder="At least 6 characters"
          secureTextEntry
          autoCapitalize="none"
          value={formData.password}
          onChangeText={(value) => updateFormData('password', value)}
          error={errors.password}
        />
        <Input
          label="Phone Number (optional)"
          placeholder="+250XXXXXXXXX"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
        />

        <Button
          title="Create Account"
          onPress={handleSignup}
          variant="primary"
          size="large"
          loading={loading}
          style={styles.signupButton}
        />

        <SocialAuthButtons onGooglePress={handleGoogleSignup} />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.secondary.default },
  contentContainer: { paddingBottom: Layout.spacing.xl },
  header: { paddingTop: 60, paddingHorizontal: Layout.spacing.xl, paddingBottom: Layout.spacing.l },
  title: { fontSize: 24, fontWeight: '700', color: Colors.neutral.white },
  formContainer: { flex: 1, paddingHorizontal: Layout.spacing.xl },
  signupButton: { marginTop: Layout.spacing.m },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: Layout.spacing.l },
  loginText: { color: Colors.neutral.light, fontSize: 14 },
  loginLink: { color: Colors.primary.default, fontWeight: '600', marginLeft: Layout.spacing.xs, fontSize: 14 },
});
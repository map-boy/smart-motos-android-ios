import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import SocialAuthButtons from '@/components/UI/SocialAuthButtons';
import { useAuth } from '@/hooks/AuthContext';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.secondary.default },
  header: { paddingTop: 60, paddingHorizontal: Layout.spacing.xl, paddingBottom: Layout.spacing.l },
  title: { fontSize: 24, fontWeight: '700', color: Colors.neutral.white },
  subtitle: { fontSize: 14, color: Colors.neutral.light, marginTop: Layout.spacing.xs },
  formContainer: { flex: 1, paddingHorizontal: Layout.spacing.xl },
  loginButton: { marginTop: Layout.spacing.m },
  forgotPassword: { color: Colors.primary.default, textAlign: 'right', marginTop: Layout.spacing.m, fontSize: 14 },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: Layout.spacing.xxl },
  signupText: { color: Colors.neutral.light, fontSize: 14 },
  signupLink: { color: Colors.primary.default, fontWeight: '600', marginLeft: Layout.spacing.xs, fontSize: 14 },
});

export default function Login() {
  const { signInEmail, googleAuth, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = { email: '', password: '' };
    let valid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = 'Enter a valid email address';
      valid = false;
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const result = await signInEmail(email.trim(), password);
    setLoading(false);

    if (result.success) {
      if (result.role === 'admin') {
        router.push('/Admin/PendingTopups');
      } else {
        router.push('/(tabs)');
      }
    } else {
      Alert.alert('Login failed', result.error || 'Invalid email or password', [{ text: 'OK' }]);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Enter your email', 'Type your email above first, then tap "Forgot password?" again.');
      return;
    }
    const result = await resetPassword(email.trim());
    if (result.success) {
      Alert.alert('Check your email', 'A password reset link has been sent.');
    } else {
      Alert.alert('Error', result.error || 'Failed to send reset email');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await googleAuth();
    setLoading(false);

    if (result.success) {
      router.push('/(tabs)');
    } else {
      Alert.alert('Google sign-in failed', result.error || 'Please try again', [{ text: 'OK' }]);
    }
  };

  const navigateToSignup = () => {
    router.push('/Auth/Signup');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Passenger Login</Text>
        <Text style={styles.subtitle}>Sign in with your email and password</Text>
      </View>

      <View style={styles.formContainer}>
        <Input
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
        />

        <Input
          label="Password"
          placeholder="Your password"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
        />

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>

        <Button
          title="Log In"
          onPress={handleLogin}
          variant="primary"
          size="large"
          loading={loading}
          style={styles.loginButton}
        />

        <SocialAuthButtons onGooglePress={handleGoogleLogin} />

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={navigateToSignup}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
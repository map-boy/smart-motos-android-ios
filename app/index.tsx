import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import SplashScreen from '@/components/Splash/SplashScreen';
import OnboardingScreen from '@/components/Splash/OnboardingScreen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function Index() {
  useFrameworkReady();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handlePassengerPress = () => {
    setShowOnboarding(true);
  };

  const handleDriverPress = () => {
    router.replace('/driver/auth/login');
  };

  const handleOnboardingFinish = () => {
    // Navigate to auth flow
    router.push('/Auth/Login');
  };

  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  if (showOnboarding) {
    return <OnboardingScreen onFinish={handleOnboardingFinish} />;
  }

  return (
    <SplashScreen
      onPassengerPress={handlePassengerPress}
      onDriverPress={handleDriverPress}
    />
  );
}
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFD000',
  },
});

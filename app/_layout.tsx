// Polyfill for CustomEvent in React Native
if (typeof global.CustomEvent !== 'function') {
  class CustomEvent<T> {
    type: string;
    detail: T | null;

    constructor(typeArg: string, eventInitDict?: { detail: T }) {
      this.type = typeArg;
      this.detail = eventInitDict?.detail ?? null;
    }
  }
  global.CustomEvent = CustomEvent as any;
}

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { SplashScreen } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { RideProvider } from '@/hooks/useRideContext';
import { useColorScheme } from 'react-native';
import NotificationHandler from '@/components/common/NotificationHandler';
import { AuthProvider } from '@/hooks/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after fonts have loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Prevent rendering until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <RideProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="driver" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="light" />
        <NotificationHandler />
      </RideProvider>
    </AuthProvider>
  );
}





import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/styles/theme';
import { Text } from 'react-native';
export default function DriverAccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background.default },
        headerTintColor: colors.text.primary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="profile-settings"
        options={{
          headerTitle: () => <Text style={{ color: colors.text.primary }}>Profile settings</Text>,
        }}
      />
      <Stack.Screen
        name="vehicle-details"
        options={{
          headerTitle: () => <Text style={{ color: colors.text.primary }}>Vehicle details</Text>,
        }}
      />
      <Stack.Screen
        name="customer-support"
        options={{
          headerTitle: () => <Text style={{ color: colors.text.primary }}>Customer support</Text>,
        }}
      />
    </Stack>
  );
}
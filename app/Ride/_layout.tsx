import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';

export default function RideLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary.default,
        },
        headerTintColor: Colors.secondary.default,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: 'Back',
        headerBackVisible: true,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.neutral.white,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Book a Ride',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="map"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="book"
        options={{
          title: 'Book by Form',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="payment"
        options={{
          title: 'Payment',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="confirmation"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
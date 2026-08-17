import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function AccountLayout() {
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
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Account Settings',
        }}
      />
      <Stack.Screen
        name="password"
        options={{
          title: 'Change Password',
        }}
      />
      <Stack.Screen
        name="cards"
        options={{
          title: 'Payment Methods',
        }}
      />
      <Stack.Screen
        name="support"
        options={{
          title: 'Customer Support',
        }}
      />
      <Stack.Screen
        name="refer"
        options={{
          title: 'Refer a Friend',
        }}
      />
    </Stack>
  );
}
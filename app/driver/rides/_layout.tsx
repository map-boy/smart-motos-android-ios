import { Stack } from 'expo-router';

export default function RidesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          title: 'Available Rides',
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="navigate-pickup"
        options={{
          title: 'Navigate to Pickup',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="waiting"
        options={{
          title: 'Waiting for Passenger',
          gestureEnabled: true,
        }}
      />
      <Stack.Screen 
        name="in-progress"
        options={{
          title: 'Trip in Progress',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="completed"
        options={{
          title: 'Trip Completed',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="rating"
        options={{
          title: 'Rate Passenger',
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
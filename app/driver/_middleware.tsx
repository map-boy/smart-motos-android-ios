import { Redirect, Slot } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';

export default function DriverMiddleware() {
  const { user, loading } = useAuth();

  // Wait for auth to be checked
  if (loading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect href="/driver/auth/login" />;
  }

  // Allow access to protected routes
  return <Slot />;
}

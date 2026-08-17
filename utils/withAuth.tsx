import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function WithAuthComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) {
      return null;
    }

    if (!user) {
      return <Redirect href="/driver/auth/login" />;
    }

    return <WrappedComponent {...props} />;
  };
}

import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/config';

export interface DriverProfile {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  service_provider: string;
  license_number: string;
  status: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export const getDriverProfile = async (): Promise<ApiResponse> => {
  try {
    const token = await SecureStore.getItemAsync('driverToken');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch(`${API_URL}/driver/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch profile' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const updateDriverProfile = async (profileData: Partial<DriverProfile>): Promise<ApiResponse> => {
  try {
    const token = await SecureStore.getItemAsync('driverToken');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch(`${API_URL}/driver/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update profile' };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}; 
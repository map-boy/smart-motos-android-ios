import { API_URL } from '@/config';
import * as SecureStore from 'expo-secure-store';

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export const forgotDriverPassword = async (phone: string) => {
  try {
    const response = await fetch(`${API_URL}/driver/password/forgot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message,
      error: data.error,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
};

export const resetDriverPassword = async (phone: string, code: string, newPassword: string, confirmPassword: string) => {
  try {
    const response = await fetch(`${API_URL}/driver/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        code,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });
    const data = await response.json();
    return {
      success: response.ok,
      message: data.message,
      error: data.error,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error. Please try again.',
    };
  }
};

export const changeDriverPassword = async (
  oldPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<ApiResponse> => {
  try {
    const token = await SecureStore.getItemAsync('driverToken');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch(`${API_URL}/driver/password/change`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });

    const data = await response.json();
    return {
      success: response.ok,
      message: data.message,
      error: data.error,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to change password',
    };
  }
}; 
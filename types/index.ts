export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export * from './ride';
import { RideStatus } from './ride';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'rider' | 'driver';
  location?: Location;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'driver';
  vehicle: Vehicle;
  isAvailable: boolean;
  rating: number;
  earnings: number;
  completedRides: number;
  currentLocation?: Location;
  avatar_url?: string;
}

export interface Vehicle {
  id: string;
  type: 'car' | 'motorcycle';
  make: string;
  model: string;
  year: number;
  plateNumber: string;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId?: string;
  pickup: Location;
  destination: Location;
  status: RideStatus;
  fare: number;
  distance: number;
  duration: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  paymentMethod?: string;
  rating?: number;
  feedback?: string;
}

export interface Payment {
  id: string;
  rideId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method: 'card' | 'mobile_money' | 'paypal';
  timestamp: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'ride' | 'payment' | 'promo' | 'system';
  read: boolean;
  createdAt: Date;
}

export interface MarkerData {
  id: string;
  coordinate: Location;
  title?: string;
  description?: string;
  onPress?: () => void;
} 
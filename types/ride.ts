import { Location, Vehicle } from './index';

export type RideStatus = 
  | 'requested'      // Initial state when passenger requests a ride
  | 'driver_assigned' // When a driver is assigned to the ride
  | 'driver_arrived' // When driver arrives at pickup location
  | 'in_progress'    // Ride has started
  | 'paused'        // Ride is temporarily paused
  | 'completed'     // Ride has been completed
  | 'cancelled'     // Ride was cancelled
  | 'payment_pending' // Waiting for payment
  | 'paid';         // Payment received

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

export interface MarkerData {
  id: string;
  coordinate: Location;
  title?: string;
  description?: string;
  onPress?: () => void;
} 
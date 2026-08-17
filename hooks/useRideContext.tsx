import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Location } from '../types';

// Define the possible states of a ride
export type RideStatus =
  | 'idle'
  | 'booking_form'
  | 'booking_map'
  | 'searching'
  | 'accepted'
  | 'enroute'
  | 'paused'
  | 'arrived'
  | 'payment'
  | 'completed'
  | 'rating';

// Define the structure of a location object
export interface LocationDetails {
  description: string;
  coords: {
    lat: number;
    lng: number;
  };
}

// Define the structure of the booking details
export interface BookingDetails {
  pickup?: LocationDetails;
  dropoff?: LocationDetails;
  distance?: number;
  duration?: number;
  polyline?: string;
  paymentMethod?: string;
  bargainAmount?: number;
  bookingId?: string;
  driverId?: string;
  fare?: number;
  status?: string;
  stops?: string[];
  bookForFriend?: boolean;
}

// Define the structure of the driver information
export interface DriverInfo {
  id: string;
  name: string;
  rating: number;
  plate: string;
  avatar: string;
  location?: Location;
}

// Define the structure of the trip details
export interface TripDetails {
  distance: string;
  time: string;
  baseFare: string;
  distanceFare: string;
  waitingFee: string;
  total: string;
}

// Define the structure of an available ride (for map scanning)
export interface AvailableRide {
  id: string;
  location: Location;
  // Add other relevant details for available rides (e.g., driver, vehicle type, price estimate)
}

// Define the shape of the ride state
interface RideState {
  status: RideStatus;
  bookingDetails: BookingDetails;
  currentDriver: DriverInfo | null;
  currentTrip: TripDetails | null;
  availableRides: AvailableRide[];
}

// Define the shape of the context
interface RideContextType {
  rideState: RideState;
  setRideStatus: (status: RideStatus) => void;
  updateBookingDetails: (details: Partial<BookingDetails>) => void;
  setCurrentDriver: (driver: DriverInfo | null) => void;
  setCurrentTrip: (trip: Partial<TripDetails> | null) => void;
  setAvailableRides: (rides: AvailableRide[]) => void;
  // Add other functions to modify the ride state (e.g., acceptRide, pauseRide, completeRide, etc.)
}

// Create the context
const RideContext = createContext<RideContextType | undefined>(undefined);

// Create the provider component
export const RideProvider = ({ children }: { children: ReactNode }) => {
  const [rideState, setRideState] = useState<RideState>({
    status: 'idle',
    bookingDetails: {
      stops: [],
      paymentMethod: 'cash',
      bookForFriend: false,
      distance: 0,
      duration: 0,
    },
    currentDriver: null,
    currentTrip: null,
    availableRides: [],
  });

  const setRideStatus = (status: RideStatus) => {
    setRideState((prevState) => ({ ...prevState, status }));
  };

  const updateBookingDetails = (details: Partial<BookingDetails>) => {
    setRideState((prevState) => ({
      ...prevState,
      bookingDetails: { ...prevState.bookingDetails, ...details },
    }));
  };

  const setCurrentDriver = (driver: DriverInfo | null) => {
    setRideState((prevState) => ({ ...prevState, currentDriver: driver }));
  };

  const setCurrentTrip = (trip: Partial<TripDetails> | null) => {
    setRideState((prevState) => ({
      ...prevState,
      currentTrip: trip
        ? ({ ...prevState.currentTrip, ...trip } as TripDetails)
        : null,
    }));
  };

  const setAvailableRides = (rides: AvailableRide[]) => {
    setRideState((prevState) => ({ ...prevState, availableRides: rides }));
  };

  // Add other state modification functions here

  const contextValue: RideContextType = {
    rideState,
    setRideStatus,
    updateBookingDetails,
    setCurrentDriver,
    setCurrentTrip,
    setAvailableRides,
  };

  return (
    <RideContext.Provider value={contextValue}>{children}</RideContext.Provider>
  );
};

// Create a hook to consume the context
export const useRide = () => {
  const context = useContext(RideContext);
  if (context === undefined) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};

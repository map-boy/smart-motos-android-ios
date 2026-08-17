import { Location, Ride, Driver, RideStatus } from '../types';
import firestore from '@react-native-firebase/firestore';
import MapboxService from './mapboxService';

const mapboxService = MapboxService.getInstance();
const ridesRef = firestore().collection('rides');
const usersRef = firestore().collection('users');

const BASE_FARE = 5;
const COST_PER_KM = 1.5;
const COST_PER_MIN = 0.5;
const MAX_DRIVER_SEARCH_RADIUS = 5;

const calculateDistance = (a: Location, b: Location): number => {
  const latDiff = b.latitude - a.latitude;
  const lngDiff = b.longitude - a.longitude;
  return Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111;
};

const getRouteMetrics = async (pickup: Location, destination: Location) => {
  try {
    const eta = await mapboxService.getETA(pickup, destination);
    if (eta) return { distance: eta.distance / 1000, duration: eta.duration / 60 };
  } catch (error) {
    console.error('[RideService] Mapbox route metrics failed:', error);
  }
  const distance = calculateDistance(pickup, destination);
  return { distance, duration: (distance / 30) * 60 };
};

export const calculateFare = async (pickup: Location, destination: Location): Promise<number> => {
  const metrics = await getRouteMetrics(pickup, destination);
  return BASE_FARE + COST_PER_KM * metrics.distance + COST_PER_MIN * metrics.duration;
};

export const requestRide = async (
  riderId: string,
  pickup: Location,
  destination: Location,
  paymentMethod: string = 'cash'
): Promise<Ride> => {
  const metrics = await getRouteMetrics(pickup, destination);
  const fare = BASE_FARE + COST_PER_KM * metrics.distance + COST_PER_MIN * metrics.duration;

  const docRef = await ridesRef.add({
    riderId,
    pickup,
    destination,
    status: 'requested',
    fare,
    distance: metrics.distance,
    duration: metrics.duration,
    paymentMethod,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  const snapshot = await docRef.get();
  const data = snapshot.data()!;
  return {
    id: docRef.id,
    riderId,
    pickup,
    destination,
    status: 'requested',
    fare,
    distance: metrics.distance,
    duration: metrics.duration,
    createdAt: new Date(),
  };
};

export const getNearbyDrivers = async (location: Location): Promise<Driver[]> => {
  const snapshot = await usersRef.where('role', '==', 'driver').where('isAvailable', '==', true).get();
  const drivers: Driver[] = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.currentLocation) {
      const distance = calculateDistance(location, data.currentLocation);
      if (distance <= MAX_DRIVER_SEARCH_RADIUS) {
        drivers.push({ id: doc.id, ...data } as Driver);
      }
    }
  });
  return drivers.sort((a, b) => {
    if (!a.currentLocation || !b.currentLocation) return 0;
    return calculateDistance(location, a.currentLocation) - calculateDistance(location, b.currentLocation);
  });
};

export const updateDriverStatus = async (driverId: string, isAvailable: boolean): Promise<void> => {
  await usersRef.doc(driverId).update({ isAvailable });
};

export const updateDriverLocation = async (driverId: string, location: Location): Promise<void> => {
  await usersRef.doc(driverId).update({ currentLocation: location });
};

export const getDriverById = async (driverId: string): Promise<Driver | null> => {
  const doc = await usersRef.doc(driverId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Driver;
};

export const getUserById = async (userId: string): Promise<{ id: string; name: string; avatar_url?: string } | null> => {
  const doc = await usersRef.doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as any;
};

export const getDriverEarnings = async (driverId: string): Promise<{ total: number; available: number; withdrawn: number }> => {
  const doc = await usersRef.doc(driverId).get();
  const data = doc.data() || {};
  return {
    total: data.earnings?.total || 0,
    available: data.earnings?.available || 0,
    withdrawn: data.earnings?.withdrawn || 0,
  };
};

export const requestWithdrawal = async (driverId: string, amount: number, method: string): Promise<void> => {
  await usersRef.doc(driverId).collection('withdrawals').add({
    amount,
    method,
    status: 'pending',
    requestedAt: firestore.FieldValue.serverTimestamp(),
  });
};

export const getPendingDrivers = async (): Promise<any[]> => {
  const snapshot = await usersRef
    .where('role', '==', 'driver')
    .where('status', '==', 'pending_verification')
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const listenToPendingDrivers = (callback: (drivers: any[]) => void): (() => void) => {
  return usersRef
    .where('role', '==', 'driver')
    .where('status', '==', 'pending_verification')
    .onSnapshot((snapshot) => {
      callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
};

export const approveDriver = async (driverId: string): Promise<void> => {
  await usersRef.doc(driverId).update({ status: 'verified' });
};

export const rejectDriver = async (driverId: string, reason?: string): Promise<void> => {
  await usersRef.doc(driverId).update({ status: 'rejected', rejectionReason: reason || null });
};

export const handleDriverResponse = async (rideId: string, driverId: string, accepted: boolean): Promise<void> => {
  if (accepted) {
    await ridesRef.doc(rideId).update({ driverId, status: 'driver_assigned' });
  } else {
    await ridesRef.doc(rideId).update({ status: 'requested' });
  }
};

export const updateRideStatus = async (rideId: string, status: RideStatus): Promise<void> => {
  const update: any = { status };
  if (status === 'in_progress') update.startedAt = firestore.FieldValue.serverTimestamp();
  if (status === 'completed') update.completedAt = firestore.FieldValue.serverTimestamp();
  await ridesRef.doc(rideId).update(update);
};

export const getRideDetails = async (rideId: string): Promise<Ride | null> => {
  const doc = await ridesRef.doc(rideId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Ride;
};

/** Real-time listener on a single ride doc. Returns unsubscribe function. */
export const listenToRide = (rideId: string, callback: (ride: Ride) => void): (() => void) => {
  return ridesRef.doc(rideId).onSnapshot((doc) => {
    if (doc.exists) {
      callback({ id: doc.id, ...doc.data() } as Ride);
    }
  });
};

/** Real-time listener on nearby available drivers. Returns unsubscribe function. */
export const listenToNearbyDrivers = (
  location: Location,
  callback: (drivers: Driver[]) => void
): (() => void) => {
  return usersRef.where('role', '==', 'driver').where('isAvailable', '==', true).onSnapshot((snapshot) => {
    const drivers: Driver[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.currentLocation && calculateDistance(location, data.currentLocation) <= MAX_DRIVER_SEARCH_RADIUS) {
        drivers.push({ id: doc.id, ...data } as Driver);
      }
    });
    callback(drivers);
  });
};

/** Real-time listener on incoming ride requests for a driver. Returns unsubscribe function. */
export const listenToDriverRideRequests = (
  driverId: string,
  callback: (rides: Ride[]) => void
): (() => void) => {
  return ridesRef.where('status', '==', 'requested').onSnapshot((snapshot) => {
    const rides: Ride[] = [];
    snapshot.forEach((doc) => rides.push({ id: doc.id, ...doc.data() } as Ride));
    callback(rides);
  });
};






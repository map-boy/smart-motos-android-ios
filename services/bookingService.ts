import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { notificationService } from './notification';

const ridesRef = firestore().collection('rides');

export interface BookingRequest {
  pickup_location: { lat: number; lng: number };
  dropoff_location: { lat: number; lng: number };
  pickup_time?: string;
  payment_method: string;
  bargain_amount?: number;
}

export interface BookingResponse {
  booking_id: string;
  driver_id?: string;
  fare: number;
  status: string;
  bargain_amount?: number;
}

class BookingService {
  async createBooking(booking: BookingRequest): Promise<BookingResponse> {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User must be signed in to create a booking');
    }
    const docRef = await ridesRef.add({
      riderId: currentUser.uid,
      pickup: booking.pickup_location,
      destination: booking.dropoff_location,
      paymentMethod: booking.payment_method,
      bargainAmount: booking.bargain_amount || null,
      status: 'requested',
      fare: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    const snapshot = await docRef.get();
    const data = snapshot.data()!;
    return {
      booking_id: docRef.id,
      driver_id: data.driverId,
      fare: data.fare || 0,
      status: data.status,
      bargain_amount: data.bargainAmount,
    };
  }

  async getBooking(bookingId: string) {
    const doc = await ridesRef.doc(bookingId).get();
    if (!doc.exists) throw new Error('Booking not found');
    return { id: doc.id, ...doc.data() };
  }

  async getBookings() {
    const snapshot = await ridesRef.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async acceptBooking(bookingId: string, driverId: string) {
    await ridesRef.doc(bookingId).update({ status: 'driver_assigned', driverId });
    const doc = await ridesRef.doc(bookingId).get();
    const data = doc.data()!;
    if (data.riderId) {
      await notificationService.sendBookingNotification(
        data.riderId.toString(),
        'passenger',
        'accepted',
        'Your ride has been accepted'
      );
    }
    return { id: doc.id, ...data };
  }

  async rejectBooking(bookingId: string) {
    await ridesRef.doc(bookingId).update({ status: 'requested' });
    const doc = await ridesRef.doc(bookingId).get();
    const data = doc.data()!;
    if (data.riderId) {
      await notificationService.sendBookingNotification(
        data.riderId.toString(),
        'passenger',
        'rejected',
        'Your ride request was rejected'
      );
    }
    return { id: doc.id, ...data };
  }

  async startRide(bookingId: string) {
    await ridesRef.doc(bookingId).update({
      status: 'in_progress',
      startedAt: firestore.FieldValue.serverTimestamp(),
    });
    const doc = await ridesRef.doc(bookingId).get();
    const data = doc.data()!;
    if (data.riderId) {
      await notificationService.sendBookingNotification(
        data.riderId.toString(),
        'passenger',
        'started',
        'Your ride has started'
      );
    }
    return { id: doc.id, ...data };
  }

  async completeRide(bookingId: string) {
    await ridesRef.doc(bookingId).update({
      status: 'completed',
      completedAt: firestore.FieldValue.serverTimestamp(),
    });
    const doc = await ridesRef.doc(bookingId).get();
    const data = doc.data()!;
    if (data.riderId) {
      await notificationService.sendBookingNotification(
        data.riderId.toString(),
        'passenger',
        'completed',
        'Your ride has been completed'
      );
    }
    return { id: doc.id, ...data };
  }

  async updateDriverLocation(bookingId: string, location: { lat: number; lng: number }) {
    await ridesRef.doc(bookingId).update({
      driverLocation: { latitude: location.lat, longitude: location.lng },
    });
  }
}

export const bookingService = new BookingService();

export const createBooking = async (bookingDetails: any) => {
  const docRef = await ridesRef.add({
    pickup: bookingDetails.pickup_location,
    destination: bookingDetails.dropoff_location,
    paymentMethod: bookingDetails.payment_method,
    bargainAmount: bookingDetails.bargain_amount || null,
    status: 'requested',
    fare: 0,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return { booking_id: docRef.id, status: 'pending' };
};


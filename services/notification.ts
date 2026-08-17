import firestore from '@react-native-firebase/firestore';
import { Notification } from '../types';

const notificationsRef = firestore().collection('notifications');

class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /** Kept for compatibility with useNotification.ts hook. No real-time socket needed; Firestore listeners are used per-screen instead. */
  public initialize() {}

  /** Kept for compatibility with useNotification.ts hook. */
  public cleanup() {}

  public async sendNotification(
    userId: string,
    userType: string,
    title: string,
    message: string,
    type: Notification['type']
  ): Promise<Notification | void> {
    if (userId === undefined || userId === null) {
      console.warn('sendNotification: userId is undefined or null, skipping notification.', userId);
      return;
    }

    const docRef = await notificationsRef.add({
      userId,
      userType,
      title,
      message,
      type,
      read: false,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    return {
      id: docRef.id,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
    };
  }

  public async sendBookingNotification(
    userId: string,
    userType: string,
    status: string,
    details: string
  ): Promise<void> {
    if (userId === undefined || userId === null) {
      console.warn('sendBookingNotification: userId is undefined or null, skipping notification.', userId);
      return;
    }
    await this.sendNotification(userId, userType, `Booking ${status}`, details, 'ride');
  }

  public async sendPaymentNotification(
    userId: string,
    userType: string,
    status: string,
    amount: number
  ): Promise<void> {
    await this.sendNotification(
      userId,
      userType,
      `Payment ${status}`,
      `Your payment of ${amount} has been ${status.toLowerCase()}.`,
      'payment'
    );
  }
}

export const notificationService = NotificationService.getInstance();

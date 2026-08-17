import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Vibration,
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';
import { notificationService } from '@/services/notification';
import { bookingService } from '@/services/bookingService';
import { listenToDriverRideRequests, getUserById } from '@/services/ride';
import { useAuth } from '@/hooks/AuthContext';
import { MapPin, Clock } from 'lucide-react-native';

interface BookingNotification {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerAvatar?: string;
  pickup: string;
  dropoff: string;
  fare: number;
  pickupTime: string;
}

export default function DriverNotification() {
  const { user } = useAuth();
  const [activeBooking, setActiveBooking] =
    useState<BookingNotification | null>(null);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds to respond
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToDriverRideRequests(user.id, async (rides) => {
      if (rides.length === 0) return;
      const ride = rides[0];
      if (activeBooking && ride.id === activeBooking.id) return;
      const passenger = await getUserById(ride.riderId);
      handleNewBooking({
        id: ride.id,
        passengerId: ride.riderId,
        passengerName: passenger?.name || 'Passenger',
        passengerAvatar: passenger?.avatar_url,
        pickup: ride.pickup?.address || 'Pickup location',
        dropoff: ride.destination?.address || 'Dropoff location',
        fare: ride.fare,
        pickupTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
      });
    });
    return unsubscribe;
  }, [user, activeBooking]);

  useEffect(() => {
    let timer: NodeJS.Timeout | number;
    if (activeBooking && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleReject();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeBooking, timeLeft]);

  const handleNewBooking = (booking: BookingNotification) => {
    setActiveBooking(booking);
    setTimeLeft(30);
    Vibration.vibrate([500, 500, 500]); // Vibrate three times
  };

  const handleAccept = async () => {
    if (!activeBooking || !user) return;

    try {
      setLoading(true);
      await bookingService.acceptBooking(activeBooking.id, user.id);
      await notificationService.sendBookingNotification(
        activeBooking.passengerId,
        'passenger',
        'accepted',
        'Your ride has been accepted by the driver.'
      );
      router.push('/driver/rides/in-progress');
    } catch (error) {
      console.error('Error accepting booking:', error);
    } finally {
      setLoading(false);
      setActiveBooking(null);
    }
  };

  const handleReject = async () => {
    if (!activeBooking || !user) return;

    try {
      setLoading(true);
      await bookingService.rejectBooking(activeBooking.id);
      await notificationService.sendBookingNotification(
        activeBooking.passengerId,
        'passenger',
        'rejected',
        'The driver has rejected your ride request.'
      );
    } catch (error) {
      console.error('Error rejecting booking:', error);
    } finally {
      setLoading(false);
      setActiveBooking(null);
    }
  };

  if (!activeBooking) return null;

  return (
    <View style={styles.container}>
      <View style={styles.notification}>
        <View style={styles.header}>
          <Text style={styles.title}>New Ride Request</Text>
          <Text style={styles.timer}>{timeLeft}s</Text>
        </View>

        <View style={styles.passengerInfo}>
          <Image
            source={
              activeBooking.passengerAvatar
                ? { uri: activeBooking.passengerAvatar }
                : require('@/assets/images/default-avatar.png')
            }
            style={styles.avatar}
          />
          <View style={styles.passengerDetails}>
            <Text style={styles.passengerName}>
              {activeBooking.passengerName}
            </Text>
            <Text style={styles.fare}>{activeBooking.fare} RWF</Text>
          </View>
        </View>

        <View style={styles.locationInfo}>
          <View style={styles.locationRow}>
            <MapPin size={20} color={Colors.primary.default} />
            <Text style={styles.locationText}>{activeBooking.pickup}</Text>
          </View>
          <View style={styles.locationRow}>
            <MapPin size={20} color={Colors.error.default} />
            <Text style={styles.locationText}>{activeBooking.dropoff}</Text>
          </View>
          <View style={styles.locationRow}>
            <Clock size={20} color={Colors.neutral.medium} />
            <Text style={styles.locationText}>{activeBooking.pickupTime}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Reject"
            onPress={handleReject}
            variant="outline"
            style={[styles.actionButton, { flex: 1 }]}
            disabled={loading}
          />
          <Button
            title={loading ? 'Accepting...' : 'Accept'}
            onPress={handleAccept}
            style={[styles.actionButton, { flex: 1 }]}
            disabled={loading}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
    zIndex: 1000,
  },
  notification: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Layout.borderRadius.l,
    padding: Layout.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.l,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.neutral.black,
  },
  timer: {
    fontSize: 16,
    color: Colors.error.default,
    fontWeight: 'bold',
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.l,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: Layout.spacing.m,
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.xs,
  },
  fare: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.default,
  },
  locationInfo: {
    backgroundColor: Colors.neutral.light,
    borderRadius: Layout.borderRadius.m,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.l,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.s,
  },
  locationText: {
    marginLeft: Layout.spacing.s,
    fontSize: 14,
    color: Colors.neutral.dark,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.m,
  },
  actionButton: {
    height: 50,
  },
});



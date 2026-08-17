import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Alert, SafeAreaView } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';
import { useAuth } from '@/hooks/AuthContext';
import { router } from 'expo-router';
import { listenToPendingDrivers, approveDriver, rejectDriver } from '@/services/ride';

interface PendingDriver {
  id: string;
  name: string;
  phone: string;
  serviceProvider?: string;
  vehicleType?: string;
  licenseNumber?: string;
  licenseImageUrl?: string;
}

export default function PendingDrivers() {
  const { user, loading: authLoading } = useAuth();
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      Alert.alert('Access denied', 'Only admins can view this screen.');
      router.back();
      return;
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const unsubscribe = listenToPendingDrivers((list) => setDrivers(list));
    return unsubscribe;
  }, [user]);

  const handleApprove = async (driverId: string) => {
    setActionLoading(driverId);
    try {
      await approveDriver(driverId);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve driver.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (driverId: string) => {
    setActionLoading(driverId);
    try {
      await rejectDriver(driverId);
    } catch (error) {
      Alert.alert('Error', 'Failed to reject driver.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Pending Drivers</Text>
      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending drivers.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.licenseImageUrl && (
              <Image source={{ uri: item.licenseImageUrl }} style={styles.licenseImage} />
            )}
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.detail}>Phone: {item.phone}</Text>
            <Text style={styles.detail}>Vehicle: {item.vehicleType || 'N/A'}</Text>
            <Text style={styles.detail}>Provider: {item.serviceProvider || 'N/A'}</Text>
            <Text style={styles.detail}>License #: {item.licenseNumber || 'N/A'}</Text>
            <View style={styles.actions}>
              <Button
                title="Reject"
                onPress={() => handleReject(item.id)}
                variant="outline"
                style={[styles.actionButton, { flex: 1 }]}
                loading={actionLoading === item.id}
              />
              <Button
                title="Approve"
                onPress={() => handleApprove(item.id)}
                style={[styles.actionButton, { flex: 1 }]}
                loading={actionLoading === item.id}
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.white },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.secondary.default,
    padding: Layout.spacing.xl,
  },
  listContent: { paddingHorizontal: Layout.spacing.xl, paddingBottom: Layout.spacing.xl },
  emptyText: { textAlign: 'center', color: Colors.neutral.dark, marginTop: Layout.spacing.xl },
  card: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Layout.borderRadius.m,
    borderWidth: 1,
    borderColor: Colors.neutral.light,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.m,
  },
  licenseImage: {
    width: '100%',
    height: 160,
    borderRadius: Layout.borderRadius.m,
    marginBottom: Layout.spacing.m,
  },
  name: { fontSize: 18, fontWeight: '700', color: Colors.secondary.default, marginBottom: Layout.spacing.xs },
  detail: { fontSize: 14, color: Colors.neutral.dark, marginBottom: Layout.spacing.xs },
  actions: { flexDirection: 'row', gap: Layout.spacing.m, marginTop: Layout.spacing.m },
  actionButton: { height: 44 },
});

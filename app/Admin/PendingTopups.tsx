import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, SafeAreaView } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';
import { useAuth } from '@/hooks/AuthContext';
import { router } from 'expo-router';
import { listenToPendingTopups, approveTopup, rejectTopup, TopupRequest } from '@/services/topup';

export default function PendingTopups() {
  const { user, loading: authLoading } = useAuth();
  const [topups, setTopups] = useState<TopupRequest[]>([]);
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
    const unsubscribe = listenToPendingTopups((list) => setTopups(list));
    return unsubscribe;
  }, [user]);

  const handleApprove = async (topup: TopupRequest) => {
    setActionLoading(topup.id);
    try {
      await approveTopup(topup.id, topup.userId, topup.amount);
    } catch (error) {
      Alert.alert('Error', 'Failed to approve top up.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (topupId: string) => {
    setActionLoading(topupId);
    try {
      await rejectTopup(topupId);
    } catch (error) {
      Alert.alert('Error', 'Failed to reject top up.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Pending Top Ups</Text>
      <FlatList
        data={topups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No pending top ups.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.userName}</Text>
            <Text style={styles.detail}>Amount: {item.amount.toLocaleString()} Rwf</Text>
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
                onPress={() => handleApprove(item)}
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
  name: { fontSize: 18, fontWeight: '700', color: Colors.secondary.default, marginBottom: Layout.spacing.xs },
  detail: { fontSize: 14, color: Colors.neutral.dark, marginBottom: Layout.spacing.xs },
  actions: { flexDirection: 'row', gap: Layout.spacing.m, marginTop: Layout.spacing.m },
  actionButton: { height: 44 },
});

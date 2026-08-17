import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/AuthContext';

export default function WalletCard() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.balanceContainer}>
        <Text style={styles.label}>Wallet Balance</Text>
        <View style={styles.amountRow}>
          <View style={styles.currencyContainer}>
            <Text style={styles.currencyText}>RWF</Text>
          </View>
          <Text style={styles.amount}>{(user?.walletBalance ?? 0).toLocaleString()}Rwf</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.topUpButton} onPress={() => router.push('/Account/TopUp')}>
        <Text style={styles.topUpText}>Top up +</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.l,
  },
  balanceContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: Colors.secondary.default,
    marginBottom: Layout.spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyContainer: {
    backgroundColor: Colors.secondary.default,
    paddingHorizontal: Layout.spacing.s,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.s,
    marginRight: Layout.spacing.s,
  },
  currencyText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary.default,
  },
  topUpButton: {
    backgroundColor: Colors.secondary.default,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.s,
    borderRadius: Layout.borderRadius.m,
  },
  topUpText: {
    color: Colors.neutral.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

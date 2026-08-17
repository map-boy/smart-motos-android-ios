import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { paymentService } from '../../services/payment';
import { useAuth } from '../../hooks/useAuth';

export const DriverEarnings: React.FC = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState({
    total: 0,
    available: 0,
    withdrawn: 0,
  });
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadEarnings();
    }
  }, [user]);

  const loadEarnings = async () => {
    try {
      const driverEarnings = await paymentService.getDriverEarnings(user!.id);
      setEarnings(driverEarnings);
    } catch (error) {
      console.error('Error loading earnings:', error);
      Alert.alert('Error', 'Failed to load earnings');
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || isNaN(Number(withdrawalAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amount = Number(withdrawalAmount);
    if (amount <= 0) {
      Alert.alert('Error', 'Please enter an amount greater than 0');
      return;
    }

    setLoading(true);
    try {
      const result = await paymentService.requestWithdrawal(user!.id, amount);
      if (result.success) {
        Alert.alert('Success', result.message);
        setWithdrawalAmount('');
        loadEarnings(); // Refresh earnings
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Error', 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.earningsContainer}>
        <View style={styles.earningCard}>
          <Text style={styles.earningLabel}>Total Earnings</Text>
          <Text style={styles.earningAmount}>${earnings.total.toFixed(2)}</Text>
        </View>

        <View style={styles.earningCard}>
          <Text style={styles.earningLabel}>Available Balance</Text>
          <Text style={styles.earningAmount}>
            ${earnings.available.toFixed(2)}
          </Text>
        </View>

        <View style={styles.earningCard}>
          <Text style={styles.earningLabel}>Withdrawn</Text>
          <Text style={styles.earningAmount}>
            ${earnings.withdrawn.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.withdrawalSection}>
        <Text style={styles.sectionTitle}>Withdraw Earnings</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount to withdraw"
          keyboardType="numeric"
          value={withdrawalAmount}
          onChangeText={setWithdrawalAmount}
        />
        <TouchableOpacity
          style={[styles.withdrawButton, loading && styles.disabledButton]}
          onPress={handleWithdrawal}
          disabled={loading}
        >
          <Text style={styles.withdrawButtonText}>
            {loading ? 'Processing...' : 'Withdraw'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Withdrawal Information</Text>
        <Text style={styles.infoText}>• Minimum withdrawal amount: $50</Text>
        <Text style={styles.infoText}>
          • Processing time: 1-2 business days
        </Text>
        <Text style={styles.infoText}>• Commission rate: 15%</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  earningsContainer: {
    padding: 20,
  },
  earningCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
  },
  earningLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  earningAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  withdrawalSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  withdrawButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  withdrawButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    margin: 20,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
});

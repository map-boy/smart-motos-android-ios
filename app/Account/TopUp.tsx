import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Linking, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';
import { useAuth } from '@/hooks/AuthContext';
import { createTopupRequest } from '@/services/topup';

const MOMO_NUMBER = '0790246983';
const WHATSAPP_NUMBER = '250790246983';

export default function TopUp() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      'Hi, I just sent ' + (amount || 'X') + ' Rwf to ' + MOMO_NUMBER + ' for a Smart Motos top up. Here is my payment screenshot.'
    );
    Linking.openURL('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + message);
  };

  const handleConfirm = async () => {
    const numericAmount = parseInt(amount, 10);
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Enter amount', 'Please enter the amount you sent.');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      await createTopupRequest(user.id, user.name, numericAmount);
      Alert.alert(
        'Request sent',
        'Your top up is pending verification. It will reflect once approved.'
      );
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to send top up request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Top Up Wallet</Text>
      <Text style={styles.instructions}>
        Send money via Mobile Money to the number below, then tap "Send screenshot on WhatsApp" to confirm your payment.
      </Text>
      <View style={styles.numberBox}>
        <Text style={styles.numberLabel}>MoMo Number</Text>
        <Text style={styles.number}>{MOMO_NUMBER}</Text>
      </View>
      <Text style={styles.label}>Amount sent (Rwf)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="e.g. 5000"
      />
      <Button title="Send screenshot on WhatsApp" onPress={openWhatsApp} variant="outline" style={styles.whatsappBtn} />
      <Button title="I've sent it" onPress={handleConfirm} loading={loading} style={styles.confirmBtn} />
      <Text style={styles.note}>
        Your wallet will be updated once an admin verifies your payment on WhatsApp.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.white, padding: Layout.spacing.xl },
  title: { fontSize: 22, fontWeight: '700', color: Colors.secondary.default, marginBottom: Layout.spacing.m },
  instructions: { fontSize: 14, color: Colors.neutral.dark, marginBottom: Layout.spacing.l, lineHeight: 20 },
  numberBox: {
    backgroundColor: Colors.neutral.lightest,
    borderRadius: Layout.borderRadius.m,
    padding: Layout.spacing.l,
    alignItems: 'center',
    marginBottom: Layout.spacing.l,
  },
  numberLabel: { fontSize: 13, color: Colors.neutral.dark, marginBottom: Layout.spacing.xs },
  number: { fontSize: 28, fontWeight: '700', color: Colors.secondary.default, letterSpacing: 1 },
  label: { fontSize: 14, color: Colors.neutral.dark, marginBottom: Layout.spacing.xs },
  input: {
    backgroundColor: Colors.neutral.lightest,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.secondary.default,
    marginBottom: Layout.spacing.l,
  },
  whatsappBtn: { marginBottom: Layout.spacing.m },
  confirmBtn: { marginBottom: Layout.spacing.l },
  note: { fontSize: 12, color: Colors.neutral.medium, textAlign: 'center' },
});

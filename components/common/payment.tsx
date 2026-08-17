import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import Button from '@/components/UI/Button';
import Layout from '@/constants/Layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neutral.white }}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment Methods</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add Payment Method</Text>
            <Text style={styles.cardDescription}>
              Add a new payment method to make your rides more convenient
            </Text>
            <Button
              title="Add New Card"
              onPress={() => router.push('/Ride/payment')}
              variant="primary"
              size="large"
              style={styles.button}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            {/* Add payment history list here */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
  },
  header: {
    padding: Layout.spacing.xl,
    paddingTop: 60,
    backgroundColor: Colors.primary.default,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.secondary.default,
  },
  content: {
    padding: Layout.spacing.xl,
  },
  card: {
    backgroundColor: Colors.secondary.default,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.white,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.neutral.light,
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.dark,
    marginBottom: 12,
  },
}); 
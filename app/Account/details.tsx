import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { ChevronLeft } from 'lucide-react-native';
import { getAccountDetails, updateAccountDetails } from '@/services/auth';
import Button from '@/components/UI/Button';

export default function AccountDetails() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    setLoading(true);
    const result = await getAccountDetails();
    setLoading(false);

    if (result.success && result.data) {
      setFormData(result.data);
    } else {
      setError(result.error || 'Failed to load account details');
    }
  };

  const handleSave = async () => {
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    const result = await updateAccountDetails({
      name: formData.name,
      email: formData.email,
    });
    setSaving(false);

    if (result.success) {
      Alert.alert(
        'Success',
        result.message || 'Account details updated successfully'
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to update account details');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.default} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color={Colors.primary.default} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account details</Text>
      </View>
      <View style={styles.form}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(value) =>
            setFormData((prev) => ({ ...prev, name: value }))
          }
          placeholder="Enter your full name"
          placeholderTextColor={Colors.neutral.light}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(value) =>
            setFormData((prev) => ({ ...prev, email: value }))
          }
          placeholder="Enter your email"
          placeholderTextColor={Colors.neutral.light}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Phone number</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={formData.phone}
          editable={false}
        />

        <Button
          title="Save Changes"
          onPress={handleSave}
          variant="primary"
          size="large"
          loading={saving}
          style={styles.saveBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.secondary.default,
    paddingTop: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    marginBottom: 18,
  },
  headerTitle: {
    color: Colors.neutral.white,
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
  form: {
    flex: 1,
    paddingHorizontal: Layout.spacing.xl,
  },
  label: {
    color: Colors.neutral.white,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.neutral.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.secondary.default,
    fontWeight: '500',
  },
  disabledInput: {
    backgroundColor: Colors.neutral.light,
    color: Colors.secondary.default,
  },
  saveBtn: {
    marginTop: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});

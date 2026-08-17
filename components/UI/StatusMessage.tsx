import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from './Button';

interface StatusMessageProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  buttonText: string;
  onButtonPress: () => void;
}

export default function StatusMessage({
  type,
  title,
  message,
  buttonText,
  onButtonPress,
}: StatusMessageProps) {
  const isSuccess = type === 'success';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          isSuccess ? styles.successCard : styles.errorCard,
        ]}
      >
        <Text
          style={[
            styles.title,
            isSuccess ? styles.successTitle : styles.errorTitle,
          ]}
        >
          {title}
        </Text>
        <Text style={styles.message}>{message}</Text>
        <Button
          title={buttonText}
          onPress={onButtonPress}
          variant={isSuccess ? 'primary' : 'secondary'}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary.default,
    padding: Layout.spacing.l,
  },
  card: {
    width: '100%',
    borderRadius: Layout.borderRadius.l,
    padding: Layout.spacing.l,
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: Colors.neutral.white,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success.default,
  },
  errorCard: {
    backgroundColor: Colors.neutral.white,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error.default,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Layout.spacing.s,
    textAlign: 'center',
  },
  successTitle: {
    color: Colors.success.default,
  },
  errorTitle: {
    color: Colors.error.default,
  },
  message: {
    fontSize: 14,
    color: Colors.neutral.darker,
    textAlign: 'center',
    marginBottom: Layout.spacing.l,
    lineHeight: 20,
  },
  button: {
    minWidth: 150,
  },
});
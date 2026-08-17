import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';

interface SocialAuthButtonsProps {
  onGooglePress: () => void;
}

export default function SocialAuthButtons({ onGooglePress }: SocialAuthButtonsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.orText}>Or continue with</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={onGooglePress}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.socialText}>G</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Layout.spacing.l,
  },
  orText: {
    color: Colors.neutral.medium,
    fontSize: 14,
    marginBottom: Layout.spacing.m,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  socialButton: {
    marginHorizontal: Layout.spacing.s,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.lighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary.default,
  },
});
import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import Colors from '@/constants/Colors';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Screen</Text>
      <Text style={styles.subtext}>
        This is a placeholder for the Home screen.
        It will be implemented in the next phase.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.white,
  },
  text: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.secondary.default,
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: Colors.neutral.dark,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
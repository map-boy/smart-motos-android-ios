import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

const WebMapFallback = ({ style }: { style?: object }) => (
  <View style={[styles.container, style, styles.webPlaceholder]}>
    <Text style={styles.webText}>
      Map view is not available on web platform
    </Text>
    <Text style={styles.webSubText}>
      Please use the mobile app to access the full map features
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  webSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default WebMapFallback;

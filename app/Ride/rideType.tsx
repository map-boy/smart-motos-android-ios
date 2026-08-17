import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';

const RIDE_TYPES = [
  {
    id: 'bike',
    label: 'Bike',
    image: 'https://img.icons8.com/ios-filled/100/000000/motorcycle.png',
    price: '800 Rwf',
    eta: '5 min',
  },
  {
    id: 'car',
    label: 'Car',
    image: 'https://img.icons8.com/ios-filled/100/000000/car.png',
    price: '1200 Rwf',
    eta: '7 min',
  },
  {
    id: 'van',
    label: 'Van',
    image: 'https://img.icons8.com/ios-filled/100/000000/van.png',
    price: '2000 Rwf',
    eta: '10 min',
  },
];

export default function RideTypeScreen() {
  const [selected, setSelected] = useState('bike');
  const params = useLocalSearchParams();

  const handleContinue = () => {
    router.push({
      pathname: '/Ride/fareEstimate',
      params: { ...params, rideType: selected },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Ride Type</Text>
      <View style={styles.cards}>
        {RIDE_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.card, selected === type.id && styles.selectedCard]}
            onPress={() => setSelected(type.id)}
          >
            <Image source={{ uri: type.image }} style={styles.image} />
            <Text style={styles.label}>{type.label}</Text>
            <Text style={styles.price}>{type.price}</Text>
            <Text style={styles.eta}>ETA: {type.eta}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Button title="Continue" onPress={handleContinue} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    padding: Layout.spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.secondary.default,
    marginBottom: Layout.spacing.l,
  },
  cards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.xl,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.secondary.default,
    borderRadius: 12,
    marginHorizontal: 6,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.secondary.default,
  },
  selectedCard: {
    borderColor: Colors.primary.default,
    backgroundColor: Colors.primary.light,
  },
  image: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral.white,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: Colors.primary.default,
    marginBottom: 2,
  },
  eta: {
    fontSize: 12,
    color: Colors.neutral.light,
  },
  button: {
    marginTop: Layout.spacing.xl,
  },
}); 
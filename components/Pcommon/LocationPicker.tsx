import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import { MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import MapboxService from '@/services/mapboxService';
import { MAPBOX_CONFIG } from '@/config/mapbox';

interface Place {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
}

interface LocationPickerProps {
  label: string;
  placeholder: string;
  value: string;
  onLocationSelect: (
    location: string,
    coordinates: { lat: number; lng: number }
  ) => void;
  style?: any;
  labelStyle?: any;
}

export function LocationPicker({
  label,
  placeholder,
  value,
  onLocationSelect,
  style,
  labelStyle,
}: LocationPickerProps) {
  const [searchText, setSearchText] = useState(value);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapboxService = MapboxService.getInstance();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchText(value);
  }, [value]);

  const handleSearch = async (text: string) => {
    console.log('Search text:', text); // Debug log
    setSearchText(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce the search to avoid too many API calls
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        setShowSuggestions(true);

        // Use Mapbox Geocoding API v6 for better geocoding results
        const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
          text
        )}&access_token=${MAPBOX_CONFIG.ACCESS_TOKEN}&language=en&limit=10&country=RW`;

        console.log('Making API request to:', url); // Debug log

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log('Response status:', response.status); // Debug log

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response:', data); // Debug log

        if (!data.features) {
          throw new Error('Invalid response format');
        }

        const places: Place[] = data.features.map(
          (feature: any, index: number) => ({
            id: feature.properties?.mapbox_id || feature.id || `place-${index}`,
            name:
              feature.properties?.name_preferred ||
              feature.properties?.name ||
              'Unknown location',
            address:
              feature.properties?.full_address ||
              feature.properties?.place_formatted ||
              'Unknown address',
            location: {
              lat:
                feature.geometry?.coordinates[1] ||
                feature.properties?.coordinates?.latitude,
              lng:
                feature.geometry?.coordinates[0] ||
                feature.properties?.coordinates?.longitude,
            },
          })
        );

        console.log('Parsed places:', places); // Debug log
        setSuggestions(places);
      } catch (error) {
        console.error('Error searching places:', error);

        let errorMessage =
          'Please check your internet connection and try again';
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
          } else if (error.message.includes('Network request failed')) {
            errorMessage = 'No internet connection. Please check your network.';
          }
        }

        // Show user-friendly error message
        setSuggestions([
          {
            id: 'error',
            name: 'Network error',
            address: errorMessage,
            location: { lat: 0, lng: 0 },
          },
        ]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  };

  const handleSelectLocation = (place: Place) => {
    // Don't process error items
    if (place.id === 'error') {
      return;
    }

    setSearchText(place.name);
    setShowSuggestions(false);
    onLocationSelect(place.name, place.location);
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const address = await mapboxService.reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      );

      const currentLocationPlace: Place = {
        id: 'current-location',
        name: 'Current Location',
        address: address || 'Current Location',
        location: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
      };

      handleSelectLocation(currentLocationPlace);
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setLoading(false);
      setShowSuggestions(false);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          value={searchText}
          onChangeText={handleSearch}
          placeholder={placeholder}
          style={[styles.input, style]}
          placeholderTextColor={Colors.neutral.medium}
        />
        {loading && (
          <ActivityIndicator
            style={styles.loadingIndicator}
            color={Colors.primary.default}
          />
        )}
      </View>
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleUseCurrentLocation}
          >
            <MapPin size={20} color={Colors.primary.default} />
            <Text style={styles.currentLocationText}>Use current location</Text>
          </TouchableOpacity>
          <ScrollView style={styles.suggestionsList}>
            {suggestions.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectLocation(place)}
              >
                <Text style={styles.suggestionName}>{place.name}</Text>
                <Text style={styles.suggestionAddress}>{place.address}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.m,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Layout.spacing.s,
    color: Colors.neutral.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.neutral.white,
    color: Colors.neutral.black,
    borderRadius: Layout.borderRadius.m,
    paddingHorizontal: Layout.spacing.m,
    paddingVertical: Layout.spacing.m,
  },
  loadingIndicator: {
    position: 'absolute',
    right: Layout.spacing.m,
  },
  suggestionsContainer: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Layout.borderRadius.m,
    marginTop: Layout.spacing.xs,
    maxHeight: 200,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  currentLocationText: {
    marginLeft: Layout.spacing.s,
    color: Colors.primary.default,
    fontSize: 16,
  },
  suggestionsList: {
    maxHeight: 150,
  },
  suggestionItem: {
    padding: Layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.light,
  },
  suggestionName: {
    fontSize: 16,
    color: Colors.neutral.black,
    marginBottom: Layout.spacing.xs,
  },
  suggestionAddress: {
    fontSize: 14,
    color: Colors.neutral.medium,
  },
});

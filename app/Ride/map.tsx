import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import {
  Star,
  Phone,
  MessageSquare,
  Pause,
  Play,
  Menu,
  ChevronLeft,
  Search,
  MapPin,
} from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Layout from '@/constants/Layout';
import Button from '@/components/UI/Button';
import MapComponent from '@/components/Pcommon/MapComponent';
import { useRide, DriverInfo, AvailableRide } from '@/hooks/useRideContext';
import FloatingActionButton from '@/components/common/FloatingActionButton';
import { getNearbyDrivers, getDriverById } from '@/services/ride';
import MapboxService from '@/services/mapboxService';
import * as Location from 'expo-location';

const DUMMY_DRIVER: DriverInfo = {
  id: '1',
  name: 'Kamana Emmanuel',
  rating: 4.5,
  plate: 'JDM PL8S',
  avatar:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-05-02%20215507-YaoGHTbbSX0Yy08KjuYtLH34ltoiYQ.png',
  location: { latitude: -1.944, longitude: 30.0618 },
};

const DUMMY_AVAILABLE_RIDES: AvailableRide[] = [
  { id: 'ride1', location: { latitude: -1.94, longitude: 30.065 } },
  { id: 'ride2', location: { latitude: -1.948, longitude: 30.058 } },
  { id: 'ride3', location: { latitude: -1.955, longitude: 30.07 } },
];

const DUMMY_TRIP_ROUTE = [
  { latitude: -1.944, longitude: 30.0618 },
  { latitude: -1.95, longitude: 30.07 },
  { latitude: -1.955, longitude: 30.08 },
  { latitude: -1.96, longitude: 30.09 },
  { latitude: -1.965, longitude: 30.1 },
];

const DUMMY_TRIP_DETAILS = {
  distance: '24.4 km',
  time: '58 min',
  baseFare: '1500 Rwf',
  distanceFare: '0 Rwf',
  waitingFee: '1500 Rwf',
  total: '3000 Rwf',
};

// Helper function to validate coordinates
const isValidCoordinate = (
  coord: any
): coord is { latitude: number; longitude: number } => {
  return (
    coord &&
    typeof coord === 'object' &&
    typeof coord.latitude === 'number' &&
    typeof coord.longitude === 'number' &&
    !isNaN(coord.latitude) &&
    !isNaN(coord.longitude)
  );
};

export default function MapScreen() {
  const {
    rideState,
    setRideStatus,
    setCurrentDriver,
    setCurrentTrip,
    setAvailableRides,
    updateBookingDetails,
  } = useRide();
  const navigation = useNavigation();
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState('');
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [nearbyDrivers, setNearbyDrivers] = useState<AvailableRide[]>([]);
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [assignedDriver, setAssignedDriver] = useState<DriverInfo | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState<
    'pickup' | 'dropoff' | null
  >(null);
  const [selectedPickup, setSelectedPickup] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedDropoff, setSelectedDropoff] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapboxService = MapboxService.getInstance();

  // Get user's current location
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission denied',
            'Location permission is required to use the map.'
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const currentLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(currentLocation);

        // Set current location as default pickup location
        setSelectedPickup(currentLocation);

        // Update booking details with user's current location as pickup
        try {
          const address = await mapboxService.reverseGeocode(
            currentLocation.latitude,
            currentLocation.longitude
          );

          updateBookingDetails({
            pickup: {
              description: address || 'Current Location',
              coords: {
                lat: currentLocation.latitude,
                lng: currentLocation.longitude,
              },
            },
          });

          console.log('Set user location as pickup:', currentLocation); // Debug log
        } catch (error) {
          console.error('Error reverse geocoding user location:', error);
          // Still set the pickup location even if reverse geocoding fails
          updateBookingDetails({
            pickup: {
              description: 'Current Location',
              coords: {
                lat: currentLocation.latitude,
                lng: currentLocation.longitude,
              },
            },
          });
        }
      } catch (error) {
        console.error('Error getting user location:', error);
        Alert.alert('Location Error', 'Could not get your current location.');
      }
    };

    getUserLocation();
  }, []);

  // Ensure the ride status is set to booking_map when component mounts
  useEffect(() => {
    if (rideState.status === 'idle') {
      setRideStatus('booking_map');
    }
  }, [rideState.status, setRideStatus]);

  const pickupCoords = useMemo(() => {
    if (!rideState.bookingDetails.pickup?.coords) return null;
    return {
      latitude: rideState.bookingDetails.pickup.coords.lat,
      longitude: rideState.bookingDetails.pickup.coords.lng,
    };
  }, [rideState.bookingDetails.pickup]);

  const dropoffCoords = useMemo(() => {
    if (!rideState.bookingDetails.dropoff?.coords) return null;
    return {
      latitude: rideState.bookingDetails.dropoff.coords.lat,
      longitude: rideState.bookingDetails.dropoff.coords.lng,
    };
  }, [rideState.bookingDetails.dropoff]);

  useEffect(() => {
    const fetchMapData = async () => {
      // Only fetch drivers and route if both pickup and dropoff are set
      if (pickupCoords && dropoffCoords) {
        try {
          // Fetch nearby drivers
          const drivers = (await getNearbyDrivers(
            pickupCoords
          )) as any[];
          setNearbyDrivers(
            drivers.map((d) => ({
              ...d,
              location: { latitude: d.latitude, longitude: d.longitude },
            }))
          );

          // Find and set the assigned driver details
          if (rideState.bookingDetails.driverId) {
            const assigned: any = await getDriverById(
              rideState.bookingDetails.driverId.toString()
            );
            if (assigned) {
              const driverLocation = drivers.find((d) => d.id === assigned.id);
              const driverData: DriverInfo = {
                id: assigned.id,
                name: assigned.name || 'Unnamed Driver',
                rating: assigned.rating || 0,
                plate: assigned.vehicle_plate || 'No Plate',
                avatar:
                  assigned.avatar_url ||
                  'https://example.com/default-avatar.png',
                location: driverLocation
                  ? {
                      latitude: driverLocation.lat,
                      longitude: driverLocation.lng,
                    }
                  : undefined,
              };
              setAssignedDriver(driverData);
              setCurrentDriver(driverData);
            }
          }

          // Generate route using Mapbox
          const route = await mapboxService.getDirections(
            {
              latitude: pickupCoords.latitude,
              longitude: pickupCoords.longitude,
            },
            {
              latitude: dropoffCoords.latitude,
              longitude: dropoffCoords.longitude,
            }
          );

          if (route) {
            // Convert route coordinates to polyline format for MapComponent
            const coordinates = route.coordinates
              .map((coord) => `${coord.latitude},${coord.longitude}`)
              .join('|');
            setRoutePolyline(coordinates);
          }
        } catch (error) {
          Alert.alert(
            'Map Error',
            'Could not load map data. Please try again.'
          );
          console.error('Error fetching map data:', error);
          console.log(error);
        }
      }
      // If pickup/dropoff are not set, allow the user to select them on the map
    };

    fetchMapData();
  }, [pickupCoords, dropoffCoords, rideState.bookingDetails.driverId]);

  useEffect(() => {
    if (rideState.status === 'arrived') {
      setOverlayMessage('You have arrived your destination');
      setShowOverlay(true);
    } else if (rideState.status === 'paused') {
      setOverlayMessage('Your trip has been put on hold');
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
      setOverlayMessage('');
    }

    if (rideState.status === 'payment') {
      router.push('/Ride/payment');
    } else if (rideState.status === 'rating') {
      router.replace('/Ride/book');
    }
  }, [rideState.status]);

  useEffect(() => {
    if (rideState.status === 'enroute') {
      const rideTimer = setTimeout(() => {
        setRideStatus('arrived');
      }, 15000); // 15 seconds
      return () => clearTimeout(rideTimer);
    }
  }, [rideState.status, setRideStatus]);

  const handleHailRide = () => {
    setRideStatus('searching');
  };
  const handleAcceptRide = () => {
    if (assignedDriver) {
      setCurrentDriver(assignedDriver);
    }
    const dist = (rideState.bookingDetails.distance || 0).toFixed(1);
    const dur = Math.round(rideState.bookingDetails.duration || 0);
    setCurrentTrip({
      distance: dist + ' km',
      time: dur + ' min',
      baseFare: '1500 Rwf',
      distanceFare: '0 Rwf',
      waitingFee: '1500 Rwf',
      total: (rideState.bookingDetails.fare || 0) + ' Rwf',
    });
    setRideStatus('accepted');
  };
  const handleRejectRide = () => {
    setRideStatus('booking_map');
    setAvailableRides(nearbyDrivers);
  };

  const handleConfirmRide = () => {
    setRideStatus('enroute');
  };

  const handlePauseRide = () => {
    setRideStatus('paused');
  };

  const handleResumeRide = () => {
    setRideStatus('enroute');
  };

  const handleCompleteRide = () => {
    setRideStatus('payment');
  };

  const handleArrivedConfirm = () => {
    handleCompleteRide();
  };

  // Handle map tap to select pickup/dropoff locations
  const handleMapTap = async (event: any) => {
    console.log('Map tap event received:', event); // Debug log
    console.log('isSelectingLocation:', isSelectingLocation); // Debug log

    if (!isSelectingLocation) {
      console.log('No location selection mode active'); // Debug log
      return;
    }

    console.log('Processing map tap for:', isSelectingLocation); // Debug log

    // Handle different possible event structures
    let latitude, longitude;

    if (event.geometry?.coordinates) {
      // Mapbox format: [longitude, latitude]
      [longitude, latitude] = event.geometry.coordinates;
      console.log('Using geometry.coordinates:', { longitude, latitude }); // Debug log
    } else if (event.coordinates) {
      // Alternative format
      [longitude, latitude] = event.coordinates;
      console.log('Using coordinates:', { longitude, latitude }); // Debug log
    } else if (event.latitude && event.longitude) {
      // Direct coordinate format
      latitude = event.latitude;
      longitude = event.longitude;
      console.log('Using direct coordinates:', { latitude, longitude }); // Debug log
    } else {
      console.error('Unknown event structure:', event);
      Alert.alert('Error', 'Could not determine tap location.');
      return;
    }

    console.log('Final coordinates:', { latitude, longitude }); // Debug log

    const location = { latitude, longitude };

    try {
      // Reverse geocode to get address
      const address = await mapboxService.reverseGeocode(latitude, longitude);
      console.log('Reverse geocoded address:', address); // Debug log

      if (isSelectingLocation === 'pickup') {
        console.log('Setting pickup location'); // Debug log
        setSelectedPickup(location);
        updateBookingDetails({
          pickup: {
            description: address || 'Selected pickup location',
            coords: { lat: latitude, lng: longitude },
          },
        });
      } else {
        console.log('Setting dropoff location'); // Debug log
        setSelectedDropoff(location);
        updateBookingDetails({
          dropoff: {
            description: address || 'Selected dropoff location',
            coords: { lat: latitude, lng: longitude },
          },
        });
      }

      setIsSelectingLocation(null);
      console.log('Location selection completed'); // Debug log
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      Alert.alert('Error', 'Could not get address for selected location.');
    }
  };

  // Start location selection mode
  const startLocationSelection = (type: 'pickup' | 'dropoff') => {
    setIsSelectingLocation(type);
  };

  // Confirm booking with selected locations
  const confirmBooking = async () => {
    console.log('Confirm booking called'); // Debug log
    console.log('Selected pickup:', selectedPickup); // Debug log
    console.log('Selected dropoff:', selectedDropoff); // Debug log
    console.log('Current booking details:', rideState.bookingDetails); // Debug log

    if (!selectedPickup || !selectedDropoff) {
      Alert.alert('Error', 'Please select both pickup and dropoff locations.');
      return;
    }

    try {
      // Calculate route and fare
      const route = await mapboxService.getDirections(
        selectedPickup,
        selectedDropoff
      );
      if (route) {
        const distance = route.distance / 1000; // Convert to km
        const duration = route.duration / 60; // Convert to minutes
        const estimatedFare = Math.max(1000, distance * 500 + duration * 50); // Basic fare calculation

        console.log(
          'Route calculated - distance:',
          distance,
          'duration:',
          duration
        ); // Debug log

        // Update booking details while preserving existing pickup and dropoff info
        const updatedDetails = {
          // Preserve existing pickup and dropoff details
          pickup: rideState.bookingDetails.pickup,
          dropoff: rideState.bookingDetails.dropoff,
          // Add new calculated values
          distance: distance,
          duration: duration,
          fare: estimatedFare,
          polyline: route.coordinates
            .map((coord) => `${coord.latitude},${coord.longitude}`)
            .join('|'),
        };

        console.log('Updating booking details with:', updatedDetails); // Debug log
        updateBookingDetails(updatedDetails);

        console.log('Booking details updated, navigating to fare estimate'); // Debug log
        // Navigate to fare estimate screen
        router.push('/Ride/fareEstimate');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      Alert.alert('Error', 'Could not calculate route. Please try again.');
    }
  };

  const renderOverlay = () => {
    if (!showOverlay) return null;
    return (
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>{overlayMessage}</Text>
      </View>
    );
  };

  const renderBottomContent = () => {
    console.log('Current ride status:', rideState.status); // Debug log

    switch (rideState.status) {
      case 'booking_map':
        return (
          <View style={styles.bottomPanel}>
            {/* Location Selection UI */}
            <View style={styles.locationSelectionContainer}>
              <Text style={styles.locationSelectionTitle}>
                Select your locations
              </Text>

              {/* Pickup Location */}
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  isSelectingLocation === 'pickup' &&
                    styles.locationButtonActive,
                ]}
                onPress={() => startLocationSelection('pickup')}
              >
                <MapPin size={20} color={Colors.primary.default} />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationAddress}>
                    {selectedPickup
                      ? 'Location selected'
                      : 'Tap to select pickup'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Dropoff Location */}
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  isSelectingLocation === 'dropoff' &&
                    styles.locationButtonActive,
                ]}
                onPress={() => startLocationSelection('dropoff')}
              >
                <MapPin size={20} color={Colors.secondary.default} />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Dropoff</Text>
                  <Text style={styles.locationAddress}>
                    {selectedDropoff
                      ? 'Location selected'
                      : 'Tap to select dropoff'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Confirm Button */}
              {selectedPickup && selectedDropoff && (
                <Button
                  title="Confirm Booking"
                  onPress={confirmBooking}
                  style={styles.confirmButton}
                />
              )}
            </View>
          </View>
        );

      case 'idle':
        // Fallback UI for when status is still idle
        return (
          <View style={styles.bottomPanel}>
            <View style={styles.locationSelectionContainer}>
              <Text style={styles.locationSelectionTitle}>
                Select your locations
              </Text>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </View>
        );

      case 'searching':
        return (
          <View style={styles.bottomPanel}>
            <Text style={styles.scanningText}>Scanning...</Text>
          </View>
        );

      case 'accepted':
        return (
          <View style={styles.bottomPanel}>
            {rideState.currentDriver && (
              <View style={styles.driverInfoCard}>
                <Image
                  source={{ uri: rideState.currentDriver.avatar }}
                  style={styles.driverAvatar}
                />
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>
                    {rideState.currentDriver.name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        color={
                          i < Math.floor(rideState.currentDriver!.rating)
                            ? Colors.primary.default
                            : Colors.neutral.dark
                        }
                        fill={
                          i < Math.floor(rideState.currentDriver!.rating)
                            ? Colors.primary.default
                            : 'none'
                        }
                      />
                    ))}
                  </View>
                  <Text style={styles.driverLocation}>KG 18 Ave</Text>
                  <Text style={styles.driverTime}>8:00 AM</Text>
                </View>
                <View style={styles.communicationButtons}>
                  <TouchableOpacity style={styles.communicationButton}>
                    <MessageSquare size={24} color={Colors.primary.default} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.communicationButton}>
                    <Phone size={24} color={Colors.primary.default} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareText}>Share ride details</Text>
              <Search
                size={20}
                color={Colors.primary.default}
                style={styles.shareIcon}
              />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <Button
                title="Cancel"
                onPress={handleRejectRide}
                style={[styles.actionButton, { flex: 1 }]}
                variant="outline"
              />
              <Button
                title="Confirm"
                onPress={handleConfirmRide}
                style={[styles.actionButton, { flex: 1 }]}
              />
            </View>
          </View>
        );

      case 'enroute':
      case 'paused':
        return (
          <View style={styles.bottomPanel}>
            {rideState.currentDriver && (
              <View style={styles.driverInfoCard}>
                <Image
                  source={{ uri: rideState.currentDriver.avatar }}
                  style={styles.driverAvatar}
                />
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>
                    {rideState.currentDriver.name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        color={
                          i < Math.floor(rideState.currentDriver!.rating)
                            ? Colors.primary.default
                            : Colors.neutral.dark
                        }
                        fill={
                          i < Math.floor(rideState.currentDriver!.rating)
                            ? Colors.primary.default
                            : 'none'
                        }
                      />
                    ))}
                  </View>
                  <Text style={styles.driverLocation}>KG 18 Ave</Text>
                  <Text style={styles.driverTime}>8:00 AM</Text>
                </View>
                <View style={styles.communicationButtons}>
                  <TouchableOpacity style={styles.communicationButton}>
                    <MessageSquare size={24} color={Colors.primary.default} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.communicationButton}>
                    <Phone size={24} color={Colors.primary.default} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {rideState.status === 'paused' ? (
              <View style={styles.pausedActions}>
                <Text style={styles.pausedText}>
                  Your trip has been put on hold
                </Text>
                <Button
                  title="Resume"
                  onPress={handleResumeRide}
                  style={styles.actionButton}
                />
              </View>
            ) : (
              <TouchableOpacity style={styles.shareButton}>
                <Text style={styles.shareText}>Share ride details</Text>
                <Search
                  size={20}
                  color={Colors.primary.default}
                  style={styles.shareIcon}
                />
              </TouchableOpacity>
            )}

            {rideState.status !== 'paused' && (
              <Button
                title="Pause"
                onPress={handlePauseRide}
                style={styles.actionButton}
                variant="outline"
              />
            )}
          </View>
        );

      case 'arrived':
        return (
          <View style={styles.bottomPanel}>
            {rideState.currentDriver && (
              <View style={styles.driverInfoCard}>
                <Image
                  source={{ uri: rideState.currentDriver.avatar }}
                  style={styles.driverAvatar}
                />
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>
                    {rideState.currentDriver.name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        color={
                          i < Math.floor(rideState.currentDriver!.rating)
                            ? Colors.primary.default
                            : Colors.neutral.dark
                        }
                        fill={
                          i < Math.floor(rideState.currentDriver!.rating)
                            ? Colors.primary.default
                            : 'none'
                        }
                      />
                    ))}
                  </View>
                  <Text style={styles.driverLocation}>KG 18 Ave</Text>
                  <Text style={styles.driverTime}>8:00 AM</Text>
                </View>
                <View style={styles.communicationButtons}>
                  <TouchableOpacity style={styles.communicationButton}>
                    <MessageSquare size={24} color={Colors.primary.default} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.communicationButton}>
                    <Phone size={24} color={Colors.primary.default} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareText}>Share ride details</Text>
              <Search
                size={20}
                color={Colors.primary.default}
                style={styles.shareIcon}
              />
            </TouchableOpacity>
            <Button
              title="Confirm"
              onPress={handleArrivedConfirm}
              style={styles.actionButton}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapComponent
        userLocation={userLocation || pickupCoords}
        destination={dropoffCoords}
        nearbyDrivers={nearbyDrivers}
        assignedDriver={assignedDriver}
        routePolyline={routePolyline}
        selectedPickup={selectedPickup}
        selectedDropoff={selectedDropoff}
        onMapTap={handleMapTap}
        isSelectingLocation={isSelectingLocation}
      />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.neutral.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {rideState.status === 'booking_form' ||
          rideState.status === 'booking_map' ||
          rideState.status === 'searching'
            ? 'BOOK SEAT'
            : 'BOOK TRIP'}
        </Text>
        {(rideState.status === 'booking_map' ||
          rideState.status === 'searching') && (
          <TouchableOpacity style={styles.searchButton}>
            <Search size={24} color={Colors.neutral.white} />
          </TouchableOpacity>
        )}
        {(rideState.status === 'accepted' ||
          rideState.status === 'enroute' ||
          rideState.status === 'paused' ||
          rideState.status === 'arrived') &&
          rideState.currentDriver && (
            <TouchableOpacity style={styles.driverAvatarSmallContainer}>
              <Image
                source={{ uri: rideState.currentDriver.avatar }}
                style={styles.driverAvatarSmall}
              />
            </TouchableOpacity>
          )}
      </View>

      {(rideState.status === 'enroute' ||
        rideState.status === 'paused' ||
        rideState.status === 'arrived') &&
        rideState.currentTrip && (
          <View style={styles.timeDistanceContainer}>
            <View style={styles.timeDistanceBox}>
              <Text style={styles.timeDistanceText}>
                {rideState.currentTrip.time}
              </Text>
              <Text style={styles.timeDistanceLabel}>min</Text>
            </View>
            <View style={styles.timeDistanceBox}>
              <Text style={styles.timeDistanceText}>
                {rideState.currentTrip.distance.split(' ')[0]}
              </Text>
              <Text style={styles.timeDistanceLabel}>
                {rideState.currentTrip.distance.split(' ')[1]}
              </Text>
            </View>
          </View>
        )}

      {renderOverlay()}
      {renderBottomContent()}

      {/* Location Selection Indicator */}
      {isSelectingLocation && (
        <View style={styles.locationSelectionIndicator}>
          <Text style={styles.locationSelectionText}>
            Tap on the map to select {isSelectingLocation} location
          </Text>
          <TouchableOpacity
            style={styles.cancelSelectionButton}
            onPress={() => setIsSelectingLocation(null)}
          >
            <Text style={styles.cancelSelectionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.black,
  },
  topBar: {
    position: 'absolute',
    top: Layout.spacing.xl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.m,
    zIndex: 1,
  },
  backButton: {
    padding: Layout.spacing.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.white,
  },
  searchButton: {
    padding: Layout.spacing.s,
  },
  driverAvatarSmallContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  driverAvatarSmall: {
    width: '100%',
    height: '100%',
  },
  timeDistanceContainer: {
    position: 'absolute',
    top: 120,
    left: Layout.spacing.m,
    zIndex: 1,
    flexDirection: 'row',
    gap: Layout.spacing.s,
  },
  timeDistanceBox: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Layout.borderRadius.m,
    padding: Layout.spacing.s,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  timeDistanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary.default,
    marginRight: Layout.spacing.xs,
  },
  timeDistanceLabel: {
    fontSize: 14,
    color: Colors.neutral.dark,
    marginBottom: 2,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.neutral.black,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    paddingVertical: Layout.spacing.l,
    paddingHorizontal: Layout.spacing.xl,
    alignItems: 'center',
  },
  locationSelectionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  locationSelectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.neutral.white,
    marginBottom: Layout.spacing.m,
  },
  locationButton: {
    backgroundColor: Colors.neutral.white,
    borderRadius: Layout.borderRadius.m,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  locationButtonActive: {
    backgroundColor: Colors.primary.default,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary.default,
  },
  locationAddress: {
    fontSize: 14,
    color: Colors.neutral.dark,
  },
  confirmButton: {
    width: '100%',
    marginTop: Layout.spacing.m,
  },
  scanningText: {
    color: Colors.neutral.white,
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: Layout.spacing.m,
  },
  driverInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Layout.borderRadius.m,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.m,
    width: '100%',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Layout.spacing.m,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary.default,
    marginBottom: Layout.spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  driverLocation: {
    fontSize: 14,
    color: Colors.neutral.dark,
    marginBottom: Layout.spacing.xs,
  },
  driverTime: {
    fontSize: 14,
    color: Colors.neutral.dark,
  },
  communicationButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.s,
  },
  communicationButton: {
    backgroundColor: Colors.neutral.black,
    borderRadius: Layout.borderRadius.m,
    padding: Layout.spacing.s,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.black,
    borderRadius: Layout.borderRadius.m,
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    marginBottom: Layout.spacing.m,
  },
  shareText: {
    color: Colors.primary.default,
    marginRight: Layout.spacing.xs,
    fontWeight: 'bold',
  },
  shareIcon: {
    // Already styled by lucide-react-native
  },
  actionButton: {
    width: '100%',
    marginBottom: Layout.spacing.m,
  },
  pausedActions: {
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  pausedText: {
    color: Colors.neutral.white,
    fontSize: 16,
    marginBottom: Layout.spacing.s,
  },
  overlay: {
    position: 'absolute',
    top: '20%',
    left: Layout.spacing.xl,
    right: Layout.spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: Layout.borderRadius.m,
    padding: Layout.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  overlayText: {
    color: Colors.neutral.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  locationSelectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: Layout.borderRadius.m,
    padding: Layout.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  locationSelectionText: {
    color: Colors.neutral.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelSelectionButton: {
    backgroundColor: Colors.error.default,
    paddingVertical: Layout.spacing.s,
    paddingHorizontal: Layout.spacing.m,
    borderRadius: Layout.borderRadius.m,
    marginTop: Layout.spacing.m,
  },
  cancelSelectionText: {
    color: Colors.neutral.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: Colors.neutral.white,
    fontSize: 18,
    fontWeight: 'bold',
    paddingVertical: Layout.spacing.m,
  },
});






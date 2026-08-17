import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Driver, Ride, RideStatus } from '../../types';
import Button from './Button';
import { useRide } from '../../hooks/useRideContext';
import MapComponent from '../Pcommon/MapComponent';
import Colors from '../../constants/Colors';
import Layout from '../../constants/Layout';

interface RideStatusCardProps {
  ride?: Ride;
  nearbyDrivers?: Driver[];
  onDriverSelect?: (driver: Driver) => void;
  onStatusUpdate?: (status: RideStatus) => void;
  onRefreshDrivers?: () => void;
  isDriver?: boolean;
  showMap?: boolean;
}

export const RideStatusCard: React.FC<RideStatusCardProps> = ({
  ride,
  nearbyDrivers,
  onDriverSelect,
  onStatusUpdate,
  onRefreshDrivers,
  isDriver = false,
  showMap = true,
}) => {
  const { rideState } = useRide();

  // Use real data from ride context if no ride prop is provided
  const currentRide = ride || {
    id: 'current',
    riderId: 'current',
    pickup: {
      latitude: rideState.bookingDetails.pickup?.coords?.lat || 0,
      longitude: rideState.bookingDetails.pickup?.coords?.lng || 0,
      address:
        rideState.bookingDetails.pickup?.description || 'Pickup location',
    },
    destination: {
      latitude: rideState.bookingDetails.dropoff?.coords?.lat || 0,
      longitude: rideState.bookingDetails.dropoff?.coords?.lng || 0,
      address:
        rideState.bookingDetails.dropoff?.description || 'Dropoff location',
    },
    status: rideState.status as RideStatus,
    fare: rideState.bookingDetails.fare || 0,
    distance: rideState.bookingDetails.distance || 0,
    duration: rideState.bookingDetails.duration || 0,
    createdAt: new Date(),
  };

  // Convert route polyline to coordinates for map
  const getRouteCoordinates = () => {
    if (!rideState.bookingDetails.polyline) return [];

    try {
      return rideState.bookingDetails.polyline.split('|').map((point) => {
        const [lat, lng] = point.split(',').map(Number);
        return { latitude: lat, longitude: lng };
      });
    } catch (error) {
      console.error('Error parsing route polyline:', error);
      return [];
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return 'Less than 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)} km`;
  };

  const getStatusColor = (status: RideStatus) => {
    switch (status) {
      case 'requested':
      case 'driver_assigned':
        return Colors.primary.default;
      case 'in_progress':
        return Colors.secondary.default;
      case 'completed':
        return Colors.success;
      case 'cancelled':
        return Colors.error.default;
      case 'paused':
        return Colors.warning;
      default:
        return Colors.neutral.dark;
    }
  };

  const getStatusText = (status: RideStatus) => {
    switch (status) {
      case 'requested':
        return 'Looking for driver...';
      case 'driver_assigned':
        return 'Driver assigned';
      case 'in_progress':
        return 'Ride in progress';
      case 'completed':
        return 'Ride completed';
      case 'cancelled':
        return 'Ride cancelled';
      case 'paused':
        return 'Ride paused';
      default:
        return status.replace('_', ' ');
    }
  };

  console.log('RideStatusCard nearbyDrivers:', nearbyDrivers);
  // console.log('Current ride state:', rideState);
  console.log('Route coordinates:', getRouteCoordinates());

  const renderDriverList = () => {
    if (!nearbyDrivers || !onDriverSelect) return null;

    return (
      <View style={styles.driverList}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Drivers</Text>
          {onRefreshDrivers && (
            <TouchableOpacity
              onPress={onRefreshDrivers}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
        {nearbyDrivers.length === 0 ? (
          <Text style={styles.noDriversText}>No drivers available nearby</Text>
        ) : (
          nearbyDrivers.map((driver) => (
            <TouchableOpacity
              key={driver.id}
              style={styles.driverItem}
              onPress={() => onDriverSelect(driver)}
            >
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <Text style={styles.vehicleInfo}>
                  {driver.vehicle.make} {driver.vehicle.model} -{' '}
                  {driver.vehicle.plateNumber}
                </Text>
                <Text style={styles.rating}>
                  Rating: {driver.rating.toFixed(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderDriverActions = () => {
    if (!isDriver || !onStatusUpdate) return null;

    switch (currentRide.status) {
      case 'driver_assigned':
        return (
          <View style={styles.actionButtons}>
            <Button
              text="Start Ride"
              onPress={() => onStatusUpdate('in_progress')}
              variant="primary"
            />
            <Button
              text="Cancel"
              onPress={() => onStatusUpdate('cancelled')}
              variant="outline"
            />
          </View>
        );
      case 'in_progress':
        return (
          <View style={styles.actionButtons}>
            <Button
              text="Pause Ride"
              onPress={() => onStatusUpdate('paused')}
              variant="primary"
            />
            <Button
              text="Complete"
              onPress={() => onStatusUpdate('completed')}
              variant="primary"
            />
          </View>
        );
      case 'paused':
        return (
          <Button
            text="Resume Ride"
            onPress={() => onStatusUpdate('in_progress')}
            variant="primary"
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Map Section */}
        {showMap && rideState.bookingDetails.polyline && (
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>Route</Text>
            <MapComponent
              userLocation={{
                latitude: currentRide.pickup.latitude,
                longitude: currentRide.pickup.longitude,
              }}
              destination={{
                latitude: currentRide.destination.latitude,
                longitude: currentRide.destination.longitude,
              }}
              routePolyline={rideState.bookingDetails.polyline}
              nearbyDrivers={nearbyDrivers?.map((driver) => ({
                id: driver.id,
                location: driver.currentLocation || {
                  latitude: 0,
                  longitude: 0,
                },
              }))}
            />
          </View>
        )}

        {/* Status and Fare Header */}
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(currentRide.status) },
              ]}
            />
            <Text
              style={[
                styles.status,
                { color: getStatusColor(currentRide.status) },
              ]}
            >
              {getStatusText(currentRide.status)}
            </Text>
          </View>
          <Text style={styles.fare}>
            {currentRide.fare
              ? `${currentRide.fare.toLocaleString()} RWF`
              : 'Calculating...'}
          </Text>
        </View>

        {/* Trip Details */}
        <View style={styles.details}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <Text style={styles.location} numberOfLines={2}>
              {currentRide.pickup.address}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.destinationDot]} />
            <Text style={styles.location} numberOfLines={2}>
              {currentRide.destination.address}
            </Text>
          </View>
          <View style={styles.tripInfo}>
            <Text style={styles.tripInfoText}>
              Distance: {formatDistance(currentRide.distance)}
            </Text>
            <Text style={styles.tripInfoText}>
              Duration: {formatDuration(currentRide.duration)}
            </Text>
          </View>
        </View>

        {/* Driver List */}
        {renderDriverList()}

        {/* Driver Actions */}
        {renderDriverActions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000', // black
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: '80%',
  },
  scrollView: {
    padding: Layout.spacing.l,
  },
  mapContainer: {
    marginBottom: Layout.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700', // yellow
    marginBottom: Layout.spacing.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.l,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Layout.spacing.s,
    backgroundColor: '#FFD700', // yellow
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#FFD700', // yellow
  },
  fare: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700', // yellow
  },
  details: {
    marginBottom: Layout.spacing.l,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.m,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700', // yellow
    marginRight: Layout.spacing.m,
    marginTop: 4,
  },
  destinationDot: {
    backgroundColor: '#FFD700', // yellow
  },
  location: {
    flex: 1,
    fontSize: 16,
    color: '#fff', // white
    lineHeight: 22,
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.m,
    paddingTop: Layout.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#FFD700', // yellow
  },
  tripInfoText: {
    fontSize: 14,
    color: '#FFD700', // yellow
    fontWeight: '500',
  },
  driverList: {
    marginTop: Layout.spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.m,
  },
  refreshButton: {
    padding: Layout.spacing.s,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#FFD700', // yellow
    fontWeight: '500',
  },
  noDriversText: {
    fontSize: 14,
    color: '#fff', // white
    textAlign: 'center',
    marginBottom: Layout.spacing.m,
    fontStyle: 'italic',
  },
  driverItem: {
    backgroundColor: '#222', // dark background
    borderRadius: Layout.borderRadius.m,
    padding: Layout.spacing.m,
    marginBottom: Layout.spacing.s,
    borderWidth: 1,
    borderColor: '#FFD700', // yellow
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700', // yellow
    marginBottom: Layout.spacing.xs,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#fff', // white
    marginBottom: Layout.spacing.xs,
  },
  rating: {
    fontSize: 14,
    color: '#FFD700', // yellow
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Layout.spacing.l,
    gap: Layout.spacing.m,
  },
});

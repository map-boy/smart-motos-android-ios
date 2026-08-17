import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Location, MarkerData } from '../../types';
import { MAPBOX_CONFIG } from '../../config/mapbox';

interface MapComponentProps {
  routeCoordinates: Location[];
  currentLocation: Location | null;
  markers?: MarkerData[];
}

const MapComponent = ({
  routeCoordinates,
  currentLocation,
  markers,
}: MapComponentProps) => {
  React.useEffect(() => {
    // Initialize Mapbox with access token
    Mapbox.setAccessToken(MAPBOX_CONFIG.ACCESS_TOKEN);
  }, []);

  // Log the coordinates being used
  //console.log('[MapComponent] routeCoordinates:', routeCoordinates);
  //console.log('[MapComponent] currentLocation:', currentLocation);
  //if (markers) console.log('[MapComponent] markers:', markers);

  // Defensive: filter out invalid coordinates
  const validRouteCoordinates = routeCoordinates.filter(
    (coord) =>
      coord &&
      typeof coord.longitude === 'number' &&
      typeof coord.latitude === 'number'
  );

  if (!validRouteCoordinates.length) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'red' }}>
          Map cannot be displayed: missing or invalid coordinates.
        </Text>
      </View>
    );
  }

  return (
    <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Street}>
      {/* Route line */}
      {validRouteCoordinates.length > 0 && (
        <Mapbox.ShapeSource
          id="routeSource"
          shape={{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: validRouteCoordinates.map((coord) => [
                coord.longitude,
                coord.latitude,
              ]),
            },
          }}
        >
          <Mapbox.LineLayer
            id="routeLine"
            style={{
              lineColor: '#0066FF',
              lineWidth: 5,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </Mapbox.ShapeSource>
      )}

      {/* Driver marker */}
      {currentLocation && (
        <Mapbox.PointAnnotation
          id="currentLocation"
          coordinate={[currentLocation.longitude, currentLocation.latitude]}
        >
          <View style={styles.motorcycleMarker}>
            <FontAwesome name="motorcycle" size={20} color="#000" />
          </View>
        </Mapbox.PointAnnotation>
      )}

      {/* Custom markers passed as prop */}
      {markers &&
        markers.map((marker) => (
          <Mapbox.PointAnnotation
            key={marker.id}
            id={marker.id}
            coordinate={[
              marker.coordinate.longitude,
              marker.coordinate.latitude,
            ]}
            title={marker.title}
            snippet={marker.description}
            onSelected={marker.onPress}
          >
            <View style={styles.locationMarker}>
              <Ionicons name="location" size={24} color="#00BCD4" />
            </View>
          </Mapbox.PointAnnotation>
        ))}
    </Mapbox.MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  motorcycleMarker: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    padding: 5,
  },
  locationMarker: {
    backgroundColor: 'transparent',
  },
});

export default MapComponent;

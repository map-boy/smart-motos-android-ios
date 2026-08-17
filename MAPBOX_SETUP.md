# Mapbox Integration Setup Guide

This guide will help you set up Mapbox for real-time navigation and location services in your SmartMotos app.

## Overview

The SmartMotos app uses a hybrid approach:

- **Mapbox APIs** for routing, geocoding, and location services
- **react-native-maps** for map display (to avoid bundling issues with @rnmapbox/maps)

## Prerequisites

1. A Mapbox account with an access token
2. Node.js and npm/yarn installed
3. React Native development environment set up

## Installation

### 1. Install Dependencies

```bash
# Install required packages
npm install @mapbox/polyline react-native-maps expo-location

# For Expo projects, these should already be included
```

### 2. Configure Mapbox Access Token

Create or update your environment variables:

```bash
# .env file
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

### 3. Update Configuration

The Mapbox configuration is handled in `config/mapbox.ts`. Make sure your access token is properly set:

```typescript
export const MAPBOX_CONFIG = {
  ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN || 'your_token_here',
  MAP_STYLE: 'mapbox://styles/mapbox/streets-v11',
  BASE_URL: 'https://api.mapbox.com',
};
```

## Platform-Specific Setup

### Android

1. **Google Maps API Key** (for react-native-maps):
   - Get a Google Maps API key from Google Cloud Console
   - Add it to `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="your_google_maps_api_key_here" />
```

2. **Permissions** (already included):
   - Location permissions are handled by expo-location
   - Internet permissions are included by default

### iOS

1. **Google Maps API Key** (for react-native-maps):
   - Add to `ios/YourApp/AppDelegate.mm`:

```objc
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"your_google_maps_api_key_here"];
  // ... rest of your setup
}
```

2. **Location Permissions**:
   - Add to `ios/YourApp/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to location to provide navigation services.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs access to location to provide navigation services.</string>
```

## Usage

### 1. Mapbox Service

The `MapboxService` class provides methods for:

- Getting directions between two points
- Geocoding addresses to coordinates
- Reverse geocoding coordinates to addresses
- Calculating ETA

```typescript
import MapboxService from '@/services/mapboxService';

const mapboxService = MapboxService.getInstance();

// Get directions
const route = await mapboxService.getDirections(
  { latitude: -1.9441, longitude: 30.0619 }, // Origin
  { latitude: -1.9551, longitude: 30.0729 } // Destination
);

// Geocode address
const coordinates = await mapboxService.geocodeAddress('Kigali, Rwanda');

// Get ETA
const eta = await mapboxService.getETA(origin, destination);
```

### 2. Map Components

#### MapboxMapComponent

A wrapper around react-native-maps that integrates with Mapbox services:

```typescript
import MapboxMapComponent from '@/components/common/MapboxMapComponent';

<MapboxMapComponent
  routeCoordinates={route.coordinates}
  currentLocation={currentLocation}
  destination={destination}
  showNavigation={true}
  onRouteUpdate={handleRouteUpdate}
  onLocationUpdate={handleLocationUpdate}
/>;
```

#### RealTimeNavigation

For driver navigation with real-time updates:

```typescript
import RealTimeNavigation from '@/components/driver/RealTimeNavigation';

<RealTimeNavigation
  pickupLocation={pickupLocation}
  dropoffLocation={dropoffLocation}
  isNavigatingToPickup={true}
  onArrivedAtPickup={handleArrivedAtPickup}
  onArrivedAtDropoff={handleArrivedAtDropoff}
  onCancelNavigation={handleCancelNavigation}
/>;
```

#### PassengerTracking

For passenger ride tracking:

```typescript
import PassengerTracking from '@/components/passenger/PassengerTracking';

<PassengerTracking
  pickupLocation={pickupLocation}
  dropoffLocation={dropoffLocation}
  driverLocation={driverLocation}
  driverName="John Doe"
  driverRating={4.5}
  vehicleInfo="Toyota Corolla - ABC123"
  estimatedArrival="5 min"
  onCancelRide={handleCancelRide}
  onContactDriver={handleContactDriver}
/>;
```

### 3. Location Picker

The enhanced LocationPicker component uses Mapbox geocoding:

```typescript
import { LocationPicker } from '@/components/Pcommon/LocationPicker';

<LocationPicker
  label="Pickup Location"
  placeholder="Enter pickup location"
  value={pickupLocation}
  onLocationSelect={(location, coords) => {
    setPickupLocation(location);
    setPickupCoords(coords);
  }}
/>;
```

## Key Features

### Real-time Navigation

- Live route updates based on current location
- ETA calculations
- Proximity detection for arrival
- Turn-by-turn navigation support

### Location Services

- Address autocomplete with Mapbox geocoding
- Current location detection
- Route optimization
- Distance and duration calculations

### Driver Features

- Real-time location tracking
- Route visualization
- Arrival detection
- Navigation controls

### Passenger Features

- Driver location tracking
- Route visualization
- ETA updates
- Ride status monitoring

## Troubleshooting

### Common Issues

1. **Bundling Errors with @rnmapbox/maps**:

   - Solution: We've switched to react-native-maps for display
   - Mapbox APIs are still used for routing and geocoding

2. **Location Permissions**:

   - Ensure location permissions are granted
   - Check device location services are enabled
   - For emulators, set a custom location

3. **API Key Issues**:

   - Verify Mapbox access token is valid
   - Check Google Maps API key for react-native-maps
   - Ensure proper billing setup

4. **Route Calculation Failures**:
   - Check internet connectivity
   - Verify coordinates are valid
   - Ensure Mapbox API limits aren't exceeded

### Debug Tips

1. **Enable Debug Logging**:

```typescript
// In mapboxService.ts
console.log('Route calculation:', route);
console.log('Geocoding result:', coordinates);
```

2. **Test API Calls**:

```bash
# Test Mapbox Directions API
curl "https://api.mapbox.com/directions/v5/mapbox/driving/-1.9441,30.0619;-1.9551,30.0729?access_token=YOUR_TOKEN"
```

3. **Check Network Requests**:

- Use React Native Debugger
- Monitor network tab in browser dev tools
- Check Metro bundler logs

## Performance Optimization

1. **Route Caching**:

   - Implement route caching for frequently used routes
   - Cache geocoding results

2. **Location Updates**:

   - Use appropriate distance and time intervals
   - Implement location filtering to reduce API calls

3. **Map Rendering**:
   - Limit marker count on map
   - Use clustering for multiple markers
   - Optimize polyline rendering

## Security Considerations

1. **API Key Protection**:

   - Store API keys securely
   - Use environment variables
   - Implement API key rotation

2. **Location Privacy**:
   - Request minimum required permissions
   - Implement location data retention policies
   - Secure location data transmission

## Support

For issues related to:

- **Mapbox APIs**: Check [Mapbox Documentation](https://docs.mapbox.com/)
- **react-native-maps**: Check [react-native-maps Documentation](https://github.com/react-native-maps/react-native-maps)
- **Expo Location**: Check [Expo Location Documentation](https://docs.expo.dev/versions/latest/sdk/location/)

## Updates

This integration was updated to resolve bundling issues with @rnmapbox/maps by using react-native-maps for map display while maintaining Mapbox API functionality for routing and geocoding services.

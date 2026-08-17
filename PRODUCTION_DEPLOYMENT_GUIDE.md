# SmartMotos Production WebSocket Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy and maintain persistent WebSocket connections for your SmartMotos app in production on Render.

## 🚀 Quick Deployment Steps

### 1. Backend Deployment (Render)

#### Update render.yaml

```yaml
services:
  - type: web
    name: smartmotos-back
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn fastapi_app:app --host 0.0.0.0 --port $PORT --timeout-keep-alive 75 --timeout-graceful-shutdown 30
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: PORT
        value: 10000
      - key: WEBSOCKET_HEARTBEAT_INTERVAL
        value: 30
      - key: WEBSOCKET_TIMEOUT
        value: 60
      - key: WEBSOCKET_MAX_CONNECTIONS
        value: 1000
    healthCheckPath: /health
    autoDeploy: true
```

#### Deploy to Render

1. Push your updated code to your Git repository
2. Render will automatically deploy the changes
3. Monitor the deployment logs for any errors

### 2. Frontend Configuration

#### Update config.ts

```typescript
// Update your WebSocket URL to use the production Render URL
export const WS_URL = 'wss://your-app-name.onrender.com/ws';
export const API_URL = 'https://your-app-name.onrender.com/api';
```

#### Test WebSocket Connection

```bash
# Test the WebSocket endpoint
curl https://your-app-name.onrender.com/ws/status

# Expected response:
{
  "connected_drivers": 0,
  "connected_passengers": 0,
  "total_connections": 0,
  "driver_details": [],
  "passenger_details": []
}
```

## 🔧 Integration with Existing Code

### 1. Replace Existing WebSocket Implementation

#### In your ride service (services/ride.ts)

```typescript
// Replace the existing WebSocket setup with the new service
import { initializeWebSocket } from './websocketService';

// In the setCurrentUser method:
public setCurrentUser(user: User) {
  console.log('[RideService] setCurrentUser called with:', user);
  this.currentUser = user;

  // Initialize WebSocket with new service
  const wsService = initializeWebSocket({
    userId: user.id.toString(),
    userType: user.role === 'driver' ? 'driver' : 'passenger',
    heartbeatInterval: 30000,
    maxReconnectAttempts: 10
  });

  // Set up message handlers
  wsService.addMessageHandler((data) => {
    this.messageHandlers.forEach(handler => handler(data));
  });

  this.ws = wsService; // Store reference for compatibility
}
```

#### In your React components

```typescript
// Replace direct WebSocket usage with the hook
import { useWebSocket } from '../hooks/useWebSocket';

export default function ActiveRideScreen() {
  const { isConnected, addMessageHandler, sendMessage } = useWebSocket({
    autoConnect: true,
    reconnectOnAppStateChange: true,
  });

  useEffect(() => {
    if (isConnected) {
      addMessageHandler((data) => {
        console.log('[ActiveRide] WebSocket message received:', data);
        // Handle your ride updates
      });
    }
  }, [isConnected, addMessageHandler]);

  // Rest of your component logic...
}
```

### 2. Update Driver Screen

```typescript
// In app/driver/rides/index.tsx
import { useWebSocket } from '../../../hooks/useWebSocket';

function RidesScreen() {
  const { isConnected, addMessageHandler } = useWebSocket({
    autoConnect: true,
  });

  useEffect(() => {
    if (isConnected) {
      addMessageHandler((data) => {
        console.log('[DriverRides] WebSocket message received:', data);
        // Handle driver notifications
      });
    }
  }, [isConnected, addMessageHandler]);

  // Rest of your component...
}
```

## 📊 Monitoring and Debugging

### 1. Server-Side Monitoring

#### Health Check

```bash
curl https://your-app-name.onrender.com/health
```

#### WebSocket Status

```bash
curl https://your-app-name.onrender.com/ws/status
```

#### Real-time Logs

```bash
# In Render dashboard, check the logs for:
# - WebSocket connection events
# - Heartbeat messages
# - Connection errors
```

### 2. Client-Side Monitoring

#### Add Connection Status to UI

```typescript
import { useWebSocket } from '../hooks/useWebSocket';

function ConnectionStatus() {
  const { isConnected, connectionState, lastError } = useWebSocket();

  return (
    <View style={styles.statusContainer}>
      <Text style={[styles.status, { color: isConnected ? 'green' : 'red' }]}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </Text>
      {lastError && <Text style={styles.error}>Error: {lastError}</Text>}
    </View>
  );
}
```

#### Debug Logging

```typescript
// Add to your app's main component
import { useWebSocket } from './hooks/useWebSocket';

export default function App() {
  const { isConnected, connectionState } = useWebSocket();

  useEffect(() => {
    console.log('[App] WebSocket state:', connectionState);
    console.log('[App] WebSocket connected:', isConnected);
  }, [isConnected, connectionState]);

  // Rest of your app...
}
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### 1. WebSocket Connection Fails

**Symptoms**: Connection timeout or refused
**Solutions**:

- Check if Render service is running
- Verify WebSocket URL is correct
- Check CORS settings in backend

#### 2. Frequent Disconnections

**Symptoms**: Connections drop every 60 seconds
**Solutions**:

- Heartbeat mechanism is already implemented
- Check network stability
- Monitor Render service logs

#### 3. Messages Not Received

**Symptoms**: Connected but no real-time updates
**Solutions**:

- Verify message handlers are registered
- Check message format
- Test with WebSocket status endpoint

#### 4. Memory Leaks

**Symptoms**: App becomes slow over time
**Solutions**:

- Proper cleanup in useEffect hooks
- Remove message handlers on unmount
- Monitor connection count

### Debug Commands

```bash
# Test WebSocket connection manually
wscat -c "wss://your-app-name.onrender.com/ws?user_id=test&user_type=driver"

# Check server logs
curl https://your-app-name.onrender.com/ws/status

# Test API endpoints
curl https://your-app-name.onrender.com/health
```

## 🔄 Production Optimization

### 1. Render Plan Considerations

#### Free Plan Limitations

- **Sleep after 15 minutes of inactivity**
- **Limited CPU and memory**
- **No custom domains**

#### Solutions

- **Upgrade to paid plan** for production use
- **Implement health checks** to keep service active
- **Monitor resource usage**

### 2. Connection Management

#### Best Practices

- **Implement exponential backoff** for reconnections
- **Handle app state changes** (background/foreground)
- **Monitor connection health** regularly
- **Clean up connections** properly

#### Performance Tips

- **Minimize message size**
- **Batch messages** when possible
- **Use compression** for large payloads
- **Implement message queuing** for offline scenarios

## 📱 Testing in Production

### 1. Test Scenarios

#### Connection Stability

1. Connect multiple devices
2. Switch between WiFi and mobile data
3. Put app in background/foreground
4. Test network interruptions

#### Message Delivery

1. Send ride requests
2. Test driver notifications
3. Verify location updates
4. Check booking status changes

#### Error Recovery

1. Simulate network failures
2. Test reconnection logic
3. Verify error handling
4. Check graceful degradation

### 2. Monitoring Checklist

- [ ] WebSocket connections are stable
- [ ] Messages are delivered reliably
- [ ] Reconnection works properly
- [ ] No memory leaks
- [ ] Performance is acceptable
- [ ] Error handling works
- [ ] App state changes are handled

## 🚨 Emergency Procedures

### If WebSocket Service Fails

1. **Check Render service status**
2. **Review server logs**
3. **Test WebSocket endpoint**
4. **Restart service if needed**
5. **Notify users of temporary issues**

### Rollback Plan

1. **Revert to previous deployment**
2. **Use polling as fallback**
3. **Implement offline mode**
4. **Communicate with users**

## 📞 Support

### When to Contact Support

- **Persistent connection issues**
- **Message delivery failures**
- **Performance problems**
- **Memory leaks**
- **Service outages**

### Information to Provide

- **Error logs**
- **Connection status**
- **User reports**
- **Steps to reproduce**
- **Environment details**

## 🎯 Success Metrics

### Key Performance Indicators

- **Connection uptime**: >99%
- **Message delivery rate**: >95%
- **Reconnection success rate**: >90%
- **Average response time**: <100ms
- **Memory usage**: Stable over time

### Monitoring Tools

- **Render dashboard**
- **WebSocket status endpoint**
- **Client-side logging**
- **User feedback**
- **Performance metrics**

---

## Quick Reference

### Backend URLs

- **API**: `https://your-app-name.onrender.com/api`
- **WebSocket**: `wss://your-app-name.onrender.com/ws`
- **Health**: `https://your-app-name.onrender.com/health`
- **Status**: `https://your-app-name.onrender.com/ws/status`

### Environment Variables

```bash
WEBSOCKET_HEARTBEAT_INTERVAL=30
WEBSOCKET_TIMEOUT=60
WEBSOCKET_MAX_CONNECTIONS=1000
```

### Key Files

- `smartmotosBack/fastapi_app.py` - WebSocket server
- `smartmotosBack/websocket_server.py` - WebSocket logic
- `services/websocketService.ts` - Client service
- `hooks/useWebSocket.ts` - React hook
- `render.yaml` - Deployment config

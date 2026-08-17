import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './useAuth';
import { initializeWebSocket, getWebSocketService, disconnectWebSocket } from '../services/websocketService';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectOnAppStateChange?: boolean;
  heartbeatInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    autoConnect = true,
    reconnectOnAppStateChange = true,
    heartbeatInterval = 30000,
    maxReconnectAttempts = 10
  } = options;

  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [lastError, setLastError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const wsServiceRef = useRef<any>(null);

  const connect = useCallback(async () => {
    if (!user?.id) {
      console.log('[useWebSocket] No user ID available, skipping connection');
      return;
    }

    try {
      const wsService = initializeWebSocket({
        userId: user.id.toString(),
        userType: user.role === 'driver' ? 'driver' : 'passenger',
        heartbeatInterval,
        maxReconnectAttempts
      });

      wsServiceRef.current = wsService;

      wsService.on('connected', () => {
        console.log('[useWebSocket] WebSocket connected');
        setIsConnected(true);
        setConnectionState('connected');
        setLastError(null);
      });

      wsService.on('disconnected', (event: any) => {
        console.log('[useWebSocket] WebSocket disconnected:', event);
        setIsConnected(false);
        setConnectionState('disconnected');
      });

      wsService.on('error', (error: any) => {
        console.error('[useWebSocket] WebSocket error:', error);
        setLastError(error.message || 'Connection error');
        setConnectionState('error');
      });

      wsService.on('connection_established', (message: any) => {
        console.log('[useWebSocket] Connection established:', message);
      });

      // Connect to WebSocket
      await wsService.connect();
    } catch (error) {
      console.error('[useWebSocket] Failed to initialize WebSocket:', error);
      setLastError(error instanceof Error ? error.message : 'Failed to connect');
      setConnectionState('error');
    }
  }, [user?.id, user?.role, heartbeatInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
    }
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  const sendMessage = useCallback((message: any) => {
    if (wsServiceRef.current && isConnected) {
      return wsServiceRef.current.send(message);
    }
    return false;
  }, [isConnected]);

  const addMessageHandler = useCallback((handler: (data: any) => void) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.addMessageHandler(handler);
    }
  }, []);

  const removeMessageHandler = useCallback((handler: (data: any) => void) => {
    if (wsServiceRef.current) {
      wsServiceRef.current.removeMessageHandler(handler);
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        reconnectOnAppStateChange &&
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[useWebSocket] App became active, reconnecting...');
        reconnect();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [reconnectOnAppStateChange, reconnect]);

  // Auto-connect when user is available
  useEffect(() => {
    if (autoConnect && user?.id) {
      connect();
    }
  }, [autoConnect, user?.id, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Update connection state
  useEffect(() => {
    if (wsServiceRef.current) {
      const updateState = () => {
        const state = wsServiceRef.current.getConnectionState();
        setConnectionState(state);
        setIsConnected(wsServiceRef.current.isConnectionOpen());
      };

      // Update immediately
      updateState();

      // Update periodically
      const interval = setInterval(updateState, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  return {
    isConnected,
    connectionState,
    lastError,
    connect,
    disconnect,
    reconnect,
    sendMessage,
    addMessageHandler,
    removeMessageHandler,
    wsService: wsServiceRef.current
  };
};

// Hook for ride-specific WebSocket functionality
export const useRideWebSocket = () => {
  const { addMessageHandler, removeMessageHandler, isConnected } = useWebSocket({
    autoConnect: true,
    reconnectOnAppStateChange: true
  });

  const handleRideUpdate = useCallback((data: any) => {
    console.log('[useRideWebSocket] Ride update received:', data);
    // Handle ride-specific updates
  }, []);

  const handleDriverLocation = useCallback((data: any) => {
    console.log('[useRideWebSocket] Driver location update:', data);
    // Handle driver location updates
  }, []);

  const handleBookingUpdate = useCallback((data: any) => {
    console.log('[useRideWebSocket] Booking update:', data);
    // Handle booking updates
  }, []);

  useEffect(() => {
    if (isConnected) {
      addMessageHandler(handleRideUpdate);
      addMessageHandler(handleDriverLocation);
      addMessageHandler(handleBookingUpdate);
    }

    return () => {
      removeMessageHandler(handleRideUpdate);
      removeMessageHandler(handleDriverLocation);
      removeMessageHandler(handleBookingUpdate);
    };
  }, [isConnected, addMessageHandler, removeMessageHandler, handleRideUpdate, handleDriverLocation, handleBookingUpdate]);

  return {
    isConnected,
    handleRideUpdate,
    handleDriverLocation,
    handleBookingUpdate
  };
}; 
import { EventEmitter } from 'events';
import { API_URL, WS_URL } from '@/config';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketConfig {
  userId: string;
  userType: 'driver' | 'passenger';
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  wsUrl?: string;
}

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isConnected = false;
  private messageHandlers: Set<(data: any) => void> = new Set();

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      wsUrl: WS_URL,
      ...config
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isConnected) {
        resolve();
        return;
      }

      this.isConnecting = true;
      const wsUrl = `${this.config.wsUrl}?user_id=${this.config.userId}&user_type=${this.config.userType}`;

      try {
        console.log(`[WebSocketService] Connecting to: ${wsUrl}`);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WebSocketService] Connection established successfully');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('[WebSocketService] Message received:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocketService] Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocketService] Connection closed:', event.code, event.reason);
          this.isConnected = false;
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', event);
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocketService] WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'connection_established':
        console.log('[WebSocketService] Connection established:', message);
        this.emit('connection_established', message);
        break;
        
      case 'heartbeat':
        // Respond to heartbeat
        this.sendHeartbeatResponse();
        break;
        
      case 'ping':
        // Respond to ping
        this.sendPong();
        break;
        
      case 'rider_notification':
      case 'driver_notification':
      case 'booking_update':
      case 'driver_location':
      case 'new_booking':
      case 'ride_update':
      case 'driver_location_update':
        // Emit business logic messages
        this.emit(message.type, message);
        // Also call registered message handlers
        this.messageHandlers.forEach(handler => handler(message));
        break;
        
      default:
        // Emit unknown messages
        this.emit('message', message);
        this.messageHandlers.forEach(handler => handler(message));
    }
  }

  private sendHeartbeatResponse() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'heartbeat_response',
        timestamp: new Date().toISOString()
      }));
    }
  }

  private sendPong() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString()
      }));
    }
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'client_heartbeat',
          timestamp: new Date().toISOString()
        }));
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`[WebSocketService] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('[WebSocketService] Reconnection failed:', error);
      });
    }, delay);
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  isConnectionOpen(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'open';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }

  // Compatibility methods for existing ride service
  addMessageHandler(handler: (data: any) => void) {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: (data: any) => void) {
    this.messageHandlers.delete(handler);
  }

  isWebSocketConnected(): boolean {
    return this.isConnectionOpen();
  }

  resetConnection() {
    console.log('[WebSocketService] Resetting WebSocket connection');
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connect().catch(error => {
      console.error('[WebSocketService] Reset connection failed:', error);
    });
  }
}

// Singleton instance
let websocketService: WebSocketService | null = null;

export const initializeWebSocket = (config: WebSocketConfig): WebSocketService => {
  if (websocketService) {
    websocketService.disconnect();
  }
  
  websocketService = new WebSocketService(config);
  return websocketService;
};

export const getWebSocketService = (): WebSocketService | null => {
  return websocketService;
};

export const disconnectWebSocket = () => {
  if (websocketService) {
    websocketService.disconnect();
    websocketService = null;
  }
};

export default WebSocketService; 
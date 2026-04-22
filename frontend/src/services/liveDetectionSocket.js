/**
 * WebSocket service for live detection control
 */

class LiveDetectionSocket {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.isDetectionActive = false;
    this.callbacks = {
      onStatusChange: null,
      onConnect: null,
      onDisconnect: null,
      onError: null
    };
  }

  connect(token) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('🔗 WebSocket already connected');
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/live-detection?token=${token}`;
    console.log('🔗 Connecting to WebSocket:', wsUrl);

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Request current status
        this.send({
          type: 'get_status'
        });

        if (this.callbacks.onConnect) {
          this.callbacks.onConnect();
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.isDetectionActive = false;

        if (this.callbacks.onDisconnect) {
          this.callbacks.onDisconnect();
        }

        // Auto-reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(token);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnected = false;

        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  handleMessage(data) {
    console.log('📨 WebSocket message received:', data);

    switch (data.type) {
      case 'detection_status':
        this.isDetectionActive = data.active;
        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange({
            active: data.active,
            started_by: data.started_by,
            stopped_by: data.stopped_by
          });
        }
        break;

      case 'status_response':
        this.isDetectionActive = data.active;
        if (this.callbacks.onStatusChange) {
          this.callbacks.onStatusChange({
            active: data.active,
            connected_users: data.connected_users
          });
        }
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('📨 Unknown message type:', data.type);
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket not connected - cannot send message:', data);
    }
  }

  startDetection() {
    console.log('▶️ Starting live detection');
    this.send({
      type: 'start_detection'
    });
  }

  stopDetection() {
    console.log('⏹️ Stopping live detection');
    this.send({
      type: 'stop_detection'
    });
  }

  ping() {
    this.send({
      type: 'ping'
    });
  }

  attemptReconnect(token) {
    this.reconnectAttempts++;
    console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      this.connect(token);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    this.isConnected = false;
    this.isDetectionActive = false;
  }

  isDetectionRunning() {
    return this.isDetectionActive;
  }

  isSocketConnected() {
    return this.isConnected;
  }

  // Callback setters
  onStatusChange(callback) {
    this.callbacks.onStatusChange = callback;
  }

  onConnect(callback) {
    this.callbacks.onConnect = callback;
  }

  onDisconnect(callback) {
    this.callbacks.onDisconnect = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }
}

// Export singleton instance
export const liveDetectionSocket = new LiveDetectionSocket();
export default liveDetectionSocket;

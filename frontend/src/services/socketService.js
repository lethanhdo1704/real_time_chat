// frontend/src/services/socketService.js
import { io } from 'socket.io-client';

/**
 * Socket Service - High-level wrapper for Socket.IO
 * 
 * Provides:
 * - Clean API for emit/listen
 * - Auto-reconnect with token refresh
 * - Room management (conversations)
 * - Typing indicator helpers
 * - Event cleanup
 * 
 * Usage:
 * - socketService.connect(token)
 * - socketService.on(event, callback)
 * - socketService.emit(event, data)
 * - socketService.disconnect()
 */

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map(); // Track listeners for cleanup
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // ============================================
  // CONNECTION MANAGEMENT
  // ============================================

  /**
   * Connect to socket server with authentication
   * @param {string} token - JWT authentication token
   */
  connect(token) {
    if (this.isConnecting) {
      console.warn('⚠️ Socket connection already in progress');
      return;
    }

    if (!token) {
      console.error('❌ Cannot connect socket - no token provided');
      return;
    }

    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    this.isConnecting = true;

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    // Create socket instance if not exists
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        transports: ['websocket', 'polling'],
        auth: { token },
      });

      this._setupEventHandlers();
    } else {
      // Update token for reconnection
      this.socket.auth = { token };
    }

    // Connect
    this.socket.connect();
  }

  /**
   * Disconnect from socket server
   * Cleans up all listeners
   */
  disconnect() {
    if (this.socket) {
      this._cleanupListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      console.log('🔌 Socket disconnected');
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance (for advanced usage)
   * @returns {Socket|null}
   */
  getSocket() {
    return this.socket;
  }

  // ============================================
  // EVENT HANDLERS SETUP
  // ============================================

  _setupEventHandlers() {
    // Connection success
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Auto-rejoin conversations after reconnect
      this._rejoinConversations();
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.isConnecting = false;
      
      // Handle authentication error
      if (error.message === 'Authentication error') {
        console.error('❌ Socket authentication failed - token invalid');
        this.disconnect();
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
      this.isConnecting = false;
      
      // Reconnect if server initiated disconnect
      if (reason === 'io server disconnect') {
        // Server disconnected - will auto-reconnect
        console.log('🔄 Server disconnected, will auto-reconnect...');
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnectAttempts = attemptNumber;
      console.log(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
    });

    // Reconnection success
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after max attempts');
      this.disconnect();
    });

    // Generic error handler
    this.socket.on('error', (data) => {
      console.error('❌ Socket error:', data);
    });
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  /**
   * Listen to a socket event
   * Automatically tracks listener for cleanup
   * 
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  on(event, callback) {
    if (!this.socket) {
      console.error('❌ Cannot add listener - socket not initialized');
      return;
    }

    this.socket.on(event, callback);

    // Track for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Listen to event once
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   */
  once(event, callback) {
    if (!this.socket) {
      console.error('❌ Cannot add listener - socket not initialized');
      return;
    }

    this.socket.once(event, callback);
  }

  /**
   * Remove specific event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event handler to remove
   */
  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    // Remove from tracking
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (!this.socket) return;

    this.socket.removeAllListeners(event);
    this.listeners.delete(event);
  }

  /**
   * Emit event to server
   * @param {string} event - Event name
   * @param {*} data - Data to send
   */
  emit(event, data) {
    if (!this.socket) {
      console.error('❌ Cannot emit - socket not initialized');
      return;
    }

    if (!this.socket.connected) {
      console.warn('⚠️ Cannot emit - socket not connected');
      return;
    }

    this.socket.emit(event, data);
  }

  // ============================================
  // CONVERSATION MANAGEMENT
  // ============================================

  /**
   * Join a conversation room
   * @param {string} conversationId - Conversation ID
   */
  joinConversation(conversationId) {
    if (!conversationId) {
      console.error('❌ Cannot join conversation - no ID provided');
      return;
    }

    this.emit('join_conversation', { conversationId });
    
    // Track joined conversations for auto-rejoin
    this._addJoinedConversation(conversationId);
  }

  /**
   * Leave a conversation room
   * @param {string} conversationId - Conversation ID
   */
  leaveConversation(conversationId) {
    if (!conversationId) return;

    this.emit('leave_conversation', { conversationId });
    
    // Remove from tracking
    this._removeJoinedConversation(conversationId);
  }

  // ============================================
  // TYPING INDICATORS
  // ============================================

  /**
   * Emit typing indicator
   * @param {string} conversationId - Conversation ID
   * @param {boolean} isTyping - Typing state
   */
  emitTyping(conversationId, isTyping) {
    if (!conversationId) return;

    this.emit('typing', {
      conversationId,
      isTyping,
    });
  }

  // ============================================
  // INTERNAL HELPERS
  // ============================================

  /**
   * Track joined conversations for auto-rejoin after reconnect
   */
  _addJoinedConversation(conversationId) {
    if (!this.joinedConversations) {
      this.joinedConversations = new Set();
    }
    this.joinedConversations.add(conversationId);
  }

  _removeJoinedConversation(conversationId) {
    if (this.joinedConversations) {
      this.joinedConversations.delete(conversationId);
    }
  }

  /**
   * Auto-rejoin all conversations after reconnect
   */
  _rejoinConversations() {
    if (this.joinedConversations && this.joinedConversations.size > 0) {
      console.log(`🔄 Rejoining ${this.joinedConversations.size} conversations...`);
      this.joinedConversations.forEach((conversationId) => {
        this.emit('join_conversation', { conversationId });
      });
    }
  }

  /**
   * Cleanup all tracked listeners
   */
  _cleanupListeners() {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket.off(event, callback);
      });
    });
    this.listeners.clear();
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

const socketService = new SocketService();

export default socketService;
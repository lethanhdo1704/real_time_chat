// frontend/src/services/socketService.js
import { io } from 'socket.io-client';

/**
 * Socket Service - Singleton Pattern
 * 
 * NHIỆM VỤ DUY NHẤT:
 * - Tạo và quản lý 1 socket instance duy nhất
 * - Export hàm connect/disconnect
 * - Export hàm getSocket() để hooks sử dụng
 * 
 * ❌ KHÔNG:
 * - Không wrapper các method on/off/emit
 * - Không track listeners (socket tự làm)
 * - Không quản lý logic nghiệp vụ
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Tạo và connect socket
 * @param {string} token - JWT token
 */
export const connectSocket = (token) => {
  // Nếu đã có socket và đang connected, không tạo lại
  if (socket && socket.active) {
    console.log('✅ Socket already connected');
    return socket;
  }

  // Tạo socket instance nếu chưa có
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    // Setup core event handlers (chỉ log, không logic nghiệp vụ)
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket disconnected:', reason);
    });
  } else {
    // Update token nếu socket đã tồn tại
    socket.auth = { token };
  }

  // Connect
  socket.connect();
  return socket;
};

/**
 * Disconnect và cleanup socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected and cleaned up');
  }
};

/**
 * Get socket instance (cho hooks sử dụng)
 * @returns {Socket|null}
 */
export const getSocket = () => socket;

/**
 * Check connection status
 * @returns {boolean}
 */
export const isSocketConnected = () => socket?.connected || false;
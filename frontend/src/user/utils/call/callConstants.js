// frontend/src/user/utils/call/callConstants.js

/**
 * 🎯 CALL STATE MACHINE
 * Frontend PHẢI tuân thủ các state này
 * KHÔNG tự ý tạo thêm state khác
 */
export const CALL_STATE = {
  IDLE: 'IDLE',                       // Không có call
  OUTGOING_RINGING: 'OUTGOING_RINGING', // Caller đang chờ
  INCOMING_RINGING: 'INCOMING_RINGING', // Callee đang được gọi
  CONNECTING: 'CONNECTING',             // Đã accept, đang setup WebRTC
  IN_CALL: 'IN_CALL',                   // Đang gọi
  ENDING: 'ENDING',                     // Đang kết thúc
  ENDED: 'ENDED',                       // Đã kết thúc
  ERROR: 'ERROR'                        // Lỗi
};

/**
 * 🎯 CALL TYPE (từ backend)
 */
export const CALL_TYPE = {
  VOICE: 'voice',
  VIDEO: 'video'
};

/**
 * 🎯 CALL ROLE
 */
export const CALL_ROLE = {
  CALLER: 'caller',
  CALLEE: 'callee'
};

/**
 * 🎯 CALL TIMEOUTS
 */
export const CALL_TIMEOUT = {
  RINGING: 30000,        // 30s (match backend)
  CONNECTING: 15000,     // 15s cho WebRTC setup
  ICE_GATHERING: 10000   // 10s cho ICE gathering
};

/**
 * 🎯 ERROR CODES
 */
export const CALL_ERROR = {
  USER_BUSY: 'User is busy',
  USER_OFFLINE: 'User is offline',
  USER_NOT_FOUND: 'User not found',
  PERMISSION_DENIED: 'Permission denied',
  DEVICE_NOT_FOUND: 'Device not found',
  WEBRTC_FAILED: 'WebRTC connection failed',
  TIMEOUT: 'Call timeout',
  NETWORK_ERROR: 'Network error'
};

/**
 * 🎯 END REASONS (từ backend)
 */
export const END_REASON = {
  HANGUP: 'hangup',
  REJECT: 'reject',
  MISSED: 'missed',
  TIMEOUT: 'timeout',
  ERROR: 'error',
  BUSY: 'busy',
  OFFLINE: 'offline',
  DISCONNECT: 'disconnect'
};

/**
 * 🎯 WEBRTC ICE SERVERS
 */
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // TODO: Add TURN servers for production
  // {
  //   urls: 'turn:your-turn-server.com:3478',
  //   username: 'username',
  //   credential: 'password'
  // }
];

/**
 * 🎯 MEDIA CONSTRAINTS
 */
export const MEDIA_CONSTRAINTS = {
  VOICE: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: false
  },
  VIDEO: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    }
  }
};
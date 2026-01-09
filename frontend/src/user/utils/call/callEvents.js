// frontend/src/user/utils/call/callEvents.js

/**
 * 🎯 SOCKET EVENTS - CALL LIFECYCLE
 * Khớp 100% với backend call.socket.js
 */
export const CALL_EVENTS = {
  // === CLIENT → SERVER ===
  START: 'call:start',
  ACCEPT: 'call:accept',
  REJECT: 'call:reject',
  END: 'call:end',
  
  // === SERVER → CLIENT ===
  INITIATED: 'call:initiated',
  INCOMING: 'call:incoming',
  ACCEPTED: 'call:accepted',
  REJECTED: 'call:rejected',
  ENDED: 'call:ended',
  MISSED: 'call:missed',
  FAILED: 'call:failed',
  ERROR: 'call:error',
};

/**
 * 🎯 SOCKET EVENTS - WEBRTC SIGNALING
 * Backend chỉ relay, không xử lý
 */
export const SIGNALING_EVENTS = {
  // === CLIENT → SERVER ===
  OFFER: 'call:offer',
  ANSWER: 'call:answer',
  ICE: 'call:ice',
  
  // === SERVER → CLIENT (relay) ===
  OFFER_RECEIVED: 'call:offer',
  ANSWER_RECEIVED: 'call:answer',
  ICE_RECEIVED: 'call:ice',
};
// frontend/src/user/services/socket/call.socket.js

import { CALL_EVENTS, SIGNALING_EVENTS } from '../../utils/call/callEvents';

/**
 * 🎯 CALL SOCKET SERVICE
 * 
 * Wrapper cho socket.emit (call events)
 * KHÔNG handle socket.on (sẽ ở hook)
 */
class CallSocketService {
  constructor() {
    this.socket = null;
  }

  /**
   * Set socket instance
   */
  setSocket(socket) {
    this.socket = socket;
  }

  /**
   * Validate socket
   */
  ensureSocket() {
    if (!this.socket) {
      throw new Error('Socket not initialized');
    }
    
    if (!this.socket.connected) {
      console.warn('[CallSocket] Socket not connected, but attempting emit');
      // Don't throw, let socket.io handle reconnection
    }
  }

  // ============================================
  // CALL LIFECYCLE EVENTS
  // ============================================

  /**
   * Start call
   * 
   * @param {string} calleeUid - Peer UID
   * @param {string} type - 'voice' | 'video'
   */
  startCall(calleeUid, type) {
    this.ensureSocket();
    
    console.log('[Socket] Emitting call:start', { calleeUid, type });
    
    this.socket.emit(CALL_EVENTS.START, {
      calleeUid,
      type,
    });
  }

  /**
   * Accept call
   * 
   * @param {string} callId - Call ID
   */
  acceptCall(callId) {
    this.ensureSocket();
    
    console.log('[Socket] Emitting call:accept', { callId });
    
    this.socket.emit(CALL_EVENTS.ACCEPT, {
      callId,
    });
  }

  /**
   * Reject call
   * 
   * @param {string} callId - Call ID
   */
  rejectCall(callId) {
    this.ensureSocket();
    
    console.log('[Socket] Emitting call:reject', { callId });
    
    this.socket.emit(CALL_EVENTS.REJECT, {
      callId,
    });
  }

  /**
   * End call
   * 
   * @param {string} callId - Call ID
   */
  endCall(callId) {
    this.ensureSocket();
    
    console.log('[Socket] Emitting call:end', { callId });
    
    this.socket.emit(CALL_EVENTS.END, {
      callId,
    });
  }

  // ============================================
  // WEBRTC SIGNALING EVENTS
  // ============================================

  /**
   * Send offer
   * 
   * @param {string} toUid - Peer UID
   * @param {RTCSessionDescriptionInit} offer - WebRTC offer
   */
  sendOffer(toUid, offer) {
    this.ensureSocket();
    
    console.log('[Socket] Sending offer to', toUid);
    
    this.socket.emit(SIGNALING_EVENTS.OFFER, {
      toUid,
      offer,
    });
  }

  /**
   * Send answer
   * 
   * @param {string} toUid - Peer UID
   * @param {RTCSessionDescriptionInit} answer - WebRTC answer
   */
  sendAnswer(toUid, answer) {
    this.ensureSocket();
    
    console.log('[Socket] Sending answer to', toUid);
    
    this.socket.emit(SIGNALING_EVENTS.ANSWER, {
      toUid,
      answer,
    });
  }

  /**
   * Send ICE candidate
   * 
   * @param {string} toUid - Peer UID
   * @param {RTCIceCandidateInit} candidate - ICE candidate
   */
  sendIceCandidate(toUid, candidate) {
    this.ensureSocket();
    
    // ICE có thể spam → không log mỗi lần
    this.socket.emit(SIGNALING_EVENTS.ICE, {
      toUid,
      candidate,
    });
  }
}

// Export singleton instance
const callSocketService = new CallSocketService();
export default callSocketService;
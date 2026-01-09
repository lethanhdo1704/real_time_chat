// frontend/src/user/store/call/callStore.js

import { create } from 'zustand';
import { CALL_STATE, CALL_TYPE, CALL_ROLE } from '../../utils/call/callConstants';

/**
 * 🎯 CALL STORE (ZUSTAND)
 * 
 * Source of truth cho toàn bộ call state
 * Được update bởi socket events & user actions
 */
const useCallStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  
  // === CALL METADATA ===
  callId: null,
  callType: null,               // 'voice' | 'video'
  callState: CALL_STATE.IDLE,
  role: null,                   // 'caller' | 'callee'
  
  // === PEER INFO ===
  peerUid: null,
  peerInfo: null,               // { username, avatar }
  
  // === MEDIA STREAMS ===
  localStream: null,
  remoteStream: null,
  
  // === UI FLAGS ===
  isMuted: false,
  isVideoOff: false,
  isSpeakerOn: false,
  
  // === ERROR ===
  error: null,
  
  // === CALL DURATION ===
  callStartTime: null,
  callDuration: 0,

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Start outgoing call
   */
  startOutgoingCall: (peerUid, peerInfo, callType) => {
    console.log('[Store] Starting outgoing call', { peerUid, callType });
    
    set({
      callState: CALL_STATE.OUTGOING_RINGING,
      role: CALL_ROLE.CALLER,
      peerUid,
      peerInfo,
      callType,
      error: null,
      callId: null, // Backend sẽ trả về
    });
  },

  /**
   * Receive incoming call
   */
  receiveIncomingCall: (callId, callType, callerUid, callerInfo) => {
    console.log('[Store] Incoming call received', { callId, callerUid, callType });
    
    set({
      callState: CALL_STATE.INCOMING_RINGING,
      role: CALL_ROLE.CALLEE,
      callId,
      callType,
      peerUid: callerUid,
      peerInfo: callerInfo,
      error: null,
    });
  },

  /**
   * Set call ID (khi backend trả về call:initiated)
   */
  setCallId: (callId) => {
    console.log('[Store] Call ID set:', callId);
    set({ callId });
  },

  /**
   * Transition to connecting state
   */
  setConnecting: () => {
    console.log('[Store] Call connecting');
    set({ callState: CALL_STATE.CONNECTING });
  },

  /**
   * Set local stream
   */
  setLocalStream: (stream) => {
    console.log('[Store] Local stream set');
    set({ localStream: stream });
  },

  /**
   * Set remote stream
   */
  setRemoteStream: (stream) => {
    console.log('[Store] Remote stream set');
    
    // Khi có remote stream → chuyển sang IN_CALL
    set({
      remoteStream: stream,
      callState: CALL_STATE.IN_CALL,
      callStartTime: Date.now(),
    });
  },

  /**
   * Toggle mute
   */
  toggleMute: () => {
    const currentMuted = get().isMuted;
    console.log('[Store] Toggle mute:', !currentMuted);
    set({ isMuted: !currentMuted });
  },

  /**
   * Toggle video
   */
  toggleVideo: () => {
    const currentVideoOff = get().isVideoOff;
    console.log('[Store] Toggle video:', !currentVideoOff);
    set({ isVideoOff: !currentVideoOff });
  },

  /**
   * Toggle speaker
   */
  toggleSpeaker: () => {
    const currentSpeaker = get().isSpeakerOn;
    console.log('[Store] Toggle speaker:', !currentSpeaker);
    set({ isSpeakerOn: !currentSpeaker });
  },

  /**
   * Set error
   */
  setError: (error) => {
    console.error('[Store] Call error:', error);
    set({
      error,
      callState: CALL_STATE.ERROR,
    });
  },

  /**
   * Set ending state
   */
  setEnding: () => {
    console.log('[Store] Call ending');
    set({ callState: CALL_STATE.ENDING });
  },

  /**
   * Update call duration (for UI display)
   */
  updateDuration: (duration) => {
    set({ callDuration: duration });
  },

  /**
   * Reset call state (về IDLE)
   */
  resetCall: () => {
    console.log('[Store] Resetting call state');
    
    set({
      callId: null,
      callType: null,
      callState: CALL_STATE.IDLE,
      role: null,
      peerUid: null,
      peerInfo: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      isSpeakerOn: false,
      error: null,
      callStartTime: null,
      callDuration: 0,
    });
  },

  // ============================================
  // SELECTORS (Helper getters)
  // ============================================

  /**
   * Check if currently in a call
   */
  isInCall: () => {
    const state = get().callState;
    return [
      CALL_STATE.OUTGOING_RINGING,
      CALL_STATE.INCOMING_RINGING,
      CALL_STATE.CONNECTING,
      CALL_STATE.IN_CALL,
    ].includes(state);
  },

  /**
   * Check if user is busy (cannot receive new call)
   */
  isBusy: () => {
    const state = get().callState;
    return state !== CALL_STATE.IDLE && state !== CALL_STATE.ENDED;
  },

  /**
   * Get call info for display
   */
  getCallInfo: () => {
    const state = get();
    return {
      callId: state.callId,
      callType: state.callType,
      callState: state.callState,
      role: state.role,
      peerUid: state.peerUid,
      peerInfo: state.peerInfo,
      duration: state.callDuration,
    };
  },
}));

export default useCallStore;
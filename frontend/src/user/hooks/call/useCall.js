// frontend/src/user/hooks/call/useCall.js

import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import useCallStore from '../../store/call/callStore';
import callSocketService from '../../services/socket/call.socket';
import WebRTCManager from '../../webrtc/peerConnection';
import { CALL_EVENTS, SIGNALING_EVENTS } from '../../utils/call/callEvents';
import { CALL_STATE, CALL_ROLE } from '../../utils/call/callConstants';

/**
 * 🎯 USE CALL HOOK (CORE LOGIC)
 * 
 * Orchestrates:
 * - Socket events
 * - WebRTC connection
 * - Store updates
 * - Cleanup
 * 
 * ⚠️ PHẢI mount ở App level hoặc Home
 */
export default function useCall() {
  const { socket, isConnected } = useSocket();
  const webrtcRef = useRef(null);
  const hasSetRemoteAnswer = useRef(false); // ✅ ADD: Track if answer already set

  // Store
  const callState = useCallStore((state) => state.callState);
  const callId = useCallStore((state) => state.callId);
  const role = useCallStore((state) => state.role);
  const peerUid = useCallStore((state) => state.peerUid);

  // Store actions
  const setCallId = useCallStore((state) => state.setCallId);
  const setConnecting = useCallStore((state) => state.setConnecting);
  const setLocalStream = useCallStore((state) => state.setLocalStream);
  const setRemoteStream = useCallStore((state) => state.setRemoteStream);
  const setError = useCallStore((state) => state.setError);
  const setEnding = useCallStore((state) => state.setEnding);
  const resetCall = useCallStore((state) => state.resetCall);
  const receiveIncomingCall = useCallStore((state) => state.receiveIncomingCall);

  // ============================================
  // INITIALIZE WEBRTC MANAGER
  // ============================================
  useEffect(() => {
    webrtcRef.current = WebRTCManager.getInstance();

    // Set up WebRTC callbacks
    webrtcRef.current.onIceCandidate = (candidate) => {
      console.log('[useCall] Sending ICE candidate');
      callSocketService.sendIceCandidate(peerUid, candidate);
    };

    webrtcRef.current.onTrack = (stream) => {
      console.log('[useCall] Remote stream received');
      setRemoteStream(stream);
    };

    webrtcRef.current.onConnectionStateChange = (state) => {
      console.log('[useCall] Connection state:', state);
      
      if (state === 'failed') {
        setError('Connection failed');
        handleEndCall();
      }
    };
  }, [peerUid, setRemoteStream, setError]);

  // ============================================
  // SET SOCKET IN SERVICE
  // ============================================
  useEffect(() => {
    if (socket) {
      callSocketService.setSocket(socket);
    }
  }, [socket]);

  // ============================================
  // SOCKET EVENT HANDLERS
  // ============================================

  // === CALL:INITIATED (Caller nhận) ===
  const handleCallInitiated = useCallback(({ callId, call }) => {
    console.log('[useCall] Call initiated:', callId);
    setCallId(callId);
  }, [setCallId]);

  // === CALL:INCOMING (Callee nhận) ===
  const handleCallIncoming = useCallback(({ callId, callerUid, caller, type }) => {
    console.log('[useCall] Incoming call:', { callId, callerUid, type });
    
    receiveIncomingCall(callId, type, callerUid, caller);
  }, [receiveIncomingCall]);

  // === CALL:ACCEPTED (Cả 2 nhận) ===
  const handleCallAccepted = useCallback(async ({ callId, call }) => {
    console.log('[useCall] Call accepted:', callId);
    
    setConnecting();
    hasSetRemoteAnswer.current = false; // ✅ Reset flag

    // Nếu là CALLER → tạo offer
    if (role === CALL_ROLE.CALLER) {
      try {
        const callType = useCallStore.getState().callType;
        
        // Get media & init WebRTC
        const stream = await webrtcRef.current.initializeCall(callType);
        setLocalStream(stream);

        // Create & send offer
        const offer = await webrtcRef.current.createOffer();
        callSocketService.sendOffer(peerUid, offer);

      } catch (error) {
        console.error('[useCall] Caller WebRTC init error:', error);
        setError(error.message);
        handleEndCall();
      }
    }
  }, [role, peerUid, setConnecting, setLocalStream, setError]);

  // === CALL:REJECTED ===
  const handleCallRejected = useCallback(({ callId }) => {
    console.log('[useCall] Call rejected:', callId);
    setError('Call rejected');
    cleanup();
  }, [setError]);

  // === CALL:ENDED ===
  const handleCallEnded = useCallback(({ callId, duration, reason }) => {
    console.log('[useCall] Call ended:', { callId, duration, reason });
    cleanup();
  }, []);

  // === CALL:MISSED ===
  const handleCallMissed = useCallback(({ callId }) => {
    console.log('[useCall] Call missed:', callId);
    setError('No answer');
    cleanup();
  }, [setError]);

  // === CALL:FAILED ===
  const handleCallFailed = useCallback(({ callId, reason, message }) => {
    console.log('[useCall] Call failed:', { reason, message });
    setError(message);
    cleanup();
  }, [setError]);

  // === CALL:ERROR ===
  const handleCallError = useCallback(({ message }) => {
    console.error('[useCall] Call error:', message);
    setError(message);
    cleanup();
  }, [setError]);

  // ============================================
  // WEBRTC SIGNALING HANDLERS
  // ============================================

  // === CALL:OFFER (Callee nhận) ===
  const handleOffer = useCallback(async ({ fromUid, offer }) => {
    console.log('[useCall] Received offer from:', fromUid);

    try {
      const callType = useCallStore.getState().callType;
      
      // Get media & init WebRTC
      const stream = await webrtcRef.current.initializeCall(callType);
      setLocalStream(stream);

      // Create & send answer
      const answer = await webrtcRef.current.createAnswer(offer);
      callSocketService.sendAnswer(fromUid, answer);

    } catch (error) {
      console.error('[useCall] Callee WebRTC init error:', error);
      setError(error.message);
      handleEndCall();
    }
  }, [setLocalStream, setError]);

  // === CALL:ANSWER (Caller nhận) ===
  const handleAnswer = useCallback(async ({ fromUid, answer }) => {
    console.log('[useCall] Received answer from:', fromUid);

    // ✅ GUARD: Prevent duplicate answer
    if (hasSetRemoteAnswer.current) {
      console.warn('[useCall] ⚠️ Answer already set, ignoring duplicate');
      return;
    }

    // ✅ GUARD: Check WebRTC state
    const pc = webrtcRef.current?.peerConnection;
    if (!pc) {
      console.error('[useCall] ❌ No peer connection');
      return;
    }

    if (pc.signalingState !== 'have-local-offer') {
      console.warn('[useCall] ⚠️ Wrong signaling state:', pc.signalingState);
      return;
    }

    try {
      await webrtcRef.current.setRemoteDescription(answer);
      hasSetRemoteAnswer.current = true; // ✅ Mark as set
      console.log('[useCall] ✅ Remote answer set successfully');
    } catch (error) {
      console.error('[useCall] Set remote description error:', error);
      setError(error.message);
      handleEndCall();
    }
  }, [setError]);

  // === CALL:ICE ===
  const handleIce = useCallback(async ({ fromUid, candidate }) => {
    if (!candidate) return;
    
    try {
      await webrtcRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('[useCall] Add ICE candidate error:', error);
    }
  }, []);

  // ============================================
  // REGISTER SOCKET LISTENERS
  // ============================================
  useEffect(() => {
    if (!socket || !isConnected) {
      console.warn('[useCall] Socket not available or not connected yet');
      return;
    }

    console.log('[useCall] Registering socket listeners');

    // Call lifecycle
    socket.on(CALL_EVENTS.INITIATED, handleCallInitiated);
    socket.on(CALL_EVENTS.INCOMING, handleCallIncoming);
    socket.on(CALL_EVENTS.ACCEPTED, handleCallAccepted);
    socket.on(CALL_EVENTS.REJECTED, handleCallRejected);
    socket.on(CALL_EVENTS.ENDED, handleCallEnded);
    socket.on(CALL_EVENTS.MISSED, handleCallMissed);
    socket.on(CALL_EVENTS.FAILED, handleCallFailed);
    socket.on(CALL_EVENTS.ERROR, handleCallError);

    // WebRTC signaling
    socket.on(SIGNALING_EVENTS.OFFER_RECEIVED, handleOffer);
    socket.on(SIGNALING_EVENTS.ANSWER_RECEIVED, handleAnswer);
    socket.on(SIGNALING_EVENTS.ICE_RECEIVED, handleIce);

    return () => {
      console.log('[useCall] Cleaning up socket listeners');
      
      socket.off(CALL_EVENTS.INITIATED, handleCallInitiated);
      socket.off(CALL_EVENTS.INCOMING, handleCallIncoming);
      socket.off(CALL_EVENTS.ACCEPTED, handleCallAccepted);
      socket.off(CALL_EVENTS.REJECTED, handleCallRejected);
      socket.off(CALL_EVENTS.ENDED, handleCallEnded);
      socket.off(CALL_EVENTS.MISSED, handleCallMissed);
      socket.off(CALL_EVENTS.FAILED, handleCallFailed);
      socket.off(CALL_EVENTS.ERROR, handleCallError);
      
      socket.off(SIGNALING_EVENTS.OFFER_RECEIVED, handleOffer);
      socket.off(SIGNALING_EVENTS.ANSWER_RECEIVED, handleAnswer);
      socket.off(SIGNALING_EVENTS.ICE_RECEIVED, handleIce);
    };
  }, [
    socket,
    isConnected,
    handleCallInitiated,
    handleCallIncoming,
    handleCallAccepted,
    handleCallRejected,
    handleCallEnded,
    handleCallMissed,
    handleCallFailed,
    handleCallError,
    handleOffer,
    handleAnswer,
    handleIce,
  ]);

  // ============================================
  // USER ACTIONS
  // ============================================

  /**
   * End call
   */
  const handleEndCall = useCallback(() => {
    const currentCallId = useCallStore.getState().callId;
    
    if (!currentCallId) {
      cleanup();
      return;
    }

    console.log('[useCall] Ending call:', currentCallId);
    
    setEnding();
    callSocketService.endCall(currentCallId);
    
    // Cleanup sẽ được gọi khi nhận call:ended
  }, [setEnding]);

  /**
   * Cleanup (internal)
   */
  const cleanup = useCallback(() => {
    console.log('[useCall] Cleanup');
    
    // Reset flag
    hasSetRemoteAnswer.current = false;
    
    // Cleanup WebRTC
    if (webrtcRef.current) {
      webrtcRef.current.cleanup();
    }

    // Reset store
    setTimeout(() => {
      resetCall();
    }, 300);
  }, [resetCall]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================
  useEffect(() => {
    return () => {
      console.log('[useCall] Component unmounting, cleanup');
      if (webrtcRef.current) {
        webrtcRef.current.cleanup();
      }
    };
  }, []);

  // ============================================
  // RETURN
  // ============================================
  return {
    callState,
    handleEndCall,
    webrtc: webrtcRef.current,
    socket,
    isConnected,
  };
}
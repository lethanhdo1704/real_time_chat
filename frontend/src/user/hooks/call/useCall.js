// frontend/src/user/hooks/call/useCall.js

import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import useCallStore from '../../store/call/callStore';
import callSocketService from '../../services/socket/call.socket';
import WebRTCManager from '../../webrtc/peerConnection';
import { CALL_EVENTS, SIGNALING_EVENTS } from '../../utils/call/callEvents';
import { CALL_STATE, CALL_ROLE } from '../../utils/call/callConstants';

/**
 * 🎯 USE CALL HOOK (CORE LOGIC) - FULL FIXED VERSION
 * 
 * Orchestrates:
 * - Socket events
 * - WebRTC connection
 * - Store updates
 * - Cleanup
 * 
 * ✅ FIXES:
 * - Device in use prevention
 * - Better cleanup sequence
 * - Connection timeout handling
 * - Proper media initialization
 * - Socket warning cleanup
 * 
 * ⚠️ PHẢI mount ở App level hoặc Home
 */
export default function useCall() {
  const { socket, isConnected } = useSocket();
  const webrtcRef = useRef(null);
  const hasSetRemoteAnswer = useRef(false);
  const isMediaInitialized = useRef(false);
  const pendingIceCandidates = useRef([]);
  const isEndingRef = useRef(false);
  const connectionTimeoutRef = useRef(null);

  // Store
  const callState = useCallStore((state) => state.callState);
  const callId = useCallStore((state) => state.callId);
  const role = useCallStore((state) => state.role);

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
      console.log('[useCall] 🧊 Sending ICE candidate');
      const peerUid = useCallStore.getState().peerUid;
      callSocketService.sendIceCandidate(peerUid, candidate);
    };

    webrtcRef.current.onTrack = (stream) => {
      console.log('[useCall] 🎵 Remote stream received');
      setRemoteStream(stream);
      
      // Clear connection timeout khi nhận được track
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    };

    webrtcRef.current.onConnectionStateChange = (state) => {
      console.log('[useCall] 🔌 Connection state:', state);
      
      // Handle connection failures
      if (['failed', 'disconnected'].includes(state)) {
        const currentCallState = useCallStore.getState().callState;
        
        if (currentCallState === CALL_STATE.IN_CALL) {
          const errorMsg = state === 'failed' ? 'Connection failed' : 'Connection lost';
          setError(errorMsg);
          handleEndCall();
        } else if (state === 'failed') {
          setError('Connection failed');
          handleEndCall();
        }
      }
      
      // Clear timeout khi connected
      if (state === 'connected') {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
      }
    };
  }, [setRemoteStream, setError]);

  // ============================================
  // SET SOCKET IN SERVICE
  // ============================================
  useEffect(() => {
    if (socket) {
      callSocketService.setSocket(socket);
    }
  }, [socket]);

  // ============================================
  // HELPER: Process pending ICE candidates
  // ============================================
  const processPendingIceCandidates = useCallback(async () => {
    if (pendingIceCandidates.current.length === 0) return;

    const pc = webrtcRef.current?.peerConnection;
    if (!pc || !pc.remoteDescription) return;

    console.log(`[useCall] 🧊 Processing ${pendingIceCandidates.current.length} pending ICE candidates`);

    for (const candidate of pendingIceCandidates.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[useCall] ✅ Added pending ICE candidate');
      } catch (error) {
        console.error('[useCall] ❌ Failed to add pending ICE:', error);
      }
    }

    pendingIceCandidates.current = [];
  }, []);

  // ============================================
  // HELPER: Start connection timeout
  // ============================================
  const startConnectionTimeout = useCallback(() => {
    // Clear existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    // Auto-fail nếu không connected sau 15s
    connectionTimeoutRef.current = setTimeout(() => {
      const pc = webrtcRef.current?.peerConnection;
      if (pc && pc.connectionState !== 'connected') {
        console.warn('[useCall] ⚠️ Connection timeout (15s)');
        setError('Connection timeout');
        handleEndCall();
      }
    }, 15000);
  }, [setError]);

  // ============================================
  // SOCKET EVENT HANDLERS
  // ============================================

  // === CALL:INITIATED (Caller nhận) ===
  const handleCallInitiated = useCallback(({ callId, call }) => {
    console.log('[useCall] ✅ Call initiated:', callId);
    setCallId(callId);
  }, [setCallId]);

  // === CALL:INCOMING (Callee nhận) ===
  const handleCallIncoming = useCallback(({ callId, callerUid, caller, type }) => {
    console.log('[useCall] 📞 Incoming call:', { callId, callerUid, type });
    receiveIncomingCall(callId, type, callerUid, caller);
  }, [receiveIncomingCall]);

  // === CALL:ACCEPTED (Cả 2 nhận) ===
  const handleCallAccepted = useCallback(async ({ callId, call }) => {
    console.log('[useCall] ✅ Call accepted:', callId);
    
    setConnecting();
    hasSetRemoteAnswer.current = false;

    // Start connection timeout
    startConnectionTimeout();

    // Nếu là CALLER → tạo offer
    if (role === CALL_ROLE.CALLER) {
      try {
        // ✅ FIX: Cleanup media cũ trước khi init mới
        if (isMediaInitialized.current) {
          console.log('[useCall] ⚠️ Media already initialized, cleaning up first');
          await webrtcRef.current.mediaHandler.stopCurrentStream();
          isMediaInitialized.current = false;
        }

        const callType = useCallStore.getState().callType;
        console.log('[useCall] 📹 Initializing media for caller:', callType);
        
        const stream = await webrtcRef.current.initializeCall(callType);
        setLocalStream(stream);
        isMediaInitialized.current = true;

        const offer = await webrtcRef.current.createOffer();
        
        const peerUid = useCallStore.getState().peerUid;
        callSocketService.sendOffer(peerUid, offer);

      } catch (error) {
        console.error('[useCall] ❌ Caller WebRTC init error:', error);
        setError(error.message);
        handleEndCall();
      }
    }
  }, [role, setConnecting, setLocalStream, setError, startConnectionTimeout]);

  // === CALL:REJECTED ===
  const handleCallRejected = useCallback(({ callId }) => {
    console.log('[useCall] ❌ Call rejected:', callId);
    setError('Call rejected');
    cleanup();
  }, [setError]);

  // === CALL:ENDED ===
  const handleCallEnded = useCallback(({ callId, duration, reason }) => {
    console.log('[useCall] 🔴 Call ended:', { callId, duration, reason });
    cleanup();
  }, []);

  // === CALL:MISSED ===
  const handleCallMissed = useCallback(({ callId }) => {
    console.log('[useCall] 📵 Call missed:', callId);
    setError('No answer');
    cleanup();
  }, [setError]);

  // === CALL:FAILED ===
  const handleCallFailed = useCallback(({ callId, reason, message }) => {
    console.log('[useCall] ❌ Call failed:', { reason, message });
    setError(message);
    cleanup();
  }, [setError]);

  // === CALL:ERROR ===
  const handleCallError = useCallback(({ message }) => {
    console.error('[useCall] ❌ Call error:', message);
    setError(message);
    cleanup();
  }, [setError]);

  // ============================================
  // WEBRTC SIGNALING HANDLERS
  // ============================================

  // === CALL:OFFER (Callee nhận) ===
  const handleOffer = useCallback(async ({ fromUid, offer }) => {
    console.log('[useCall] 📥 Received offer from:', fromUid);

    try {
      // ✅ FIX: Cleanup media cũ trước khi init mới
      if (isMediaInitialized.current) {
        console.log('[useCall] ⚠️ Media already initialized, cleaning up first');
        await webrtcRef.current.mediaHandler.stopCurrentStream();
        isMediaInitialized.current = false;
      }

      const callType = useCallStore.getState().callType;
      console.log('[useCall] 📹 Initializing media for callee:', callType);
      
      const stream = await webrtcRef.current.initializeCall(callType);
      setLocalStream(stream);
      isMediaInitialized.current = true;

      const answer = await webrtcRef.current.createAnswer(offer);
      
      const peerUid = useCallStore.getState().peerUid;
      callSocketService.sendAnswer(peerUid, answer);

      await processPendingIceCandidates();

      // Start timeout sau khi answer
      startConnectionTimeout();

    } catch (error) {
      console.error('[useCall] ❌ Callee WebRTC init error:', error);
      setError(error.message);
      handleEndCall();
    }
  }, [setLocalStream, setError, processPendingIceCandidates, startConnectionTimeout]);

  // === CALL:ANSWER (Caller nhận) ===
  const handleAnswer = useCallback(async ({ fromUid, answer }) => {
    console.log('[useCall] 📥 Received answer from:', fromUid);

    if (hasSetRemoteAnswer.current) {
      console.warn('[useCall] ⚠️ Answer already set, ignoring duplicate');
      return;
    }

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
      hasSetRemoteAnswer.current = true;
      console.log('[useCall] ✅ Remote answer set successfully');

      await processPendingIceCandidates();

    } catch (error) {
      console.error('[useCall] ❌ Set remote description error:', error);
      setError(error.message);
      handleEndCall();
    }
  }, [setError, processPendingIceCandidates]);

  // === CALL:ICE ===
  const handleIce = useCallback(async ({ fromUid, candidate }) => {
    if (!candidate) return;
    
    const pc = webrtcRef.current?.peerConnection;

    if (!pc || !pc.remoteDescription) {
      console.log('[useCall] 🧊 Buffering ICE candidate (remoteDescription not set)');
      pendingIceCandidates.current.push(candidate);
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[useCall] ✅ ICE candidate added directly');
    } catch (error) {
      console.error('[useCall] ❌ Add ICE candidate error:', error);
    }
  }, []);

  // ============================================
  // REGISTER SOCKET LISTENERS
  // ============================================
  useEffect(() => {
    if (!socket || !isConnected) {
      // ✅ FIX: Chỉ log khi disconnect, không log khi đang init
      if (socket && !isConnected) {
        console.log('[useCall] ⏳ Waiting for socket connection...');
      }
      return;
    }

    console.log('[useCall] ✅ Registering socket listeners');

    socket.on(CALL_EVENTS.INITIATED, handleCallInitiated);
    socket.on(CALL_EVENTS.INCOMING, handleCallIncoming);
    socket.on(CALL_EVENTS.ACCEPTED, handleCallAccepted);
    socket.on(CALL_EVENTS.REJECTED, handleCallRejected);
    socket.on(CALL_EVENTS.ENDED, handleCallEnded);
    socket.on(CALL_EVENTS.MISSED, handleCallMissed);
    socket.on(CALL_EVENTS.FAILED, handleCallFailed);
    socket.on(CALL_EVENTS.ERROR, handleCallError);

    socket.on(SIGNALING_EVENTS.OFFER_RECEIVED, handleOffer);
    socket.on(SIGNALING_EVENTS.ANSWER_RECEIVED, handleAnswer);
    socket.on(SIGNALING_EVENTS.ICE_RECEIVED, handleIce);

    return () => {
      console.log('[useCall] 🧹 Cleaning up socket listeners');
      
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
    // Guard double call
    if (isEndingRef.current) {
      console.log('[useCall] ⚠️ Already ending, skip duplicate');
      return;
    }
    isEndingRef.current = true;

    const currentCallId = useCallStore.getState().callId;
    
    if (!currentCallId) {
      cleanup();
      return;
    }

    console.log('[useCall] 🔴 Ending call:', currentCallId);
    
    setEnding();
    callSocketService.endCall(currentCallId);
    
    // Cleanup sẽ được gọi khi nhận call:ended
  }, [setEnding]);

  /**
   * Cleanup (internal)
   * ✅ FIX: Better cleanup sequence
   */
  const cleanup = useCallback(() => {
    console.log('[useCall] 🧹 Cleanup started');
    
    // 1. Clear timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // 2. Reset flags
    hasSetRemoteAnswer.current = false;
    isMediaInitialized.current = false;
    isEndingRef.current = false;
    pendingIceCandidates.current = [];
    
    // 3. ✅ CRITICAL: Stop media FIRST
    if (webrtcRef.current) {
      console.log('[useCall] 🎤 Stopping all media tracks');
      webrtcRef.current.mediaHandler.stopCurrentStream();
    }
    
    // 4. Then cleanup WebRTC
    if (webrtcRef.current) {
      webrtcRef.current.cleanup();
    }

    // 5. Reset store (với delay nhỏ để UI smooth)
    setTimeout(() => {
      resetCall();
    }, 300);
    
    console.log('[useCall] ✅ Cleanup complete');
  }, [resetCall]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================
  useEffect(() => {
    return () => {
      console.log('[useCall] 🔴 Component unmounting, cleanup');
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      
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
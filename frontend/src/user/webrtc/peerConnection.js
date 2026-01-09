// frontend/src/user/webrtc/peerConnection.js

import { ICE_SERVERS } from '../utils/call/callConstants';
import IceQueue from './iceQueue';
import MediaDevicesHandler from './mediaDevices';

/**
 * 🎯 WEBRTC MANAGER (SINGLETON) - FULL FIXED VERSION
 * 
 * Responsibilities:
 * - Manage RTCPeerConnection
 * - Handle offer/answer
 * - Manage ICE candidates
 * - Handle media streams
 * - Event callbacks
 * 
 * ✅ FIXES:
 * - Remote stream notification improved
 * - Proper track handling
 * - Better connection state management
 * - ICE candidate queueing
 * - Cleanup improvements
 */
class WebRTCManager {
  static instance = null;

  constructor() {
    if (WebRTCManager.instance) {
      return WebRTCManager.instance;
    }

    this.peerConnection = null;
    this.iceQueue = new IceQueue();
    this.mediaHandler = new MediaDevicesHandler();
    this.remoteStream = null;
    this.hasNotifiedRemoteStream = false;
    this.currentCallType = null; // ✅ NEW: Track call type

    // Event callbacks
    this.onIceCandidate = null;
    this.onTrack = null;
    this.onConnectionStateChange = null;

    WebRTCManager.instance = this;
  }

  static getInstance() {
    if (!WebRTCManager.instance) {
      WebRTCManager.instance = new WebRTCManager();
    }
    return WebRTCManager.instance;
  }

  /**
   * Initialize call - Get media & create peer connection
   * 
   * @param {string} callType - 'voice' | 'video'
   * @returns {Promise<MediaStream>}
   */
  async initializeCall(callType) {
    console.log(`[WebRTC] Initializing ${callType} call`);

    // ✅ Save call type
    this.currentCallType = callType;

    try {
      // 1. Get user media
      const localStream = await this.mediaHandler.getUserMedia(callType);

      // 2. Create peer connection
      this.createPeerConnection();

      // 3. Add local tracks to peer connection
      localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, localStream);
        console.log(`[WebRTC] Added ${track.kind} track:`, {
          id: track.id,
          label: track.label,
          enabled: track.enabled
        });
      });

      return localStream;

    } catch (error) {
      console.error('[WebRTC] Initialize error:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Create RTCPeerConnection with event handlers
   */
  createPeerConnection() {
    if (this.peerConnection) {
      console.warn('[WebRTC] PeerConnection already exists, closing old one');
      this.closePeerConnection();
    }

    console.log('[WebRTC] Creating peer connection with ICE servers:', ICE_SERVERS);

    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    
    // ✅ CRITICAL FIX: Reset ALL flags khi tạo PC mới
    this.hasNotifiedRemoteStream = false;
    this.remoteStream = null; // ⭐ Clear remote stream cũ
    
    console.log('[WebRTC] 🔄 Reset hasNotifiedRemoteStream flag and cleared remote stream');

    // ============================================
    // ICE CANDIDATE EVENT
    // ============================================
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] 🧊 ICE candidate generated:', {
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address
        });
        
        if (this.onIceCandidate) {
          this.onIceCandidate(event.candidate);
        }
      } else {
        console.log('[WebRTC] 🧊 ICE gathering complete');
      }
    };

    // ============================================
    // TRACK EVENT (Remote Stream)
    // ============================================
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] 🎵 Remote track received:', event.track.kind);
      console.log('[WebRTC] 🎵 Track details:', {
        id: event.track.id,
        label: event.track.label,
        enabled: event.track.enabled,
        muted: event.track.muted,
        readyState: event.track.readyState
      });

      // Get stream from event
      const [remoteStream] = event.streams;

      if (!remoteStream) {
        console.warn('[WebRTC] ⚠️ No remote stream in event');
        return;
      }

      // ✅ FIX: Luôn update stream reference (track có thể đến từng cái)
      const isNewStream = !this.remoteStream || this.remoteStream.id !== remoteStream.id;
      
      if (isNewStream) {
        this.remoteStream = remoteStream;
        console.log('[WebRTC] 🆕 New remote stream saved:', {
          id: remoteStream.id,
          audioTracks: remoteStream.getAudioTracks().length,
          videoTracks: remoteStream.getVideoTracks().length,
          active: remoteStream.active
        });
      } else {
        console.log('[WebRTC] 🔄 Stream updated with new track:', {
          id: remoteStream.id,
          audioTracks: remoteStream.getAudioTracks().length,
          videoTracks: remoteStream.getVideoTracks().length,
          active: remoteStream.active
        });
      }

      // ✅ CRITICAL FIX: Notify callback IMMEDIATELY when stream arrives
      // Don't wait for all tracks - they may arrive at different times
      if (!this.hasNotifiedRemoteStream && this.onTrack) {
        this.hasNotifiedRemoteStream = true;
        
        console.log('[WebRTC] ✅ Remote stream ready, notifying callback immediately', {
          audioTracks: remoteStream.getAudioTracks().length,
          videoTracks: remoteStream.getVideoTracks().length,
          callType: this.currentCallType
        });
        
        this.onTrack(remoteStream);
      }

      // ============================================
      // Monitor Track Events
      // ============================================
      event.track.onended = () => {
        console.log('[WebRTC] 🔴 Track ended:', event.track.kind);
      };

      event.track.onmute = () => {
        console.log('[WebRTC] 🔇 Track muted:', event.track.kind);
      };

      event.track.onunmute = () => {
        console.log('[WebRTC] 🔊 Track unmuted:', event.track.kind);
      };
    };

    // ============================================
    // CONNECTION STATE CHANGE
    // ============================================
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('[WebRTC] 🔌 Connection state:', state);

      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }

      // Log details for debugging
      if (state === 'connected') {
        console.log('[WebRTC] ✅ Connection established successfully');
      } else if (state === 'failed') {
        console.error('[WebRTC] ❌ Connection failed');
      } else if (state === 'disconnected') {
        console.warn('[WebRTC] ⚠️ Connection disconnected');
      }
    };

    // ============================================
    // ICE CONNECTION STATE
    // ============================================
    this.peerConnection.oniceconnectionstatechange = () => {
      const iceState = this.peerConnection.iceConnectionState;
      console.log('[WebRTC] 🧊 ICE connection state:', iceState);

      if (iceState === 'connected' || iceState === 'completed') {
        console.log('[WebRTC] ✅ ICE connection established');
      } else if (iceState === 'failed') {
        console.error('[WebRTC] ❌ ICE connection failed');
      } else if (iceState === 'disconnected') {
        console.warn('[WebRTC] ⚠️ ICE connection disconnected');
      }
    };

    // ============================================
    // SIGNALING STATE
    // ============================================
    this.peerConnection.onsignalingstatechange = () => {
      const signalingState = this.peerConnection.signalingState;
      console.log('[WebRTC] 📡 Signaling state:', signalingState);
    };

    // ============================================
    // ICE GATHERING STATE
    // ============================================
    this.peerConnection.onicegatheringstatechange = () => {
      const gatheringState = this.peerConnection.iceGatheringState;
      console.log('[WebRTC] 🧊 ICE gathering state:', gatheringState);
    };
  }

  /**
   * Create offer (Caller)
   * 
   * @returns {Promise<RTCSessionDescriptionInit>}
   */
  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    console.log('[WebRTC] 📤 Creating offer');

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await this.peerConnection.setLocalDescription(offer);

      console.log('[WebRTC] ✅ Offer created and set as local description:', {
        type: offer.type,
        sdp: offer.sdp.substring(0, 100) + '...'
      });

      return offer;

    } catch (error) {
      console.error('[WebRTC] ❌ Create offer error:', error);
      throw error;
    }
  }

  /**
   * Create answer (Callee)
   * 
   * @param {RTCSessionDescriptionInit} offer
   * @returns {Promise<RTCSessionDescriptionInit>}
   */
  async createAnswer(offer) {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    console.log('[WebRTC] 📥 Creating answer for offer');

    try {
      // 1. Set remote description (offer from caller)
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] ✅ Remote description (offer) set');

      // 2. Mark that remote description is set (for ICE queue)
      this.iceQueue.isRemoteDescriptionSet = true;

      // 3. Process queued ICE candidates
      await this.iceQueue.processQueue(this.peerConnection);

      // 4. Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      console.log('[WebRTC] ✅ Answer created and set as local description:', {
        type: answer.type,
        sdp: answer.sdp.substring(0, 100) + '...'
      });

      return answer;

    } catch (error) {
      console.error('[WebRTC] ❌ Create answer error:', error);
      throw error;
    }
  }

  /**
   * Set remote description (Caller receives answer)
   * 
   * @param {RTCSessionDescriptionInit} answer
   */
  async setRemoteDescription(answer) {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    console.log('[WebRTC] 📥 Setting remote description (answer)');

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] ✅ Remote description (answer) set');

      // Mark that remote description is set (for ICE queue)
      this.iceQueue.isRemoteDescriptionSet = true;

      // Process queued ICE candidates
      await this.iceQueue.processQueue(this.peerConnection);

    } catch (error) {
      console.error('[WebRTC] ❌ Set remote description error:', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   * 
   * @param {RTCIceCandidateInit} candidate
   */
  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      console.warn('[WebRTC] ⚠️ PeerConnection not ready, candidate ignored');
      return;
    }

    // If remote description not set yet, queue the candidate
    if (!this.iceQueue.canAddDirectly()) {
      console.log('[WebRTC] 🧊 Queueing ICE candidate (remote description not set)');
      this.iceQueue.add(candidate);
      return;
    }

    // Add directly
    await this.iceQueue.addDirectly(this.peerConnection, candidate);
  }

  /**
   * Toggle mute
   */
  toggleMute(enabled) {
    const result = this.mediaHandler.toggleAudio(enabled);
    console.log('[WebRTC] 🎤 Audio toggled:', enabled ? 'ON' : 'OFF');
    return result;
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled) {
    const result = this.mediaHandler.toggleVideo(enabled);
    console.log('[WebRTC] 📹 Video toggled:', enabled ? 'ON' : 'OFF');
    return result;
  }

  /**
   * Switch camera (mobile)
   */
  async switchCamera() {
    console.log('[WebRTC] 🔄 Switching camera');
    return await this.mediaHandler.switchCamera();
  }

  /**
   * Get local stream
   */
  getLocalStream() {
    return this.mediaHandler.getStream();
  }

  /**
   * Close peer connection
   */
  closePeerConnection() {
    if (this.peerConnection) {
      console.log('[WebRTC] 🔌 Closing peer connection');
      
      // Close all transceivers
      if (this.peerConnection.getTransceivers) {
        this.peerConnection.getTransceivers().forEach(transceiver => {
          if (transceiver.stop) {
            transceiver.stop();
          }
        });
      }
      
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    console.log('[WebRTC] 🧹 Cleanup started');

    // Stop local media
    this.mediaHandler.stopCurrentStream();

    // Close peer connection
    this.closePeerConnection();

    // Clear remote stream reference (don't stop tracks - they belong to peer connection)
    this.remoteStream = null;
    this.hasNotifiedRemoteStream = false;
    this.currentCallType = null; // ✅ Reset call type

    // Clear ICE queue
    this.iceQueue.clear();

    // Clear callbacks
    this.onIceCandidate = null;
    this.onTrack = null;
    this.onConnectionStateChange = null;

    console.log('[WebRTC] ✅ Cleanup complete');
  }
}

export default WebRTCManager;
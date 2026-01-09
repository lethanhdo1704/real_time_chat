// frontend/src/user/webrtc/peerConnection.js

import { ICE_SERVERS } from '../utils/call/callConstants';
import IceQueue from './iceQueue';
import MediaDevicesHandler from './mediaDevices';

/**
 * 🎯 WEBRTC MANAGER (SINGLETON)
 * 
 * Responsibilities:
 * - Manage RTCPeerConnection
 * - Handle offer/answer
 * - Manage ICE candidates
 * - Handle media streams
 * - Event callbacks
 * 
 * ⚠️ CRITICAL RULES:
 * - 1 call = 1 PeerConnection
 * - PHẢI cleanup sau mỗi call
 * - ICE candidates PHẢI queue
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
    this.remoteStream = null; // ✅ ADD: Track remote stream

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

    try {
      // 1. Get user media
      const localStream = await this.mediaHandler.getUserMedia(callType);

      // 2. Create peer connection
      this.createPeerConnection();

      // 3. Add local tracks to peer connection
      localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, localStream);
        console.log(`[WebRTC] Added ${track.kind} track`);
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

    console.log('[WebRTC] Creating peer connection');

    this.peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.remoteStream = new MediaStream(); // ✅ Create empty remote stream

    // === ICE CANDIDATE EVENT ===
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate generated');
        if (this.onIceCandidate) {
          this.onIceCandidate(event.candidate);
        }
      } else {
        console.log('[WebRTC] ICE gathering complete');
      }
    };

    // === TRACK EVENT (remote stream) ===
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] 🎵 Remote track received:', event.track.kind);
      console.log('[WebRTC] 🎵 Track details:', {
        id: event.track.id,
        enabled: event.track.enabled,
        muted: event.track.muted,
        readyState: event.track.readyState
      });

      // ✅ CRITICAL: Enable track if disabled
      if (!event.track.enabled) {
        event.track.enabled = true;
        console.log('[WebRTC] ⚠️ Track was disabled, enabling it');
      }

      // ✅ Add track to our managed stream
      event.track.onended = () => {
        console.log('[WebRTC] Track ended:', event.track.kind);
      };

      // ✅ Wait for track to be unmuted
      event.track.onunmute = () => {
        console.log('[WebRTC] 🔊 Track unmuted:', event.track.kind);
      };

      this.remoteStream.addTrack(event.track);
      
      console.log('[WebRTC] 🎵 Remote stream now has:', {
        audioTracks: this.remoteStream.getAudioTracks().length,
        videoTracks: this.remoteStream.getVideoTracks().length,
        active: this.remoteStream.active
      });

      // ✅ Notify callback with our managed stream
      if (this.onTrack) {
        this.onTrack(this.remoteStream);
      }
    };

    // === CONNECTION STATE CHANGE ===
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log('[WebRTC] Connection state:', state);

      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state);
      }

      // Auto cleanup on failed/closed
      if (state === 'failed' || state === 'closed') {
        console.warn('[WebRTC] Connection failed/closed');
      }
    };

    // === ICE CONNECTION STATE ===
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE state:', this.peerConnection.iceConnectionState);
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

    console.log('[WebRTC] Creating offer');

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      console.log('[WebRTC] Offer created and set as local description');

      return offer;

    } catch (error) {
      console.error('[WebRTC] Create offer error:', error);
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

    console.log('[WebRTC] Creating answer');

    try {
      // 1. Set remote description (offer từ caller)
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] Remote description set');

      // 2. Process queued ICE candidates
      await this.iceQueue.processQueue(this.peerConnection);

      // 3. Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      console.log('[WebRTC] Answer created and set as local description');

      return answer;

    } catch (error) {
      console.error('[WebRTC] Create answer error:', error);
      throw error;
    }
  }

  /**
   * Set remote description (Caller nhận answer)
   * 
   * @param {RTCSessionDescriptionInit} answer
   */
  async setRemoteDescription(answer) {
    if (!this.peerConnection) {
      throw new Error('PeerConnection not initialized');
    }

    console.log('[WebRTC] Setting remote description');

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] Remote description set');

      // Process queued ICE candidates
      await this.iceQueue.processQueue(this.peerConnection);

    } catch (error) {
      console.error('[WebRTC] Set remote description error:', error);
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
      console.warn('[WebRTC] PeerConnection not ready, candidate ignored');
      return;
    }

    // Nếu remote description chưa set → queue
    if (!this.iceQueue.canAddDirectly()) {
      console.log('[WebRTC] Queueing ICE candidate');
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
    return this.mediaHandler.toggleAudio(enabled);
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled) {
    return this.mediaHandler.toggleVideo(enabled);
  }

  /**
   * Switch camera
   */
  async switchCamera() {
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
      console.log('[WebRTC] Closing peer connection');
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    console.log('[WebRTC] Cleanup started');

    // Stop media
    this.mediaHandler.stopCurrentStream();

    // Close peer connection
    this.closePeerConnection();

    // Clear remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Clear ICE queue
    this.iceQueue.clear();

    // Clear callbacks
    this.onIceCandidate = null;
    this.onTrack = null;
    this.onConnectionStateChange = null;

    console.log('[WebRTC] Cleanup complete');
  }
}

export default WebRTCManager;
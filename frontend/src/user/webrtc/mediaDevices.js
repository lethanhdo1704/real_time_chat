// frontend/src/user/webrtc/mediaDevices.js

import { CALL_TYPE, MEDIA_CONSTRAINTS, CALL_ERROR } from '../utils/call/callConstants';

/**
 * 🎯 MEDIA DEVICES HANDLER - FIXED VERSION
 * 
 * Responsibilities:
 * - Request camera/microphone permissions
 * - Get user media stream
 * - Handle permission errors
 * - Stop media tracks properly
 * 
 * ✅ FIXES:
 * - Add delay after stopping stream
 * - Better track cleanup
 * - Handle "Device in use" error
 */
class MediaDevicesHandler {
  constructor() {
    this.currentStream = null;
    this.isStopping = false; // ✅ NEW: Flag để tránh race condition
  }

  /**
   * Request user media (audio/video)
   * 
   * @param {string} callType - 'voice' | 'video'
   * @returns {Promise<MediaStream>}
   */
  async getUserMedia(callType) {
    // ✅ FIX: Đợi nếu đang stop stream
    if (this.isStopping) {
      console.log('[Media] Waiting for previous stream to stop...');
      await this.waitForStreamStop();
    }

    // Stop existing stream trước khi request mới
    await this.stopCurrentStream();

    try {
      const constraints = callType === CALL_TYPE.VIDEO
        ? MEDIA_CONSTRAINTS.VIDEO
        : MEDIA_CONSTRAINTS.VOICE;

      console.log(`[Media] Requesting ${callType} stream`, constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      this.currentStream = stream;
      
      console.log(`[Media] ✅ Stream obtained:`, {
        id: stream.id,
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length,
        active: stream.active
      });

      // Log track details
      stream.getTracks().forEach(track => {
        console.log(`[Media] 📹 Track:`, {
          kind: track.kind,
          id: track.id,
          label: track.label,
          enabled: track.enabled,
          readyState: track.readyState
        });
      });

      return stream;

    } catch (error) {
      console.error('[Media] ❌ getUserMedia error:', error.name, error.message);
      
      // ✅ FIX: Handle "NotReadableError" (Device in use)
      if (error.name === 'NotReadableError') {
        console.warn('[Media] Device in use, retrying after delay...');
        
        // Đợi thêm 500ms và retry 1 lần
        await this.delay(500);
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          this.currentStream = stream;
          console.log('[Media] ✅ Retry successful');
          return stream;
        } catch (retryError) {
          console.error('[Media] ❌ Retry failed:', retryError);
          throw new Error('Device in use');
        }
      }
      
      // Map other error codes
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error(CALL_ERROR.PERMISSION_DENIED);
      }
      
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error(CALL_ERROR.DEVICE_NOT_FOUND);
      }
      
      throw new Error(error.message || 'Failed to get user media');
    }
  }

  /**
   * Stop current stream (khi end call)
   * ✅ FIX: Thêm delay để browser release device
   */
  async stopCurrentStream() {
    if (!this.currentStream) {
      return;
    }

    this.isStopping = true;
    
    console.log('[Media] 🛑 Stopping stream:', this.currentStream.id);
    
    try {
      const tracks = this.currentStream.getTracks();
      
      // Stop tất cả tracks
      tracks.forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
          console.log(`[Media] 🛑 Stopped ${track.kind} track:`, track.id);
        }
      });
      
      // Clear reference
      this.currentStream = null;
      
      // ✅ CRITICAL: Đợi browser release device
      await this.delay(200);
      
      console.log('[Media] ✅ Stream stopped and device released');
      
    } catch (error) {
      console.error('[Media] Error stopping stream:', error);
    } finally {
      this.isStopping = false;
    }
  }

  /**
   * ✅ NEW: Đợi cho stream stop xong
   */
  async waitForStreamStop(maxWait = 2000) {
    const startTime = Date.now();
    
    while (this.isStopping && (Date.now() - startTime) < maxWait) {
      await this.delay(50);
    }
    
    if (this.isStopping) {
      console.warn('[Media] ⚠️ Stream stop timeout');
      this.isStopping = false;
    }
  }

  /**
   * ✅ NEW: Helper delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Toggle mute (audio)
   */
  toggleAudio(enabled) {
    if (!this.currentStream) return false;

    const audioTracks = this.currentStream.getAudioTracks();
    
    audioTracks.forEach(track => {
      track.enabled = enabled;
    });

    console.log(`[Media] 🎤 Audio ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Toggle video
   */
  toggleVideo(enabled) {
    if (!this.currentStream) return false;

    const videoTracks = this.currentStream.getVideoTracks();
    
    videoTracks.forEach(track => {
      track.enabled = enabled;
    });

    console.log(`[Media] 📹 Video ${enabled ? 'enabled' : 'disabled'}`);
    return true;
  }

  /**
   * Switch camera (front/back) - Mobile only
   */
  async switchCamera() {
    if (!this.currentStream) return false;

    const videoTrack = this.currentStream.getVideoTracks()[0];
    if (!videoTrack) return false;

    try {
      const constraints = videoTrack.getConstraints();
      const newFacingMode = constraints.facingMode === 'user' ? 'environment' : 'user';
      
      await videoTrack.applyConstraints({
        facingMode: newFacingMode
      });

      console.log(`[Media] 🔄 Camera switched to ${newFacingMode}`);
      return true;

    } catch (error) {
      console.error('[Media] ❌ Failed to switch camera:', error);
      return false;
    }
  }

  /**
   * Check if audio is enabled
   */
  isAudioEnabled() {
    if (!this.currentStream) return false;
    
    const audioTrack = this.currentStream.getAudioTracks()[0];
    return audioTrack ? audioTrack.enabled : false;
  }

  /**
   * Check if video is enabled
   */
  isVideoEnabled() {
    if (!this.currentStream) return false;
    
    const videoTrack = this.currentStream.getVideoTracks()[0];
    return videoTrack ? videoTrack.enabled : false;
  }

  /**
   * Get current stream
   */
  getStream() {
    return this.currentStream;
  }

  /**
   * ✅ NEW: Force cleanup (emergency)
   */
  forceCleanup() {
    console.log('[Media] 🚨 Force cleanup');
    
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // Ignore errors
        }
      });
      this.currentStream = null;
    }
    
    this.isStopping = false;
  }
}

export default MediaDevicesHandler;
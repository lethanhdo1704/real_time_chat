// frontend/src/user/webrtc/mediaDevices.js

import { CALL_TYPE, MEDIA_CONSTRAINTS, CALL_ERROR } from '../utils/call/callConstants';

/**
 * 🎯 MEDIA DEVICES HANDLER
 * 
 * Responsibilities:
 * - Request camera/microphone permissions
 * - Get user media stream
 * - Handle permission errors
 * - Stop media tracks
 */
class MediaDevicesHandler {
  constructor() {
    this.currentStream = null;
  }

  /**
   * Request user media (audio/video)
   * 
   * @param {string} callType - 'voice' | 'video'
   * @returns {Promise<MediaStream>}
   */
  async getUserMedia(callType) {
    // Stop existing stream trước khi request mới
    this.stopCurrentStream();

    try {
      const constraints = callType === CALL_TYPE.VIDEO
        ? MEDIA_CONSTRAINTS.VIDEO
        : MEDIA_CONSTRAINTS.VOICE;

      console.log(`[Media] Requesting ${callType} stream`, constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      this.currentStream = stream;
      
      console.log(`[Media] Stream obtained:`, {
        audioTracks: stream.getAudioTracks().length,
        videoTracks: stream.getVideoTracks().length
      });

      return stream;

    } catch (error) {
      console.error('[Media] getUserMedia error:', error);
      
      // Map error codes
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
   */
  stopCurrentStream() {
    if (this.currentStream) {
      console.log('[Media] Stopping stream');
      
      this.currentStream.getTracks().forEach(track => {
        track.stop();
        console.log(`[Media] Stopped ${track.kind} track`);
      });
      
      this.currentStream = null;
    }
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

    console.log(`[Media] Audio ${enabled ? 'enabled' : 'disabled'}`);
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

    console.log(`[Media] Video ${enabled ? 'enabled' : 'disabled'}`);
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

      console.log(`[Media] Camera switched to ${newFacingMode}`);
      return true;

    } catch (error) {
      console.error('[Media] Failed to switch camera:', error);
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
}

export default MediaDevicesHandler;
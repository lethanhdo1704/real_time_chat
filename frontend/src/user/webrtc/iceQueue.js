// frontend/src/user/webrtc/iceQueue.js

/**
 * 🎯 ICE CANDIDATE QUEUE
 * 
 * WHY: ICE candidates có thể đến TRƯỚC khi setRemoteDescription
 * SOLUTION: Queue lại và add sau khi remote description ready
 * 
 * ⚠️ CRITICAL: Nếu không có queue → call sẽ fail
 */
class IceQueue {
  constructor() {
    this.queue = [];
    this.isRemoteDescriptionSet = false;
  }

  /**
   * Thêm ICE candidate vào queue
   */
  add(candidate) {
    if (!candidate) return;
    
    this.queue.push(candidate);
    console.log(`[ICE Queue] Added candidate. Queue size: ${this.queue.length}`);
  }

  /**
   * Đánh dấu remote description đã được set
   * và process toàn bộ queue
   */
  async processQueue(peerConnection) {
    if (!peerConnection) {
      console.error('[ICE Queue] No peer connection provided');
      return;
    }

    this.isRemoteDescriptionSet = true;

    console.log(`[ICE Queue] Processing ${this.queue.length} candidates`);

    const errors = [];

    for (const candidate of this.queue) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[ICE Queue] Candidate added successfully');
      } catch (error) {
        console.error('[ICE Queue] Error adding candidate:', error);
        errors.push(error);
      }
    }

    // Clear queue sau khi process
    this.queue = [];

    if (errors.length > 0) {
      console.warn(`[ICE Queue] ${errors.length} candidates failed to add`);
    }

    return errors.length === 0;
  }

  /**
   * Thêm candidate trực tiếp (nếu remote description đã set)
   */
  async addDirectly(peerConnection, candidate) {
    if (!candidate || !peerConnection) return;

    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[ICE Queue] Direct candidate added');
      return true;
    } catch (error) {
      console.error('[ICE Queue] Error adding direct candidate:', error);
      return false;
    }
  }

  /**
   * Check xem có thể add trực tiếp không
   */
  canAddDirectly() {
    return this.isRemoteDescriptionSet;
  }

  /**
   * Clear queue (khi end call)
   */
  clear() {
    this.queue = [];
    this.isRemoteDescriptionSet = false;
    console.log('[ICE Queue] Cleared');
  }

  /**
   * Get queue size (for debugging)
   */
  size() {
    return this.queue.length;
  }
}

export default IceQueue;
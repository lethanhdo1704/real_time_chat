// backend/services/friendEmitter.service.js
import { EventEmitter } from 'events';

class FriendEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20); // Tránh memory leak warning
  }

  /**
   * Emit khi có lời mời kết bạn mới
   */
  emitRequestSent(data) {
    this.emit('friend:request_sent', data);
  }

  /**
   * Emit khi lời mời được chấp nhận
   */
  emitRequestAccepted(data) {
    this.emit('friend:request_accepted', data);
  }

  /**
   * Emit khi lời mời bị từ chối
   */
  emitRequestRejected(data) {
    this.emit('friend:request_rejected', data);
  }

  /**
   * Emit khi lời mời bị hủy
   */
  emitRequestCancelled(data) {
    this.emit('friend:request_cancelled', data);
  }

  /**
   * Emit khi hủy kết bạn
   */
  emitUnfriended(data) {
    this.emit('friend:unfriended', data);
  }

  /**
   * 🔥 NEW: Emit khi lời mời được đánh dấu đã xem
   */
  emitRequestSeen(data) {
    this.emit('friend:request_seen', data);
  }
}

// Singleton instance
const friendEmitter = new FriendEmitter();

// Export event types để tránh typo
export const FRIEND_EVENTS = {
  REQUEST_SENT: 'friend:request_sent',
  REQUEST_ACCEPTED: 'friend:request_accepted',
  REQUEST_REJECTED: 'friend:request_rejected',
  REQUEST_CANCELLED: 'friend:request_cancelled',
  UNFRIENDED: 'friend:unfriended',
  REQUEST_SEEN: 'friend:request_seen' // 🔥 NEW
};

export default friendEmitter;
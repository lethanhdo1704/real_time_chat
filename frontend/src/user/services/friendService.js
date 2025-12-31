// frontend/src/services/friendService.js
import api from './api';

const friendService = {
  /**
   * Gửi lời mời kết bạn
   */
  async sendFriendRequest(friendUid) {
    try {
      const response = await api.post('/friends/request', { friendUid });
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Chấp nhận lời mời kết bạn
   */
  async acceptFriendRequest(friendUid) {
    try {
      const response = await api.post('/friends/accept', { friendUid });
      return response.data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Từ chối lời mời kết bạn
   */
  async rejectFriendRequest(friendUid) {
    try {
      const response = await api.post('/friends/reject', { friendUid });
      return response.data;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Hủy lời mời đã gửi
   */
  async cancelFriendRequest(friendUid) {
    try {
      const response = await api.post('/friends/cancel', { friendUid });
      return response.data;
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Hủy kết bạn
   */
  async unfriend(friendUid) {
    try {
      const response = await api.post('/friends/unfriend', { friendUid });
      return response.data;
    } catch (error) {
      console.error('Error unfriending:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy danh sách bạn bè và lời mời
   */
  async getFriendsList() {
    try {
      const response = await api.get('/friends/list');
      return response.data; // { friends, requests, sentRequests }
    } catch (error) {
      console.error('Error fetching friends list:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Kiểm tra trạng thái quan hệ với một user
   */
  async getFriendStatus(friendUid) {
    try {
      const response = await api.get(`/friends/status/${friendUid}`);
      return response.data; // { status: "friends" | "request_sent" | "request_received" | "none" | "self" }
    } catch (error) {
      console.error('Error fetching friend status:', error);
      throw error.response?.data || error;
    }
  },

  // ============================================
  // 🔥 NEW: SEEN TRACKING
  // ============================================

  /**
   * Đánh dấu một lời mời đã xem
   */
  async markRequestAsSeen(requestId) {
    try {
      const response = await api.patch(`/friends/requests/${requestId}/seen`);
      return response.data; // { success, seenAt }
    } catch (error) {
      console.error('Error marking request as seen:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Đánh dấu tất cả lời mời đã xem
   */
  async markAllRequestsAsSeen() {
    try {
      const response = await api.patch('/friends/requests/seen-all');
      return response.data; // { success, updatedCount }
    } catch (error) {
      console.error('Error marking all requests as seen:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Lấy số lượng lời mời chưa xem
   */
  async getUnseenRequestCount() {
    try {
      const response = await api.get('/friends/requests/unseen-count');
      return response.data; // { success, count }
    } catch (error) {
      console.error('Error fetching unseen count:', error);
      throw error.response?.data || error;
    }
  }
};

export default friendService;
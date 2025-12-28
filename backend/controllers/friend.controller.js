// backend/controllers/friend.controller.js
import friendService from "../services/friend.service.js";

class FriendController {
  /**
   * Gửi lời mời kết bạn
   * POST /api/friends/request
   */
  async sendRequest(req, res) {
    const { friendUid } = req.body;

    try {
      const newFriend = await friendService.sendRequest(req.user.id, friendUid);

      res.status(200).json({ 
        message: "Đã gửi lời mời kết bạn thành công", 
        friend: newFriend 
      });
    } catch (err) {
      if (err.code === "USER_NOT_FOUND") {
        return res.status(404).json({ 
          message: err.message,
          code: err.code
        });
      }
      if (err.code === "SELF_FRIEND" || err.code === "ALREADY_FRIENDS" || 
          err.code === "REQUEST_ALREADY_SENT" || err.code === "REQUEST_ALREADY_RECEIVED") {
        return res.status(400).json({ 
          message: err.message,
          code: err.code
        });
      }
      console.error("Error in sendRequest:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  /**
   * Chấp nhận lời mời kết bạn
   * POST /api/friends/accept
   */
  async acceptRequest(req, res) {
    const { friendUid } = req.body;

    try {
      const friendDoc = await friendService.acceptRequest(req.user.id, friendUid);

      res.status(200).json({ 
        message: "Đã chấp nhận lời mời kết bạn", 
        friend: friendDoc 
      });
    } catch (err) {
      if (err.code === "USER_NOT_FOUND") {
        return res.status(404).json({ 
          message: err.message,
          code: err.code
        });
      }
      if (err.code === "ALREADY_FRIENDS" || err.code === "REQUEST_NOT_FOUND") {
        return res.status(400).json({ 
          message: err.message,
          code: err.code
        });
      }
      console.error("Error in acceptRequest:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  /**
   * Từ chối lời mời kết bạn
   * POST /api/friends/reject
   */
  async rejectRequest(req, res) {
    const { friendUid } = req.body;

    try {
      await friendService.rejectRequest(req.user.id, friendUid);

      res.status(200).json({ message: "Đã từ chối lời mời kết bạn" });
    } catch (err) {
      if (err.code === "USER_NOT_FOUND") {
        return res.status(404).json({ 
          message: err.message,
          code: err.code
        });
      }
      if (err.code === "REQUEST_NOT_FOUND") {
        return res.status(400).json({ 
          message: err.message,
          code: err.code
        });
      }
      console.error("Error in rejectRequest:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  /**
   * Hủy lời mời kết bạn đã gửi
   * POST /api/friends/cancel
   */
  async cancelRequest(req, res) {
    const { friendUid } = req.body;

    try {
      await friendService.cancelRequest(req.user.id, friendUid);

      res.status(200).json({ message: "Đã hủy lời mời kết bạn" });
    } catch (err) {
      if (err.code === "USER_NOT_FOUND") {
        return res.status(404).json({ 
          message: err.message,
          code: err.code
        });
      }
      if (err.code === "REQUEST_NOT_FOUND") {
        return res.status(400).json({ 
          message: err.message,
          code: err.code
        });
      }
      console.error("Error in cancelRequest:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  /**
   * Hủy kết bạn
   * POST /api/friends/unfriend
   */
  async unfriend(req, res) {
    const { friendUid } = req.body;

    try {
      await friendService.unfriend(req.user.id, friendUid);

      res.status(200).json({ message: "Đã hủy kết bạn" });
    } catch (err) {
      if (err.code === "USER_NOT_FOUND") {
        return res.status(404).json({ 
          message: err.message,
          code: err.code
        });
      }
      if (err.code === "FRIENDSHIP_NOT_FOUND") {
        return res.status(400).json({ 
          message: err.message,
          code: err.code
        });
      }
      console.error("Error in unfriend:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  /**
   * Lấy danh sách bạn bè và lời mời
   * GET /api/friends/list
   */
  async getFriendsList(req, res) {
    try {
      const result = await friendService.getFriendsList(req.user.id);

      res.status(200).json(result);
    } catch (err) {
      console.error("Error in getFriendsList:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  /**
   * Kiểm tra trạng thái quan hệ với một user
   * GET /api/friends/status/:friendUid
   */
  async getFriendStatus(req, res) {
    const { friendUid } = req.params;

    try {
      const result = await friendService.getFriendStatus(req.user.id, friendUid);

      res.status(200).json(result);
    } catch (err) {
      if (err.message === "USER_NOT_FOUND") {
        return res.status(404).json({ 
          message: "Không tìm thấy người dùng này",
          code: "USER_NOT_FOUND"
        });
      }
      console.error("Error in getFriendStatus:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  /**
   * 🔥 NEW: Đánh dấu một lời mời đã xem
   * PATCH /api/friends/requests/:requestId/seen
   */
  async markRequestAsSeen(req, res) {
    const { requestId } = req.params;

    try {
      const result = await friendService.markRequestAsSeen(req.user.id, requestId);

      res.status(200).json({ 
        success: true,
        message: "Đã đánh dấu đã xem",
        seenAt: result.seenAt 
      });
    } catch (err) {
      if (err.code === "REQUEST_NOT_FOUND") {
        return res.status(404).json({ 
          message: err.message,
          code: err.code
        });
      }
      if (err.code === "UNAUTHORIZED") {
        return res.status(403).json({ 
          message: err.message,
          code: err.code
        });
      }
      console.error("Error in markRequestAsSeen:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  /**
   * 🔥 NEW: Đánh dấu tất cả lời mời đã xem
   * PATCH /api/friends/requests/seen-all
   */
  async markAllRequestsAsSeen(req, res) {
    try {
      const result = await friendService.markAllRequestsAsSeen(req.user.id);

      res.status(200).json({ 
        success: true,
        message: "Đã đánh dấu tất cả đã xem",
        updatedCount: result.updatedCount
      });
    } catch (err) {
      console.error("Error in markAllRequestsAsSeen:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }

  /**
   * 🔥 NEW: Lấy số lượng lời mời chưa xem
   * GET /api/friends/requests/unseen-count
   */
  async getUnseenRequestCount(req, res) {
    try {
      const count = await friendService.getUnseenRequestCount(req.user.id);

      res.status(200).json({ 
        success: true,
        count 
      });
    } catch (err) {
      console.error("Error in getUnseenRequestCount:", err);
      res.status(500).json({ message: "Lỗi server" });
    }
  }
}

export default new FriendController();
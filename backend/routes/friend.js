// backend/routes/friends.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import friendService from "../services/friend.service.js";

const router = express.Router();

/**
 * Gửi lời mời kết bạn0
 * POST /api/friends/request
 * body: { friendUid }
 */
router.post("/request", authMiddleware, async (req, res) => {
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
    console.error("Error in POST /request:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * Chấp nhận lời mời kết bạn
 * POST /api/friends/accept
 * body: { friendUid }
 */
router.post("/accept", authMiddleware, async (req, res) => {
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
    console.error("Error in POST /accept:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * Từ chối lời mời kết bạn
 * POST /api/friends/reject
 * body: { friendUid }
 */
router.post("/reject", authMiddleware, async (req, res) => {
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
    console.error("Error in POST /reject:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * Hủy lời mời kết bạn đã gửi
 * POST /api/friends/cancel
 * body: { friendUid }
 */
router.post("/cancel", authMiddleware, async (req, res) => {
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
    console.error("Error in POST /cancel:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * Hủy kết bạn
 * POST /api/friends/unfriend
 * body: { friendUid }
 */
router.post("/unfriend", authMiddleware, async (req, res) => {
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
    console.error("Error in POST /unfriend:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * Lấy danh sách bạn bè và lời mời
 * GET /api/friends/list
 */
router.get("/list", authMiddleware, async (req, res) => {
  try {
    const result = await friendService.getFriendsList(req.user.id);

    res.status(200).json(result);
  } catch (err) {
    console.error("Error in GET /list:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

/**
 * Kiểm tra trạng thái quan hệ với một user
 * GET /api/friends/status/:friendUid
 */
router.get("/status/:friendUid", authMiddleware, async (req, res) => {
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
    console.error("Error in GET /status:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
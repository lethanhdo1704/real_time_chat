// backend/routes/friends.js
import express from "express";
import Friend from "../models/Friend.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js"; // Giả sử bạn có middleware này

const router = express.Router();

import mongoose from "mongoose";

/**
 * Helper: Convert uid (string) → _id (ObjectId)
 */
async function uidToId(uid) {
  const user = await User.findOne({ uid }).select("_id");
  if (!user) throw new Error("USER_NOT_FOUND");
  return user._id;
}

/**
 * Helper: Ensure value is ObjectId
 */
function toObjectId(value) {
  if (value instanceof mongoose.Types.ObjectId) return value;
  return new mongoose.Types.ObjectId(value);
}

/**
 * Gửi lời mời kết bạn
 * POST /api/friends/request
 * body: { friendUid }  ← CHỈ nhận friendUid, userUid lấy từ JWT
 */
router.post("/request", authMiddleware, async (req, res) => {
  const { friendUid } = req.body;
  const userId = toObjectId(req.user.id); // ← Convert to ObjectId

  try {
    // Convert friendUid → friendId
    const friendId = await uidToId(friendUid);

    // Không thể tự kết bạn
    if (userId.equals(friendId)) {
      return res.status(400).json({ 
        message: "Không thể tự kết bạn với chính mình",
        code: "SELF_FRIEND"
      });
    }

    // Kiểm tra đã là bạn bè chưa
    const alreadyFriends = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId, status: "accepted" },
        { user: friendId, friend: userId, status: "accepted" }
      ]
    });
    
    if (alreadyFriends) {
      return res.status(400).json({ 
        message: "Bạn đã là bạn bè với người này rồi",
        code: "ALREADY_FRIENDS"
      });
    }

    // Kiểm tra đã có lời mời pending chưa
    const existingRequest = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId, status: "pending" },
        { user: friendId, friend: userId, status: "pending" }
      ]
    });
    
    if (existingRequest) {
      if (existingRequest.user.equals(friendId)) {
        return res.status(400).json({ 
          message: "Người này đã gửi lời mời kết bạn cho bạn, hãy kiểm tra lời mời kết bạn",
          code: "REQUEST_ALREADY_RECEIVED"
        });
      }
      return res.status(400).json({ 
        message: "Bạn đã gửi lời mời kết bạn cho người này rồi",
        code: "REQUEST_ALREADY_SENT"
      });
    }

    // Tạo lời mời mới
    const newFriend = new Friend({ 
      user: userId, 
      friend: friendId, 
      status: "pending" 
    });
    await newFriend.save();

    res.status(200).json({ 
      message: "Đã gửi lời mời kết bạn thành công", 
      friend: newFriend 
    });
  } catch (err) {
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ 
        message: "Không tìm thấy người dùng này",
        code: "USER_NOT_FOUND"
      });
    }
    res.status(500).json({ message: err.message });
  }
});

/**
 * Chấp nhận lời mời kết bạn
 * POST /api/friends/accept
 * body: { friendUid }
 */
router.post("/accept", authMiddleware, async (req, res) => {
  const { friendUid } = req.body;
  const userId = toObjectId(req.user.id);

  try {
    const friendId = await uidToId(friendUid);

    // Kiểm tra đã là bạn bè chưa
    const alreadyFriends = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId, status: "accepted" },
        { user: friendId, friend: userId, status: "accepted" }
      ]
    });
    
    if (alreadyFriends) {
      return res.status(400).json({ 
        message: "Bạn đã là bạn bè với người này rồi",
        code: "ALREADY_FRIENDS"
      });
    }

    // Tìm lời mời từ người gửi
    const friendDoc = await Friend.findOne({
      user: friendId,
      friend: userId,
      status: "pending",
    });
    
    if (!friendDoc) {
      return res.status(404).json({ 
        message: "Không tìm thấy lời mời kết bạn",
        code: "REQUEST_NOT_FOUND"
      });
    }

    // Cập nhật trạng thái
    friendDoc.status = "accepted";
    await friendDoc.save();

    res.status(200).json({ 
      message: "Đã chấp nhận lời mời kết bạn", 
      friend: friendDoc 
    });
  } catch (err) {
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ 
        message: "Không tìm thấy người dùng này",
        code: "USER_NOT_FOUND"
      });
    }
    res.status(500).json({ message: err.message });
  }
});

/**
 * Từ chối lời mời kết bạn
 * POST /api/friends/reject
 * body: { friendUid }
 */
router.post("/reject", authMiddleware, async (req, res) => {
  const { friendUid } = req.body;
  const userId = toObjectId(req.user.id);

  try {
    const friendId = await uidToId(friendUid);

    const deleted = await Friend.findOneAndDelete({
      user: friendId,
      friend: userId,
      status: "pending",
    });
    
    if (!deleted) {
      return res.status(404).json({ 
        message: "Không tìm thấy lời mời kết bạn",
        code: "REQUEST_NOT_FOUND"
      });
    }

    res.status(200).json({ message: "Đã từ chối lời mời kết bạn" });
  } catch (err) {
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ 
        message: "Không tìm thấy người dùng này",
        code: "USER_NOT_FOUND"
      });
    }
    res.status(500).json({ message: err.message });
  }
});

/**
 * Hủy lời mời kết bạn đã gửi
 * POST /api/friends/cancel
 * body: { friendUid }
 */
router.post("/cancel", authMiddleware, async (req, res) => {
  const { friendUid } = req.body;
  const userId = toObjectId(req.user.id);

  try {
    const friendId = await uidToId(friendUid);

    const deleted = await Friend.findOneAndDelete({
      user: userId,
      friend: friendId,
      status: "pending",
    });
    
    if (!deleted) {
      return res.status(404).json({ 
        message: "Không tìm thấy lời mời kết bạn",
        code: "REQUEST_NOT_FOUND"
      });
    }

    res.status(200).json({ message: "Đã hủy lời mời kết bạn" });
  } catch (err) {
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ 
        message: "Không tìm thấy người dùng này",
        code: "USER_NOT_FOUND"
      });
    }
    res.status(500).json({ message: err.message });
  }
});

/**
 * Hủy kết bạn
 * POST /api/friends/unfriend
 * body: { friendUid }
 */
router.post("/unfriend", authMiddleware, async (req, res) => {
  const { friendUid } = req.body;
  const userId = toObjectId(req.user.id);

  try {
    const friendId = await uidToId(friendUid);

    const deleted = await Friend.findOneAndDelete({
      $or: [
        { user: userId, friend: friendId, status: "accepted" },
        { user: friendId, friend: userId, status: "accepted" }
      ]
    });
    
    if (!deleted) {
      return res.status(404).json({ 
        message: "Không tìm thấy mối quan hệ bạn bè",
        code: "FRIENDSHIP_NOT_FOUND"
      });
    }

    res.status(200).json({ message: "Đã hủy kết bạn" });
  } catch (err) {
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ 
        message: "Không tìm thấy người dùng này",
        code: "USER_NOT_FOUND"
      });
    }
    res.status(500).json({ message: err.message });
  }
});

/**
 * Lấy danh sách bạn bè và lời mời
 * GET /api/friends/list
 */
router.get("/list", authMiddleware, async (req, res) => {
  const userId = toObjectId(req.user.id);

  try {
    // Lấy tất cả bạn bè đã chấp nhận
    const friendsDocs = await Friend.find({
      $or: [
        { user: userId, status: "accepted" },
        { friend: userId, status: "accepted" }
      ]
    }).populate("user friend", "uid nickname avatar");

    // Map ra thông tin bạn bè
    const friends = friendsDocs.map((doc) => {
      const friendUser = doc.user._id.equals(userId) ? doc.friend : doc.user;
      return {
        _id: doc._id,
        uid: friendUser.uid,
        nickname: friendUser.nickname,
        avatar: friendUser.avatar,
      };
    });

    // Lấy lời mời pending đến
    const requestsDocs = await Friend.find({ 
      friend: userId, 
      status: "pending" 
    }).populate("user", "uid nickname avatar");

    const requests = requestsDocs.map((doc) => ({
      _id: doc._id,
      uid: doc.user.uid,
      nickname: doc.user.nickname,
      avatar: doc.user.avatar,
    }));

    // Lấy lời mời đã gửi
    const sentRequestsDocs = await Friend.find({ 
      user: userId, 
      status: "pending" 
    }).populate("friend", "uid nickname avatar");

    const sentRequests = sentRequestsDocs.map((doc) => ({
      _id: doc._id,
      uid: doc.friend.uid,
      nickname: doc.friend.nickname,
      avatar: doc.friend.avatar,
    }));

    res.status(200).json({ friends, requests, sentRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Kiểm tra trạng thái quan hệ với một user
 * GET /api/friends/status/:friendUid
 */
router.get("/status/:friendUid", authMiddleware, async (req, res) => {
  const { friendUid } = req.params;
  const userId = toObjectId(req.user.id);

  try {
    const friendId = await uidToId(friendUid);

    if (userId.equals(friendId)) {
      return res.status(200).json({ status: "self" });
    }

    // Kiểm tra quan hệ
    const friendship = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId },
        { user: friendId, friend: userId }
      ]
    });

    if (!friendship) {
      return res.status(200).json({ status: "none" });
    }

    if (friendship.status === "accepted") {
      return res.status(200).json({ status: "friends" });
    }

    // Pending - kiểm tra ai là người gửi
    if (friendship.user.equals(userId)) {
      return res.status(200).json({ status: "request_sent" });
    } else {
      return res.status(200).json({ status: "request_received" });
    }
  } catch (err) {
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ 
        message: "Không tìm thấy người dùng này",
        code: "USER_NOT_FOUND"
      });
    }
    res.status(500).json({ message: err.message });
  }
});


export default router;
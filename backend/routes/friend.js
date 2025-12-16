// backend/routes/friends.js
import express from "express";
import Friend from "../models/Friend.js";
import User from "../models/User.js";
// import Room from "../models/Room.js"; // Nếu muốn tạo Room 1-1 khi accept

const router = express.Router();

/**
 * Gửi lời mời kết bạn
 * POST /api/friends/request
 * body: { userUid, friendUid }
 */
router.post("/request", async (req, res) => {
  const { userUid, friendUid } = req.body;

  try {
    if (userUid === friendUid)
      return res.status(400).json({ message: "Không thể tự kết bạn với chính mình" });

    // Kiểm tra xem đã là bạn bè chưa (cả 2 chiều và status = "accepted")
    const alreadyFriends = await Friend.findOne({
      $or: [
        { user: userUid, friend: friendUid, status: "accepted" },
        { user: friendUid, friend: userUid, status: "accepted" }
      ]
    });
    
    if (alreadyFriends) {
      return res.status(400).json({ 
        message: "Bạn đã là bạn bè với người này rồi",
        code: "ALREADY_FRIENDS"
      });
    }

    // Kiểm tra đã có lời mời pending chưa (cả 2 chiều)
    const existingRequest = await Friend.findOne({
      $or: [
        { user: userUid, friend: friendUid, status: "pending" },
        { user: friendUid, friend: userUid, status: "pending" }
      ]
    });
    
    if (existingRequest) {
      if (existingRequest.user === friendUid && existingRequest.friend === userUid) {
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

    // Kiểm tra user tồn tại
    const friendUser = await User.findOne({ uid: friendUid });
    if (!friendUser) {
      return res.status(404).json({ 
        message: "Không tìm thấy người dùng này",
        code: "USER_NOT_FOUND"
      });
    }

    const newFriend = new Friend({ user: userUid, friend: friendUid, status: "pending" });
    await newFriend.save();

    res.status(200).json({ 
      message: "Đã gửi lời mời kết bạn thành công", 
      friend: newFriend 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Chấp nhận lời mời kết bạn
 * POST /api/friends/accept
 * body: { userUid, friendUid }
 */
router.post("/accept", async (req, res) => {
  const { userUid, friendUid } = req.body;

  try {
    // Kiểm tra đã là bạn bè chưa
    const alreadyFriends = await Friend.findOne({
      $or: [
        { user: userUid, friend: friendUid, status: "accepted" },
        { user: friendUid, friend: userUid, status: "accepted" }
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
      user: friendUid,
      friend: userUid,
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
    res.status(500).json({ message: err.message });
  }
});

/**
 * Từ chối lời mời kết bạn
 * POST /api/friends/reject
 * body: { userUid, friendUid }
 */
router.post("/reject", async (req, res) => {
  const { userUid, friendUid } = req.body;

  try {
    const deleted = await Friend.findOneAndDelete({
      user: friendUid,
      friend: userUid,
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
    res.status(500).json({ message: err.message });
  }
});

/**
 * Hủy lời mời kết bạn đã gửi
 * POST /api/friends/cancel
 * body: { userUid, friendUid }
 */
router.post("/cancel", async (req, res) => {
  const { userUid, friendUid } = req.body;

  try {
    const deleted = await Friend.findOneAndDelete({
      user: userUid,
      friend: friendUid,
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
    res.status(500).json({ message: err.message });
  }
});

/**
 * Hủy kết bạn
 * POST /api/friends/unfriend
 * body: { userUid, friendUid }
 */
router.post("/unfriend", async (req, res) => {
  const { userUid, friendUid } = req.body;

  try {
    const deleted = await Friend.findOneAndDelete({
      $or: [
        { user: userUid, friend: friendUid, status: "accepted" },
        { user: friendUid, friend: userUid, status: "accepted" }
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
    res.status(500).json({ message: err.message });
  }
});

/**
 * Lấy danh sách bạn bè và lời mời
 * GET /api/friends/list/:userUid
 */
router.get("/list/:userUid", async (req, res) => {
  const { userUid } = req.params;

  try {
    // Lấy tất cả bạn bè đã chấp nhận, cả 2 chiều
    const friendsDocs = await Friend.find({
      $or: [
        { user: userUid, status: "accepted" },
        { friend: userUid, status: "accepted" }
      ]
    });

    // Map ra thông tin bạn bè thực sự
    const friends = await Promise.all(friendsDocs.map(async (doc) => {
      const friendUid = doc.user === userUid ? doc.friend : doc.user;
      const friendUser = await User.findOne({ uid: friendUid }).select("uid nickname avatar");
      return {
        _id: doc._id,
        uid: friendUser?.uid,
        nickname: friendUser?.nickname,
        avatar: friendUser?.avatar,
      };
    }));

    // Lấy lời mời pending đến userUid (người khác gửi cho mình)
    const requestsDocs = await Friend.find({ friend: userUid, status: "pending" });
    const requests = await Promise.all(requestsDocs.map(async (doc) => {
      const requester = await User.findOne({ uid: doc.user }).select("uid nickname avatar");
      return {
        _id: doc._id,
        uid: requester?.uid,
        nickname: requester?.nickname,
        avatar: requester?.avatar,
      };
    }));

    // Lấy lời mời pending mình đã gửi cho người khác
    const sentRequestsDocs = await Friend.find({ user: userUid, status: "pending" });
    const sentRequests = await Promise.all(sentRequestsDocs.map(async (doc) => {
      const recipient = await User.findOne({ uid: doc.friend }).select("uid nickname avatar");
      return {
        _id: doc._id,
        uid: recipient?.uid,
        nickname: recipient?.nickname,
        avatar: recipient?.avatar,
      };
    }));

    res.status(200).json({ friends, requests, sentRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Kiểm tra trạng thái quan hệ với một user
 * GET /api/friends/status/:userUid/:friendUid
 */
router.get("/status/:userUid/:friendUid", async (req, res) => {
  const { userUid, friendUid } = req.params;

  try {
    if (userUid === friendUid) {
      return res.status(200).json({ status: "self" });
    }

    // Kiểm tra đã là bạn bè chưa
    const friendship = await Friend.findOne({
      $or: [
        { user: userUid, friend: friendUid },
        { user: friendUid, friend: userUid }
      ]
    });

    if (!friendship) {
      return res.status(200).json({ status: "none" });
    }

    if (friendship.status === "accepted") {
      return res.status(200).json({ status: "friends" });
    }

    // Pending - kiểm tra ai là người gửi
    if (friendship.user === userUid) {
      return res.status(200).json({ status: "request_sent" });
    } else {
      return res.status(200).json({ status: "request_received" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router
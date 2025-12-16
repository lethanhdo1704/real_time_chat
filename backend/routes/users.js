import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

/**
 * GET /api/users/me
 * Lấy thông tin user hiện tại
 * Yêu cầu login (auth)
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      uid: user.uid,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      isOnline: user.isOnline,
    });
  } catch (err) {
    console.error("GET /users/me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/users/search?uid=...
 * Tìm user theo UID
 * Yêu cầu login (auth)
 */
router.get("/search", auth, async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ message: "UID required" });

  try {
    const user = await User.findOne({ uid }).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      uid: user.uid,
      nickname: user.nickname,
      avatar: user.avatar,
      email: user.email,
    });
  } catch (err) {
    console.error("GET /users/search error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;

import express from "express";
import auth from "../middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

// GET /api/users/me
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid })
      .select("-passwordHash");

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

export default router;

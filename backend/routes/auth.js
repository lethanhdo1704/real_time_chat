// backend/routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OTP from "../models/OTP.js";

import {
  isValidEmail,
  isValidPassword,
  isValidNickname,
} from "../utils/validate.js";

const router = express.Router();

/* =====================
   POST /api/auth/register
===================== */
router.post("/register", async (req, res) => {
  const { nickname, email, password, otp } = req.body;

  // 1️⃣ Check thiếu field
  if (!nickname || !email || !password || !otp) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // 2️⃣ Validate nickname
  if (!isValidNickname(nickname)) {
    return res.status(400).json({ error: "Nickname phải từ 2–20 ký tự" });
  }

  // 3️⃣ Validate email
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email không hợp lệ (chỉ Gmail)" });
  }

  // 4️⃣ Validate password
  if (!isValidPassword(password)) {
    return res.status(400).json({
      error: "Mật khẩu phải ≥ 6 ký tự, có chữ và số",
    });
  }

  try {
    const emailLower = email.trim().toLowerCase();

    // 5️⃣ Check email đã tồn tại
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được đăng ký" });
    }

    // 6️⃣ Lấy OTP theo email
    const otpEntry = await OTP.findOne({ email: emailLower });
    if (!otpEntry) {
      return res.status(400).json({ error: "OTP không hợp lệ hoặc chưa gửi OTP" });
    }

    // 7️⃣ Check OTP hết hạn
    if (otpEntry.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP đã hết hạn" });
    }

    // 8️⃣ So sánh OTP
    if (otpEntry.otp !== otp) {
      return res.status(400).json({ error: "OTP không hợp lệ" });
    }

    // 9️⃣ Xóa OTP sau khi dùng
    await OTP.deleteOne({ _id: otpEntry._id });

    // 🔐 Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 👤 Tạo user
    const user = await User.create({
      nickname: nickname.trim(),
      email: emailLower,
      passwordHash,
    });

    // 🔑 JWT
    const token = jwt.sign(
      { uid: user.uid, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        uid: user.uid,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* =====================
   POST /api/auth/login
===================== */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email không hợp lệ" });
  }

  try {
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    user.isOnline = true;
    await user.save();

    const token = jwt.sign(
      { uid: user.uid, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        uid: user.uid,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isOnline: user.isOnline,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

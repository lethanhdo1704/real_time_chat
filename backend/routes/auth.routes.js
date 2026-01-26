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
  normalizeNickname,
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

  // 2️⃣ Normalize nickname trước khi validate
  const normalizedNickname = normalizeNickname(nickname);

  // 3️⃣ Validate nickname
  if (!isValidNickname(normalizedNickname)) {
    return res.status(400).json({ 
      error: "Biệt danh phải từ 3-32 ký tự"
    });
  }

  // 4️⃣ Validate email
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Email không hợp lệ (chỉ Gmail)" });
  }

  // 5️⃣ Validate password
  if (!isValidPassword(password)) {
    return res.status(400).json({
      error: "Mật khẩu phải ≥ 6 ký tự, có chữ và số",
    });
  }

  try {
    const emailLower = email.trim().toLowerCase();

    // 6️⃣ Check email đã tồn tại
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được đăng ký" });
    }

    // 7️⃣ Lấy OTP theo email
    const otpEntry = await OTP.findOne({ email: emailLower });
    if (!otpEntry) {
      return res
        .status(400)
        .json({ error: "OTP không hợp lệ hoặc chưa gửi OTP" });
    }

    // 8️⃣ Check OTP hết hạn
    if (otpEntry.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP đã hết hạn" });
    }

    // 9️⃣ So sánh OTP
    if (otpEntry.otp !== otp) {
      return res.status(400).json({ error: "OTP không hợp lệ" });
    }

    // 🔟 Xóa OTP sau khi dùng
    await OTP.deleteOne({ _id: otpEntry._id });

    // 🔐 Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 👤 Tạo user với normalized nickname
    const user = await User.create({
      nickname: normalizedNickname,
      email: emailLower,
      passwordHash,
    });

    // 🔑 JWT
    const token = jwt.sign(
      {
        id: user._id,
        uid: user.uid,
        role: user.role,
      },
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

    // 🔥 THÊM KIỂM TRA BAN NGAY TẠI ĐÂY
    const now = new Date();
    if (user.status === 'banned') {
      // Auto-unban nếu ban tạm hết hạn
      if (user.banEndAt && user.banEndAt < now) {
        await User.findByIdAndUpdate(user._id, {
          status: 'active',
          banStartAt: null,
          banEndAt: null,
          bannedBy: null,
          banReason: null
        });
      } else {
        // Vẫn bị ban → từ chối login với thông báo phù hợp
        let message = "Tài khoản của bạn đã bị cấm";
        if (user.banEndAt) {
          message += ". Vui lòng thử lại sau.";
        } else {
          message += " vĩnh viễn";
        }

        return res.status(403).json({ 
          error: message,
          code: "ACCOUNT_BANNED",
          banEndAt: user.banEndAt, // Gửi nguyên timestamp ISO
          isPermanent: !user.banEndAt
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    user.isOnline = true;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        uid: user.uid,
        role: user.role,
      },
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
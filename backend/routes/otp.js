// backend/routes/otp.js
import express from "express";
import OTP from "../models/OTP.js";
import User from "../models/User.js";
import { sendOTPEmail } from "../utils/email.js";

const router = express.Router();

// Hàm tạo OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post("/send", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    // 1️⃣ Kiểm tra email đã tồn tại trong User chưa
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được đăng ký" });
    }

    // 2️⃣ Tạo OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // 3️⃣ Lưu vào OTP collection (cập nhật nếu đã tồn tại OTP cho email này)
    await OTP.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // 4️⃣ Gửi OTP email
    await sendOTPEmail(email, otp);

    res.json({ message: "OTP đã gửi thành công" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

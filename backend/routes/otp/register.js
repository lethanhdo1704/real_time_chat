// backend/routes/otp/register.js
import express from "express";
import OTP from "../../models/OTP.js";
import User from "../../models/User.js";
import { sendRegisterOTP } from "../../utils/email/emailRegister.js";

const router = express.Router();

// Hàm tạo OTP 6 chữ số
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/otp/register → gửi OTP đăng ký
router.post("/", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được đăng ký" });
    }

    // Tạo OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

    // Lưu vào collection OTP
    await OTP.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Gửi OTP email - SỬA TÊN HÀM
    await sendRegisterOTP(email, otp);

    res.json({ message: "OTP đã gửi thành công" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/otp/register/verify → xác thực OTP + tạo user mới
router.post("/verify", async (req, res) => {
  const { email, otp, nickname, password } = req.body;
  if (!email || !otp || !nickname || !password) return res.status(400).json({ error: "Thiếu thông tin" });

  try {
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    // Hash mật khẩu
    const bcrypt = await import("bcrypt");
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email: email.trim().toLowerCase(),
      nickname,
      passwordHash: hashedPassword,
    });

    // Xóa OTP sau khi dùng
    await OTP.deleteMany({ email });

    res.json({ message: "Đăng ký thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server lỗi" });
  }
});

export default router;
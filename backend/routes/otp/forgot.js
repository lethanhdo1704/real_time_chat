// backend/routes/otp/forgot.js
import express from "express";
import OTP from "../../models/OTP.js";
import User from "../../models/User.js";
import { sendForgotPasswordOTP } from "../../utils/email/emailForgotPassword.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Hàm tạo OTP 6 chữ số
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/otp/forgot → gửi OTP quên mật khẩu
router.post("/", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    // Kiểm tra email có tồn tại không
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (!existingUser) {
      return res.status(400).json({ error: "Email chưa được đăng ký" });
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
    await sendForgotPasswordOTP(email, otp);

    res.json({ message: "OTP đã gửi thành công" });
  } catch (err) {
    console.error("Send forgot OTP error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/otp/forgot/verify → xác thực OTP + đổi mật khẩu
router.post("/verify", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "Thiếu thông tin" });
  }

  try {
    // Kiểm tra OTP
    const otpRecord = await OTP.findOne({ email: email.trim().toLowerCase(), otp });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    // Tìm user
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "Email không tồn tại" });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    user.passwordHash = hashedPassword;
    await user.save();

    // Xóa OTP sau khi dùng
    await OTP.deleteMany({ email: email.trim().toLowerCase() });

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server lỗi" });
  }
});

export default router;
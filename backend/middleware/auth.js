// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function auth(req, res, next) {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header" });
    }
    
    // Authorization: Bearer <token>
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ error: "Token not provided" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "JWT_SECRET not configured",
      });
    }

    // 🔐 Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 THÊM KIỂM TRA BAN TRONG DB
    const user = await User.findById(decoded.id).select('status banEndAt');
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

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
        // Vẫn bị ban → từ chối truy cập với thông báo phù hợp
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

    // ✅ CHUẨN HOÁ USER CONTEXT
    req.user = {
      id: decoded.id,     // Mongo _id (DB, chat, socket)
      uid: decoded.uid,   // Public uid (friend, invite)
      role: decoded.role,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
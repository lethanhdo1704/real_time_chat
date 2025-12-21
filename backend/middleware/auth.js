// backend/middleware/auth.js
import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
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

    // ✅ CHUẨN HOÁ USER CONTEXT
    req.user = {
      id: decoded.id,     // Mongo _id (DB, chat, socket)
      uid: decoded.uid,   // Public uid (friend, invite)
      role: decoded.role,
    };
    console.log("AUTH HIT:", req.method, req.originalUrl);
    console.log("HEADERS:", req.headers);

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}


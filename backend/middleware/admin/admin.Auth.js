// backend/middleware/admin/admin.Auth.js
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';

/**
 * Middleware xác thực JWT admin
 * Dùng cho tất cả route /api/admin/* (trừ login)
 */
const adminAuth = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token not found'
      });
    }

    const token = authHeader.substring(7); // Bỏ "Bearer "

    // Verify token với secret riêng của admin
    const adminSecret = process.env.ADMIN_JWT_SECRET;
    
    if (!adminSecret) {
      console.error('⚠️ ADMIN_JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Admin configuration not ready'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, adminSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Kiểm tra scope phải là admin
    if (decoded.scope !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Token does not have admin privileges'
      });
    }

    // Tìm user trong DB
    const user = await User.findById(decoded.userId).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Kiểm tra role (phải là admin hoặc super_admin)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Account does not have admin privileges'
      });
    }

    // Kiểm tra status phải active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}`
      });
    }

    // Gắn user vào request
    req.user = user;
    req.adminRole = user.role; // Tiện cho check quyền super_admin sau này

    next();

  } catch (error) {
    console.error('❌ Admin auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Admin authentication error'
    });
  }
};

export default adminAuth;
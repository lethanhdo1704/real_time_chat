// backend/controllers/admin/admin.auth.controller.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import { getRealIP } from '../../utils/ip.js';
import { checkAndUnbanUser } from '../../services/admin/userAdmin.service.js';

/**
 * Admin login
 * POST /api/admin/auth/login
 * Body: { email, password }
 * 
 * ✅ Response: { token, admin } - Direct format (chuẩn JWT)
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    // Tìm user theo email
    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // ✅ AUTO UNBAN NẾU HẾT HẠN
    await checkAndUnbanUser(user);

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Kiểm tra role (phải là admin hoặc super_admin)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({
        message: 'Account does not have admin privileges'
      });
    }

    // Kiểm tra status
    if (user.status === 'banned') {
      const banMessage = user.banEndAt 
        ? `Account is banned until ${new Date(user.banEndAt).toLocaleString('en-US')}`
        : 'Account is permanently banned';
      
      return res.status(403).json({
        message: banMessage
      });
    }

    if (user.status === 'deleted') {
      return res.status(403).json({
        message: 'Account has been deleted'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        message: 'Account is not active'
      });
    }

    // Sinh JWT admin (dùng secret riêng)
    const adminSecret = process.env.ADMIN_JWT_SECRET;
    const adminExpires = process.env.ADMIN_JWT_EXPIRES || '8h';

    if (!adminSecret) {
      console.error('⚠️ ADMIN_JWT_SECRET not configured');
      return res.status(500).json({
        message: 'Admin configuration not ready'
      });
    }

    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      scope: 'admin' // Đánh dấu đây là token admin
    };

    const token = jwt.sign(payload, adminSecret, {
      expiresIn: adminExpires
    });

    // Log IP login
    const clientIP = getRealIP(req);
    console.log(`✅ Admin login success: ${user.email} (${user.role}) from IP: ${clientIP}`);

    // ✅ TRẢ DIRECT FORMAT - Chuẩn JWT auth
    return res.status(200).json({
      token,
      admin: {
        id: user._id,
        uid: user.uid,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('❌ Admin login error:', error);
    return res.status(500).json({
      message: 'Admin login error'
    });
  }
};

/**
 * Verify admin token
 * GET /api/admin/auth/verify
 * Header: Authorization: Bearer <token>
 * 
 * ✅ Response: { admin } - Direct format
 */
export const verifyAdminToken = async (req, res) => {
  try {
    // req.user đã được gắn bởi adminAuth middleware
    
    // ✅ AUTO UNBAN NẾU HẾT HẠN
    await checkAndUnbanUser(req.user);

    // ✅ TRẢ DIRECT FORMAT
    return res.status(200).json({
      admin: {
        id: req.user._id,
        uid: req.user.uid,
        email: req.user.email,
        nickname: req.user.nickname,
        avatar: req.user.avatar,
        role: req.user.role,
        status: req.user.status
      }
    });
  } catch (error) {
    console.error('❌ Verify admin token error:', error);
    return res.status(500).json({
      message: 'Token verification error'
    });
  }
};
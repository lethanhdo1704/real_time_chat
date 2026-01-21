// backend/middleware/admin/admin.Ip.Whitelist.js
import { isIPInWhitelist } from '../../utils/ip.js';

/**
 * Middleware kiểm tra IP có trong whitelist không
 * Chỉ dùng cho admin login và admin refresh token
 */
const adminIpWhitelist = (req, res, next) => {
  try {
    // Lấy IP thật từ request
    const clientIP = 
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.headers['x-real-ip'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;

    if (!clientIP) {
      return res.status(403).json({
        success: false,
        message: 'Unable to determine IP address'
      });
    }

    // Lấy whitelist từ env
    const whitelist = process.env.ADMIN_IP_WHITELIST || '';
    
    if (!whitelist) {
      console.error('⚠️ ADMIN_IP_WHITELIST not configured');
      return res.status(403).json({
        success: false,
        message: 'Admin access not configured'
      });
    }

    // Parse whitelist thành mảng
    const allowedIPs = whitelist.split(',').map(ip => ip.trim()).filter(Boolean);

    // Kiểm tra IP
    const isAllowed = isIPInWhitelist(clientIP, allowedIPs);

    if (!isAllowed) {
      console.warn(`🚫 Admin access denied from IP: ${clientIP}`);
      return res.status(403).json({
        success: false,
        message: 'IP address not authorized for admin access'
      });
    }

    // IP hợp lệ, tiếp tục
    next();

  } catch (error) {
    console.error('❌ Admin IP whitelist error:', error);
    return res.status(500).json({
      success: false,
      message: 'IP whitelist verification error'
    });
  }
};

export default adminIpWhitelist;
// backend/middleware/rateLimit.js
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

/**
 * Rate Limiting Middleware (IPv6-safe)
 * Protects against abuse and DoS attacks
 */

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false
};

const userOrIpKey = (req) => {
  if (req.user?.id) return `user:${req.user.id}`;
  return ipKeyGenerator(req);
};

const isDev = process.env.NODE_ENV === 'development';

// =========================
// GLOBAL LIMITER
// =========================
export const globalLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000, // 15 phút
  max: isDev ? 1000 : 300, // Dev: 1000, Prod: 300 requests
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests, please try again later'
    }
  },
  keyGenerator: (req) => ipKeyGenerator(req),
  skip: () => isDev // Skip hoàn toàn trong dev
});

// =========================
// AUTH LIMITER (USER)
// =========================
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000, // 15 phút
  max: isDev ? 100 : 10, // Dev: 100, Prod: 10 attempts
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many login attempts, please try again later'
    }
  },
  keyGenerator: (req) => ipKeyGenerator(req)
});

// =========================
// OTP LIMITER
// =========================
export const otpLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000, // 15 phút
  max: isDev ? 50 : 5, // Dev: 50, Prod: 5 OTP requests
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many OTP requests, please try again later'
    }
  },
  keyGenerator: (req) => ipKeyGenerator(req)
});

// =========================
// MESSAGE LIMITER
// =========================
export const messageLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 phút
  max: isDev ? 200 : 60, // Dev: 200, Prod: 60 messages/minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many messages sent, please slow down'
    }
  },
  keyGenerator: userOrIpKey,
  skip: () => isDev
});

export const messageActionLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 phút
  max: isDev ? 100 : 30, // Dev: 100, Prod: 30 actions/minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many message actions, please slow down'
    }
  },
  keyGenerator: userOrIpKey,
  skip: () => isDev
});

// =========================
// FRIEND REQUEST LIMITER
// =========================
export const friendRequestLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: isDev ? 200 : 20, // Dev: 200, Prod: 20 friend requests/hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many friend requests, please try again later'
    }
  },
  keyGenerator: userOrIpKey,
  skip: () => isDev
});

// =========================
// FRIEND API LIMITER
// =========================
export const friendApiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 phút
  max: isDev ? 500 : 100, // Dev: 500, Prod: 100 requests/minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests, please slow down'
    }
  },
  keyGenerator: userOrIpKey,
  skip: () => isDev
});

// =========================
// SEARCH LIMITER
// =========================
export const searchLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 phút
  max: isDev ? 200 : 60, // Dev: 200, Prod: 60 searches/minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many search requests, please slow down'
    }
  },
  keyGenerator: userOrIpKey,
  skip: () => isDev
});

// =========================
// UPLOAD LIMITER
// =========================
export const uploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000, // 10 phút
  max: isDev ? 100 : 20, // Dev: 100, Prod: 20 uploads/10min
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many file uploads, please try again later'
    }
  },
  keyGenerator: userOrIpKey
});

export const avatarUploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isDev ? 50 : 5, // 5 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many avatar uploads. Please try again later.'
    }
  },
  keyGenerator: userOrIpKey
});

// =========================
// API LIMITER
// =========================
export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000, // 1 phút
  max: isDev ? 500 : 150, // Dev: 500, Prod: 150 requests/minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests, please try again later'
    }
  },
  keyGenerator: userOrIpKey,
  skip: () => isDev
});

// =========================
// ✅ ADMIN RATE LIMITERS (NEW)
// =========================

/**
 * Admin login rate limiter - NGHIÊM NGẶT HƠN USER
 * - Production: 3 attempts/15min (vs user: 10 attempts)
 * - Development: 50 attempts/15min
 */
export const adminLoginLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000, // 15 phút
  max: isDev ? 50 : 3, // Dev: 50, Prod: CHỈ 3 LẦN
  skipSuccessfulRequests: true, // Chỉ đếm failed attempts
  message: {
    success: false,
    error: {
      code: 'ADMIN_RATE_LIMIT_ERROR',
      message: 'Too many admin login attempts, please try again later'
    }
  },
  keyGenerator: (req) => {
    // Track theo IP để bảo mật cao hơn
    const ip = ipKeyGenerator(req);
    return `admin-login:${ip}`;
  }
});

/**
 * Admin API rate limiter - Cho protected admin routes
 * - Production: 200 requests/15min (cao hơn user vì admin cần query nhiều)
 * - Development: unlimited (skip)
 */
export const adminApiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000, // 15 phút
  max: isDev ? 1000 : 200, // Dev: 1000, Prod: 200 requests
  message: {
    success: false,
    error: {
      code: 'ADMIN_RATE_LIMIT_ERROR',
      message: 'Too many admin API requests, please slow down'
    }
  },
  keyGenerator: (req) => {
    // Track theo user ID nếu đã login, fallback sang IP
    if (req.user?._id) return `admin-api:user:${req.user._id}`;
    return `admin-api:ip:${ipKeyGenerator(req)}`;
  },
  skip: () => isDev // Skip trong dev để test dễ hơn
});

// =========================
// FACTORY FUNCTION
// =========================
export const createRateLimiter = ({ 
  windowMs = 60000, 
  max = 60, 
  maxDev = null,
  message, 
  useUserId = false, 
  skipDev = true 
}) =>
  rateLimit({
    ...baseOptions,
    windowMs,
    max: isDev && maxDev ? maxDev : max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: message || 'Too many requests, please try again later'
      }
    },
    keyGenerator: useUserId ? userOrIpKey : (req) => ipKeyGenerator(req),
    skip: () => isDev && skipDev
  });

// =========================
// DEFAULT EXPORT
// =========================
export default {
  // User limiters
  globalLimiter,
  authLimiter,
  otpLimiter,
  messageLimiter,
  messageActionLimiter,
  friendRequestLimiter,
  friendApiLimiter,
  searchLimiter,
  uploadLimiter,
  avatarUploadLimiter,
  apiLimiter,
  
  // ✅ Admin limiters (NEW)
  adminLoginLimiter,
  adminApiLimiter,
  
  // Factory
  createRateLimiter
};
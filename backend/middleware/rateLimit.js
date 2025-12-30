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
// GLOBAL LIMITER - ✅ TĂNG LÊN
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
// AUTH LIMITER - ✅ HỢP LÝ HƠN
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
// OTP LIMITER - ✅ TĂNG NHẸ
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
// MESSAGE LIMITER - ✅ TĂNG ĐÁNG KỂ
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
// FRIEND REQUEST LIMITER - ✅ HỢP LÝ HƠN
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
// FRIEND API LIMITER - ✅ TĂNG MẠNH (cho /list, /search endpoints)
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
// SEARCH LIMITER - ✅ TĂNG LÊN
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
// UPLOAD LIMITER - ✅ TĂNG NHẸ
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

// =========================
// API LIMITER - ✅ TĂNG MẠNH
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
// FACTORY - ✅ CẢI THIỆN
// =========================
export const createRateLimiter = ({ 
  windowMs = 60000, 
  max = 60, 
  maxDev = null, // Cho phép set riêng cho dev
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

export const avatarUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per window
  message: 'Too many avatar uploads. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  globalLimiter,
  authLimiter,
  otpLimiter,
  messageLimiter,
  messageActionLimiter,
  friendRequestLimiter,
  friendApiLimiter,
  searchLimiter,
  uploadLimiter,
  apiLimiter,
  avatarUploadLimiter,
  createRateLimiter
};
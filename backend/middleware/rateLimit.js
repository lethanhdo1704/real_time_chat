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

// =========================
// GLOBAL LIMITER
// =========================
export const globalLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests, please try again later'
    }
  },
  keyGenerator: (req) => ipKeyGenerator(req),
  skip: (req) => process.env.NODE_ENV === 'development'
});

// =========================
// AUTH LIMITER
// =========================
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  max: 5,
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
  windowMs: 15 * 60 * 1000,
  max: 3,
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
// MESSAGE LIMITER (PER USER)
// =========================
export const messageLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many messages sent, please slow down'
    }
  },
  keyGenerator: userOrIpKey,
  skip: () => process.env.NODE_ENV === 'development'
});

export const messageActionLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 10, // 10 edits/deletes per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many message actions, please slow down'
    }
  },
  keyGenerator: userOrIpKey,
  skip: () => process.env.NODE_ENV === 'development'
});
// =========================
// FRIEND REQUEST LIMITER
// =========================
export const friendRequestLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many friend requests, please try again later'
    }
  },
  keyGenerator: userOrIpKey
});

// =========================
// SEARCH LIMITER
// =========================
export const searchLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many search requests, please slow down'
    }
  },
  keyGenerator: userOrIpKey
});

// =========================
// UPLOAD LIMITER
// =========================
export const uploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: 10 * 60 * 1000,
  max: 10,
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
// API LIMITER
// =========================
export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests, please try again later'
    }
  },
  keyGenerator: userOrIpKey,
  skip: () => process.env.NODE_ENV === 'development'
});

// =========================
// FACTORY
// =========================
export const createRateLimiter = ({ windowMs = 60000, max = 60, message, useUserId = false, skipDev = true }) =>
  rateLimit({
    ...baseOptions,
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: message || 'Too many requests, please try again later'
      }
    },
    keyGenerator: useUserId ? userOrIpKey : (req) => ipKeyGenerator(req),
    skip: () => process.env.NODE_ENV === 'development' && skipDev
  });

export default {
  globalLimiter,
  authLimiter,
  otpLimiter,
  messageLimiter,
  friendRequestLimiter,
  searchLimiter,
  uploadLimiter,
  apiLimiter,
  createRateLimiter
};
// backend/middleware/sanitize.js
import sanitizeHtml from 'sanitize-html';

/**
 * Input Sanitization Middleware
 * - Prevents XSS attacks
 * - Safe with Express >= 4.18 (does NOT reassign req.query)
 */

// =========================
// CORE SANITIZE HELPERS
// =========================

const sanitizeValue = (value, options) => {
  if (typeof value === 'string') {
    return sanitizeHtml(value, options);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, options));
  }

  if (typeof value === 'object' && value !== null) {
    Object.keys(value).forEach((key) => {
      value[key] = sanitizeValue(value[key], options);
    });
    return value;
  }

  return value;
};

// =========================
// GENERIC INPUT SANITIZER
// =========================
export const sanitizeInput = (req, res, next) => {
  try {
    const plainTextOptions = {
      allowedTags: [],
      allowedAttributes: {},
      textFilter: (text) =>
        text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
    };

    // body & params are mutable
    if (req.body) sanitizeValue(req.body, plainTextOptions);
    if (req.params) sanitizeValue(req.params, plainTextOptions);

    // req.query is getter-only → mutate fields ONLY
    if (req.query) {
      Object.keys(req.query).forEach((key) => {
        req.query[key] = sanitizeValue(req.query[key], plainTextOptions);
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

// =========================
// MESSAGE SANITIZER (TEXT ONLY)
// =========================
export const sanitizeMessage = (req, res, next) => {
  if (!req.body?.content) return next();

  const clean = sanitizeHtml(req.body.content, {
    allowedTags: [],
    allowedAttributes: {},
    parser: {
      lowerCaseTags: true,
      decodeEntities: true
    }
  }).trim();

  if (!clean.length) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Message content cannot be empty'
      }
    });
  }

  if (clean.length > 5000) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Message content exceeds maximum length of 5000 characters'
      }
    });
  }

  req.body.content = clean;
  next();
};

// =========================
// RICH TEXT SANITIZER
// =========================
export const sanitizeRichText = (req, res, next) => {
  if (!req.body?.content) return next();

  req.body.content = sanitizeHtml(req.body.content, {
    allowedTags: [
      'b', 'i', 'em', 'strong', 'u', 'strike',
      'p', 'br',
      'ul', 'ol', 'li',
      'a',
      'code', 'pre'
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          href: attribs.href || '#',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      })
    }
  });

  next();
};

// =========================
// FILE METADATA SANITIZER
// =========================
export const sanitizeFileMetadata = (req, res, next) => {
  if (!Array.isArray(req.body?.attachments)) return next();

  req.body.attachments = req.body.attachments.map((att) => ({
    url: sanitizeHtml(att.url || '', { allowedTags: [] }),
    name: sanitizeHtml(att.name || '', { allowedTags: [] }),
    size: Number(att.size) || 0,
    type: sanitizeHtml(att.type || '', { allowedTags: [] })
  }));

  next();
};

// =========================
// NOSQL / SQL INJECTION GUARD (LIGHTWEIGHT)
// =========================
export const preventSQLInjection = (req, res, next) => {
  const patterns = [
    /(\$ne|\$gt|\$lt|\$or|\$and|\$where)/i,
    /(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)/i
  ];

  const scan = (obj) => {
    if (!obj || typeof obj !== 'object') return false;

    return Object.values(obj).some((value) => {
      if (typeof value === 'string') {
        return patterns.some((p) => p.test(value));
      }
      if (typeof value === 'object') return scan(value);
      return false;
    });
  };

  if (scan(req.body) || scan(req.query) || scan(req.params)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Potentially dangerous input detected'
      }
    });
  }

  next();
};

export default {
  sanitizeInput,
  sanitizeMessage,
  sanitizeRichText,
  sanitizeFileMetadata,
  preventSQLInjection
};
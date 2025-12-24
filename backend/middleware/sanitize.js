// backend/middleware/sanitize.js
import sanitizeHtml from 'sanitize-html';

/**
 * Input Sanitization Middleware
 * Protects against XSS attacks by sanitizing user input
 */

/**
 * Sanitize HTML content - removes all HTML tags
 * Use for text inputs that should be plain text only
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    // Sanitize all string fields recursively
    req.body = sanitizeObject(req.body, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {},
      textFilter: (text) => {
        // Remove any remaining dangerous patterns
        return text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    });
  }

  if (req.query) {
    // Sanitize query parameters
    req.query = sanitizeObject(req.query, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }

  next();
};

/**
 * Sanitize message content
 * Allows basic formatting but removes dangerous tags
 */
export const sanitizeMessage = (req, res, next) => {
  if (req.body.content) {
    req.body.content = sanitizeHtml(req.body.content, {
      allowedTags: [], // Pure text only for messages
      allowedAttributes: {},
      // Preserve newlines
      parser: {
        lowerCaseTags: true,
        decodeEntities: true
      }
    });

    // Trim whitespace
    req.body.content = req.body.content.trim();

    // Validate length
    if (req.body.content.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message content cannot be empty'
        }
      });
    }

    if (req.body.content.length > 5000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Message content exceeds maximum length of 5000 characters'
        }
      });
    }
  }

  next();
};

/**
 * Sanitize rich text content
 * Allows safe HTML tags for rich text editors
 */
export const sanitizeRichText = (req, res, next) => {
  if (req.body.content) {
    req.body.content = sanitizeHtml(req.body.content, {
      allowedTags: [
        'b', 'i', 'em', 'strong', 'u', 'strike',
        'p', 'br',
        'ul', 'ol', 'li',
        'a',
        'code', 'pre'
      ],
      allowedAttributes: {
        'a': ['href', 'target', 'rel']
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      // Force safe attributes on links
      transformTags: {
        'a': (tagName, attribs) => {
          return {
            tagName: 'a',
            attribs: {
              href: attribs.href || '#',
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          };
        }
      }
    });
  }

  next();
};

/**
 * Recursively sanitize an object
 */
function sanitizeObject(obj, options) {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj, options);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key], options);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Validate and sanitize file upload metadata
 */
export const sanitizeFileMetadata = (req, res, next) => {
  if (req.body.attachments && Array.isArray(req.body.attachments)) {
    req.body.attachments = req.body.attachments.map(attachment => {
      return {
        url: sanitizeHtml(attachment.url || '', { allowedTags: [] }),
        name: sanitizeHtml(attachment.name || '', { allowedTags: [] }),
        size: parseInt(attachment.size) || 0,
        type: sanitizeHtml(attachment.type || '', { allowedTags: [] })
      };
    });
  }

  next();
};

/**
 * SQL Injection Protection (for raw queries if any)
 * MongoDB is generally safe from SQL injection, but this is for extra safety
 */
export const preventSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(;|\-\-|\/\*|\*\/)/g,
    /(\bOR\b|\bAND\b).*?=/gi
  ];

  const checkForSQLInjection = (value) => {
    if (typeof value === 'string') {
      return sqlPatterns.some(pattern => pattern.test(value));
    }
    return false;
  };

  const scanObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (checkForSQLInjection(value)) {
          return true;
        }

        if (typeof value === 'object' && value !== null) {
          if (scanObject(value)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  if (scanObject(req.body) || scanObject(req.query) || scanObject(req.params)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid characters detected in input'
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
// backend/middleware/uploadAvatar.js
import multer from "multer";

// Memory storage for Sharp processing
const storage = multer.memoryStorage();

// Multer configuration for avatar uploads
const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // ⚠️ Only trust mimetype, NOT extension
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
      // ❌ Removed 'image/jpg' - not a standard MIME type
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, WEBP images are allowed'));
    }
  }
});

/**
 * Multer error handler middleware
 * Catches multer errors and returns proper JSON response
 */
export const handleAvatarUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    // Other errors (e.g., fileFilter rejection)
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

export default uploadAvatar;    
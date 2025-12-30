// backend/routes/upload.js
import express from 'express';
import multer from 'multer';
import auth from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import uploadController from '../controllers/upload.controller.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedMimeTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Videos
      'video/mp4',
      'video/quicktime',
      'video/webm',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// All routes require authentication
router.use(auth);

// Upload single file
router.post(
  '/',
  uploadLimiter,
  upload.single('file'),
  uploadController.uploadFile
);

// Upload multiple files
router.post(
  '/multiple',
  uploadLimiter,
  upload.array('files', 5), // Max 5 files
  uploadController.uploadMultipleFiles
);

// Delete file
router.delete('/:publicId', uploadController.deleteFile);

export default router;
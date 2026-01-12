// backend/routes/upload.routes.js
import express from 'express';
import auth from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimit.js';
import uploadController from '../controllers/upload.controller.js';

const router = express.Router();
console.log('🔥 [Upload Routes] Loading upload routes...');

// All routes require authentication
router.use(auth);

/**
 * 🔥 NEW ENDPOINTS - PRESIGNED URL FLOW
 * 
 * IMPORTANT: Specific routes MUST come BEFORE dynamic routes (/:key)
 */

// Get upload limits (for FE validation)
router.get('/limits', uploadController.getUploadLimits);

// Generate presigned URL for single file
router.post(
  '/generate-url',
  uploadLimiter,
  uploadController.generateUploadUrl
);

// Generate presigned URLs for multiple files (batch)
router.post(
  '/generate-urls',
  uploadLimiter,
  uploadController.generateUploadUrls
);

// Cancel upload (delete partially uploaded file)
router.delete(
  '/cancel',
  uploadController.cancelUpload
);

// Delete multiple files (batch)
// MUST come BEFORE /:key to avoid conflict
router.delete(
  '/batch',
  uploadController.deleteFiles
);


router.post(
  '/',
  uploadController.uploadFile
);

// Old multiple files upload (deprecated)
router.post(
  '/multiple',
  uploadController.uploadMultipleFiles
);


router.delete(
  '/:key',
  uploadController.deleteFile
);
export default router;
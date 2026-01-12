// backend/controllers/upload.controller.js
import fileUploadService from '../services/fileUpload.service.js';
import { ValidationError } from '../middleware/errorHandler.js';

/**
 * 🔥 UPLOAD CONTROLLER - PRESIGNED URL VERSION
 * 
 * NEW FLOW:
 * 1. FE → BE: Send file metadata (name, size, mime)
 * 2. BE → FE: Return presigned URLs
 * 3. FE → R2: Upload directly to presigned URLs
 * 4. FE → BE: Call sendMessage with file URLs
 * 
 * ❌ Backend NEVER receives file buffers/streams
 * ✅ Backend only validates metadata + generates URLs
 * 
 * @production
 */

class UploadController {
  /**
   * 🔥 GENERATE PRESIGNED UPLOAD URL (SINGLE FILE)
   * 
   * POST /api/upload/generate-url
   * Body: { name, size, mime }
   */
  async generateUploadUrl(req, res, next) {
    try {
      if (!fileUploadService.isEnabled()) {
        throw new ValidationError(
          'File upload is not configured. Please contact administrator.'
        );
      }

      const { name, size, mime } = req.body;

      if (!name || !size || !mime) {
        throw new ValidationError('name, size, and mime are required');
      }

      console.log('📤 [UploadController] Generating upload URL:', {
        user: req.user.uid,
        name,
        size: `${(size / 1024 / 1024).toFixed(2)}MB`,
        mime,
      });

      // Generate presigned URL
      const [result] = await fileUploadService.generateUploadUrls({
        userId: req.user.uid,
        files: [{ name, size, mime }],
      });

      console.log('✅ [UploadController] Upload URL generated');

      res.status(200).json({
        success: true,
        data: {
          uploadUrl: result.uploadUrl,
          metadata: result.metadata,
        },
      });
    } catch (error) {
      console.error('❌ [UploadController] Generate URL error:', error);
      next(error);
    }
  }

  /**
   * 🔥 GENERATE PRESIGNED UPLOAD URLS (BATCH)
   * 
   * POST /api/upload/generate-urls
   * Body: { files: [{ name, size, mime }, ...] }
   */
  async generateUploadUrls(req, res, next) {
    try {
      if (!fileUploadService.isEnabled()) {
        throw new ValidationError(
          'File upload is not configured. Please contact administrator.'
        );
      }

      const { files } = req.body;

      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new ValidationError('files array is required and must not be empty');
      }

      console.log(`📤 [UploadController] Generating ${files.length} upload URLs:`, {
        user: req.user.uid,
        files: files.length,
        totalSize: `${(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB`,
      });

      // Generate presigned URLs (validates batch size ≤ 1GB)
      const results = await fileUploadService.generateUploadUrls({
        userId: req.user.uid,
        files,
      });

      console.log(`✅ [UploadController] ${results.length} upload URLs generated`);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('❌ [UploadController] Generate URLs error:', error);
      next(error);
    }
  }

  /**
   * 🔥 CANCEL UPLOAD - IMPROVED VALIDATION
   * 
   * DELETE /api/upload/cancel
   * Body: { key }
   * 
   * Called when user cancels upload after getting presigned URL
   */
  async cancelUpload(req, res, next) {
    try {
      if (!fileUploadService.isEnabled()) {
        throw new ValidationError(
          'File upload is not configured. Please contact administrator.'
        );
      }

      const { key } = req.body;

      if (!key) {
        throw new ValidationError('key is required');
      }

      // ✅ IMPROVED: Validate key structure and ownership
      if (!this._validateKeyOwnership(key, req.user.uid)) {
        throw new ValidationError('Unauthorized to cancel this upload');
      }

      console.log('🚫 [UploadController] Cancelling upload:', {
        user: req.user.uid,
        key,
      });

      await fileUploadService.cancelUpload(key);

      console.log('✅ [UploadController] Upload cancelled');

      res.status(200).json({
        success: true,
        message: 'Upload cancelled successfully',
      });
    } catch (error) {
      console.error('❌ [UploadController] Cancel upload error:', error);
      next(error);
    }
  }

  /**
   * 🔥 DELETE FILE - IMPROVED VALIDATION
   * 
   * DELETE /api/upload/:key
   * 
   * Called when user wants to delete uploaded file
   */
  async deleteFile(req, res, next) {
    try {
      if (!fileUploadService.isEnabled()) {
        throw new ValidationError(
          'File upload is not configured. Please contact administrator.'
        );
      }

      // Handle both URL-encoded and path params
      let key = req.params.key;
      
      // If key contains additional path segments, join them
      if (req.params[0]) {
        key = req.params[0];
      }

      if (!key) {
        throw new ValidationError('key is required');
      }

      // Decode URL-encoded key
      key = decodeURIComponent(key);

      // ✅ IMPROVED: Validate key structure and ownership
      if (!this._validateKeyOwnership(key, req.user.uid)) {
        throw new ValidationError('Unauthorized to delete this file');
      }

      console.log('🗑️  [UploadController] Deleting file:', {
        user: req.user.uid,
        key,
      });

      await fileUploadService.deleteFile(key);

      console.log('✅ [UploadController] File deleted');

      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      console.error('❌ [UploadController] Delete error:', error);
      next(error);
    }
  }

  /**
   * 🔥 DELETE MULTIPLE FILES (BATCH) - IMPROVED VALIDATION
   * 
   * DELETE /api/upload/batch
   * Body: { keys: [...] }
   */
  async deleteFiles(req, res, next) {
    try {
      if (!fileUploadService.isEnabled()) {
        throw new ValidationError(
          'File upload is not configured. Please contact administrator.'
        );
      }

      const { keys } = req.body;

      if (!keys || !Array.isArray(keys) || keys.length === 0) {
        throw new ValidationError('keys array is required and must not be empty');
      }

      // ✅ IMPROVED: Validate all keys belong to user
      const unauthorized = keys.some(key => !this._validateKeyOwnership(key, req.user.uid));
      if (unauthorized) {
        throw new ValidationError('Unauthorized to delete some files');
      }

      console.log(`🗑️  [UploadController] Batch deleting ${keys.length} files:`, {
        user: req.user.uid,
      });

      const result = await fileUploadService.deleteFiles(keys);

      console.log('✅ [UploadController] Batch delete completed:', {
        deleted: result.deleted.length,
        failed: result.failed.length,
      });

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error) {
      console.error('❌ [UploadController] Batch delete error:', error);
      next(error);
    }
  }

  /**
   * 🔥 GET UPLOAD LIMITS
   * 
   * GET /api/upload/limits
   * 
   * Returns upload constraints for FE validation
   */
  async getUploadLimits(req, res, next) {
    try {
      if (!fileUploadService.isEnabled()) {
        throw new ValidationError(
          'File upload is not configured. Please contact administrator.'
        );
      }

      const limits = fileUploadService.getLimits();

      res.status(200).json({
        success: true,
        data: limits,
      });
    } catch (error) {
      console.error('❌ [UploadController] Get limits error:', error);
      next(error);
    }
  }

  /**
   * ⚠️  DEPRECATED: Upload file via buffer
   * 
   * Keep for backward compatibility
   * Will be removed in future version
   */
  async uploadFile(req, res, next) {
    res.status(410).json({
      success: false,
      message: 'This endpoint is deprecated. Use /api/upload/generate-url instead.',
      migrationGuide: {
        oldFlow: 'FE → BE (upload buffer) → Cloudinary',
        newFlow: 'FE → BE (get presigned URL) → FE uploads to R2 directly',
        newEndpoint: 'POST /api/upload/generate-url',
      },
    });
  }

  /**
   * ⚠️  DEPRECATED: Upload multiple files via buffer
   */
  async uploadMultipleFiles(req, res, next) {
    res.status(410).json({
      success: false,
      message: 'This endpoint is deprecated. Use /api/upload/generate-urls instead.',
      migrationGuide: {
        oldFlow: 'FE → BE (upload buffers) → Cloudinary',
        newFlow: 'FE → BE (get presigned URLs) → FE uploads to R2 directly',
        newEndpoint: 'POST /api/upload/generate-urls',
      },
    });
  }

  /**
   * ✅ HELPER: Validate key ownership
   * 
   * Checks if key belongs to the requesting user
   * 
   * Key format: chat-app/{userId}/{mediaType}s/{timestamp}-{random}.{ext}
   * 
   * @param {string} key - File key
   * @param {string} userId - User ID
   * @returns {boolean}
   */
  _validateKeyOwnership(key, userId) {
    if (!key || !userId) {
      return false;
    }

    // Extract userId from key structure
    // Expected: chat-app/{userId}/images/file.jpg
    const keyParts = key.split('/');
    
    if (keyParts.length < 3) {
      return false;
    }

    // keyParts[0] = 'chat-app'
    // keyParts[1] = userId
    const keyUserId = keyParts[1];

    // Exact match required (prevents alice123 from deleting alice1234's files)
    return keyUserId === userId;
  }
}

export default new UploadController();
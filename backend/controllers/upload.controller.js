// backend/controllers/upload.controller.js
import fileUploadService from '../services/fileUpload.service.js';
import { ValidationError } from '../middleware/errorHandler.js';

class UploadController {
  /**
   * Upload single file
   * POST /api/upload
   */
  async uploadFile(req, res, next) {
    try {
      if (!fileUploadService.isEnabled()) {
        throw new ValidationError(
          'File upload is not configured. Please contact administrator.'
        );
      }

      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      console.log('📤 [UploadController] Uploading file:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Determine file type
      let fileType = 'file';
      if (req.file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        fileType = 'video';
      }

      // Validate file
      fileUploadService.validateFile(
        {
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        fileType
      );

      // Upload to Cloudinary
      let result;
      const base64File = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      if (fileType === 'image') {
        result = await fileUploadService.uploadImage(base64File, {
          folder: `chat-app/${req.user.uid}/images`,
          originalName: req.file.originalname
        });
      } else if (fileType === 'video') {
        result = await fileUploadService.uploadVideo(base64File, {
          folder: `chat-app/${req.user.uid}/videos`,
          originalName: req.file.originalname
        });
      } else {
        result = await fileUploadService.uploadFile(base64File, {
          folder: `chat-app/${req.user.uid}/files`,
          originalName: req.file.originalname
        });
      }

      console.log('✅ [UploadController] File uploaded successfully');

      res.status(200).json({
        success: true,
        data: {
          url: result.url,
          publicId: result.publicId,
          name: result.name,
          size: result.size,
          type: result.type,
          format: result.format
        }
      });
    } catch (error) {
      console.error('❌ [UploadController] Upload error:', error);
      next(error);
    }
  }

  /**
   * Upload multiple files
   * POST /api/upload/multiple
   */
  async uploadMultipleFiles(req, res, next) {
    try {
      if (!fileUploadService.isEnabled()) {
        throw new ValidationError(
          'File upload is not configured. Please contact administrator.'
        );
      }

      if (!req.files || req.files.length === 0) {
        throw new ValidationError('No files uploaded');
      }

      console.log(`📤 [UploadController] Uploading ${req.files.length} files`);

      // Upload all files
      const uploadPromises = req.files.map(async (file) => {
        // Determine file type
        let fileType = 'file';
        if (file.mimetype.startsWith('image/')) {
          fileType = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          fileType = 'video';
        }

        // Validate file
        fileUploadService.validateFile(
          {
            size: file.size,
            mimetype: file.mimetype
          },
          fileType
        );

        // Upload
        const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        
        if (fileType === 'image') {
          return await fileUploadService.uploadImage(base64File, {
            folder: `chat-app/${req.user.uid}/images`,
            originalName: file.originalname
          });
        } else if (fileType === 'video') {
          return await fileUploadService.uploadVideo(base64File, {
            folder: `chat-app/${req.user.uid}/videos`,
            originalName: file.originalname
          });
        } else {
          return await fileUploadService.uploadFile(base64File, {
            folder: `chat-app/${req.user.uid}/files`,
            originalName: file.originalname
          });
        }
      });

      const results = await Promise.all(uploadPromises);

      console.log(`✅ [UploadController] ${results.length} files uploaded successfully`);

      res.status(200).json({
        success: true,
        data: results.map(result => ({
          url: result.url,
          publicId: result.publicId,
          name: result.name,
          size: result.size,
          type: result.type,
          format: result.format
        }))
      });
    } catch (error) {
      console.error('❌ [UploadController] Multiple upload error:', error);
      next(error);
    }
  }

  /**
   * Delete file
   * DELETE /api/upload/:publicId
   */
  async deleteFile(req, res, next) {
    try {
      if (!fileUploadService.isEnabled()) {
        throw new ValidationError(
          'File upload is not configured. Please contact administrator.'
        );
      }

      const { publicId } = req.params;
      const { type = 'image' } = req.query;

      if (!publicId) {
        throw new ValidationError('publicId is required');
      }

      console.log('🗑️  [UploadController] Deleting file:', publicId);

      // Verify that the file belongs to the user (security check)
      if (!publicId.includes(req.user.uid)) {
        throw new ValidationError('Unauthorized to delete this file');
      }

      const result = await fileUploadService.deleteFile(publicId, type);

      console.log('✅ [UploadController] File deleted successfully');

      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      console.error('❌ [UploadController] Delete error:', error);
      next(error);
    }
  }
}

export default new UploadController();
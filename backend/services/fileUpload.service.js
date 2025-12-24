// backend/services/fileUpload.service.js
import { v2 as cloudinary } from 'cloudinary';
import { getEnvConfig } from '../config/validateEnv.js';
import crypto from 'crypto';

/**
 * File Upload Service
 * Handles file uploads to Cloudinary
 */

class FileUploadService {
  constructor() {
    const config = getEnvConfig();
    
    if (!config.cloudinary.enabled) {
      console.warn('⚠️  Cloudinary not configured. File upload disabled.');
      this.enabled = false;
      return;
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
      secure: true
    });

    this.enabled = true;
    console.log('✅ Cloudinary configured');
  }

  /**
   * Check if file upload is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Upload image to Cloudinary
   * @param {Buffer|string} file - File buffer or base64 string
   * @param {object} options - Upload options
   */
  async uploadImage(file, options = {}) {
    if (!this.enabled) {
      throw new Error('File upload is not configured. Please set CLOUDINARY credentials.');
    }

    try {
      const uploadOptions = {
        folder: options.folder || 'chat-app/images',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        max_file_size: 5 * 1024 * 1024, // 5MB
        ...options
      };

      // Generate unique public_id if not provided
      if (!uploadOptions.public_id) {
        uploadOptions.public_id = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      }

      const result = await cloudinary.uploader.upload(file, uploadOptions);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        type: 'image',
        name: `${result.public_id}.${result.format}`
      };
    } catch (error) {
      console.error('❌ Image upload error:', error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload file (non-image) to Cloudinary
   * @param {Buffer|string} file - File buffer or base64 string
   * @param {object} options - Upload options
   */
  async uploadFile(file, options = {}) {
    if (!this.enabled) {
      throw new Error('File upload is not configured');
    }

    try {
      const uploadOptions = {
        folder: options.folder || 'chat-app/files',
        resource_type: 'raw',
        max_file_size: 10 * 1024 * 1024, // 10MB
        ...options
      };

      if (!uploadOptions.public_id) {
        uploadOptions.public_id = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      }

      const result = await cloudinary.uploader.upload(file, uploadOptions);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        size: result.bytes,
        type: 'file',
        name: options.originalName || `${result.public_id}.${result.format}`
      };
    } catch (error) {
      console.error('❌ File upload error:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Upload video to Cloudinary
   * @param {Buffer|string} file - File buffer or base64 string
   * @param {object} options - Upload options
   */
  async uploadVideo(file, options = {}) {
    if (!this.enabled) {
      throw new Error('File upload is not configured');
    }

    try {
      const uploadOptions = {
        folder: options.folder || 'chat-app/videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
        max_file_size: 50 * 1024 * 1024, // 50MB
        ...options
      };

      if (!uploadOptions.public_id) {
        uploadOptions.public_id = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      }

      const result = await cloudinary.uploader.upload(file, uploadOptions);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        duration: result.duration,
        size: result.bytes,
        type: 'video',
        name: `${result.public_id}.${result.format}`
      };
    } catch (error) {
      console.error('❌ Video upload error:', error);
      throw new Error(`Video upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - 'image', 'video', or 'raw'
   */
  async deleteFile(publicId, resourceType = 'image') {
    if (!this.enabled) {
      return { success: false, message: 'File upload not configured' };
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });

      return {
        success: result.result === 'ok',
        result: result.result
      };
    } catch (error) {
      console.error('❌ File delete error:', error);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Get file info from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @param {string} resourceType - 'image', 'video', or 'raw'
   */
  async getFileInfo(publicId, resourceType = 'image') {
    if (!this.enabled) {
      throw new Error('File upload is not configured');
    }

    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });

      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
        createdAt: result.created_at,
        type: result.resource_type
      };
    } catch (error) {
      console.error('❌ Get file info error:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail from video
   * @param {string} publicId - Cloudinary public ID of video
   */
  async generateVideoThumbnail(publicId) {
    if (!this.enabled) {
      throw new Error('File upload is not configured');
    }

    try {
      // Generate thumbnail URL (Cloudinary transformation)
      const thumbnailUrl = cloudinary.url(publicId, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { width: 300, height: 300, crop: 'fill' },
          { quality: 'auto' }
        ]
      });

      return {
        url: thumbnailUrl
      };
    } catch (error) {
      console.error('❌ Generate thumbnail error:', error);
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  /**
   * Validate file before upload
   * @param {object} file - File metadata
   * @param {string} type - 'image', 'video', or 'file'
   */
  validateFile(file, type = 'image') {
    const limits = {
      image: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      },
      video: {
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedFormats: ['mp4', 'mov', 'avi', 'webm'],
        allowedMimeTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
      },
      file: {
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedFormats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'zip'],
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'application/zip'
        ]
      }
    };

    const limit = limits[type];

    // Check file size
    if (file.size > limit.maxSize) {
      throw new Error(`File size exceeds limit of ${limit.maxSize / 1024 / 1024}MB`);
    }

    // Check mime type
    if (!limit.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }

    return true;
  }
}

export default new FileUploadService();
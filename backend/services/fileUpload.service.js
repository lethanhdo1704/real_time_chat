// backend/services/fileUpload.service.js
import r2Service from './storage/r2.service.js';
import { getEnvConfig } from '../config/validateEnv.js';
import crypto from 'crypto';

/**
 * 🔥 FILE UPLOAD SERVICE - R2 VERSION
 * 
 * Responsibilities:
 * - Validate files (size, mime, batch total)
 * - Classify files (image/video/audio/file)
 * - Generate presigned URLs via R2
 * - Delete files from R2
 * 
 * ❌ NOT responsible for:
 * - Creating Message documents
 * - Socket events
 * - Business logic
 * 
 * @production
 */

class FileUploadService {
  constructor() {
    this.config = getEnvConfig();
    this.enabled = this.config.r2.enabled;

    if (!this.enabled) {
      console.warn('⚠️  R2 not configured. File upload disabled.');
    } else {
      console.log('✅ FileUpload service initialized with R2');
    }

    // File type classification
    this.mimeTypeMap = {
      // Images
      'image/jpeg': 'image',
      'image/jpg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'image/webp': 'image',
      'image/svg+xml': 'image',
      
      // Videos
      'video/mp4': 'video',
      'video/webm': 'video',
      'video/ogg': 'video',
      'video/quicktime': 'video',
      'video/x-msvideo': 'video',
      
      // Audio
      'audio/mpeg': 'audio',
      'audio/mp3': 'audio',
      'audio/wav': 'audio',
      'audio/ogg': 'audio',
      'audio/webm': 'audio',
      'audio/aac': 'audio',
      'audio/m4a': 'audio',
      
      // Documents
      'application/pdf': 'file',
      'application/msword': 'file',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file',
      'application/vnd.ms-excel': 'file',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'file',
      'text/plain': 'file',
      'application/zip': 'file',
      'application/x-zip-compressed': 'file',
      'application/x-rar-compressed': 'file',
      'application/x-7z-compressed': 'file',
    };

    // Size limits
    this.limits = {
      maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB per file (same as batch)
      maxBatchSize: 1 * 1024 * 1024 * 1024, // 1GB per batch
      maxFilesPerBatch: 20, // Max 20 files in one batch
    };
  }

  /**
   * Check if file upload is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * 🔥 CLASSIFY FILE TYPE
   * 
   * @param {string} mimeType - MIME type from FE
   * @returns {string} 'image' | 'video' | 'audio' | 'file'
   */
  classifyFileType(mimeType) {
    const normalized = mimeType.toLowerCase();
    return this.mimeTypeMap[normalized] || 'file';
  }

  /**
   * 🔥 VALIDATE SINGLE FILE
   * 
   * @param {object} file
   * @param {string} file.name - Original filename
   * @param {number} file.size - File size in bytes
   * @param {string} file.mime - MIME type
   * @throws {Error} If validation fails
   */
  validateFile(file) {
    // Check required fields
    if (!file.name || !file.size || !file.mime) {
      throw new Error('Invalid file metadata: name, size, and mime are required');
    }

    // Check file size
    if (file.size <= 0) {
      throw new Error('File size must be greater than 0');
    }

    if (file.size > this.limits.maxFileSize) {
      throw new Error(
        `File "${file.name}" exceeds maximum size of ${this.limits.maxFileSize / 1024 / 1024 / 1024}GB`
      );
    }

    // Check MIME type
    if (!this.mimeTypeMap[file.mime.toLowerCase()]) {
      throw new Error(`File type "${file.mime}" is not supported`);
    }

    return true;
  }

  /**
   * 🔥 VALIDATE BATCH OF FILES
   * 
   * Critical rule: Total size ≤ 1GB
   * 
   * @param {Array} files - Array of file metadata
   * @throws {Error} If validation fails
   */
  validateBatch(files) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('Files array is required and must not be empty');
    }

    // Check max files per batch
    if (files.length > this.limits.maxFilesPerBatch) {
      throw new Error(
        `Maximum ${this.limits.maxFilesPerBatch} files per batch. ` +
        `You provided ${files.length} files.`
      );
    }

    // Validate each file
    files.forEach((file, index) => {
      try {
        this.validateFile(file);
      } catch (error) {
        throw new Error(`File #${index + 1}: ${error.message}`);
      }
    });

    // 🔥 CRITICAL: Check total batch size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > this.limits.maxBatchSize) {
      const totalGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);
      const limitGB = (this.limits.maxBatchSize / 1024 / 1024 / 1024).toFixed(0);
      
      throw new Error(
        `Batch total size (${totalGB}GB) exceeds limit of ${limitGB}GB`
      );
    }

    console.log('✅ [FileUpload] Batch validated:', {
      files: files.length,
      totalSize: `${(totalSize / 1024 / 1024 / 1024).toFixed(2)}GB`,
      limit: `${(this.limits.maxBatchSize / 1024 / 1024 / 1024).toFixed(0)}GB`,
    });

    return true;
  }

  /**
   * 🔥 GENERATE PRESIGNED UPLOAD URLS
   * 
   * Frontend uploads directly to these URLs
   * 
   * @param {object} params
   * @param {string} params.userId - User ID (for folder structure)
   * @param {Array} params.files - Array of {name, size, mime}
   * @returns {Promise<Array>} Array of upload URLs + metadata
   */
  async generateUploadUrls({ userId, files }) {
    if (!this.enabled) {
      throw new Error('File upload is not configured');
    }

    // Validate batch
    this.validateBatch(files);

    console.log(`📤 [FileUpload] Generating ${files.length} upload URLs for user ${userId}`);

    // Generate presigned URL for each file
    const uploadPromises = files.map(async (file) => {
      const mediaType = this.classifyFileType(file.mime);
      
      // Generate folder path
      const folder = `chat-app/${userId}/${mediaType}s`;
      
      // Generate unique key
      const key = r2Service.generateFileKey(folder, file.name);
      
      // Generate presigned upload URL
      const { uploadUrl, publicUrl } = await r2Service.generatePresignedUploadUrl({
        key,
        contentType: file.mime,
        expiresIn: 3600, // 1 hour to complete upload
      });

      return {
        // For FE to upload
        uploadUrl,
        
        // For FE to send to sendMessage
        metadata: {
          url: publicUrl,
          name: file.name,
          size: file.size,
          mime: file.mime,
          mediaType,
          key, // FE should store this for cancel/delete
        },
      };
    });

    const results = await Promise.all(uploadPromises);

    console.log(`✅ [FileUpload] Generated ${results.length} presigned URLs`);

    return results;
  }

  /**
   * 🔥 DELETE FILE FROM R2
   * 
   * Called when:
   * - User cancels upload
   * - Admin deletes message
   * 
   * @param {string} keyOrUrl - R2 key or public URL
   * @returns {Promise<object>}
   */
  async deleteFile(keyOrUrl) {
    if (!this.enabled) {
      throw new Error('File upload is not configured');
    }

    // Extract key from URL if needed
    let key = keyOrUrl;
    if (keyOrUrl.startsWith('http')) {
      key = r2Service.extractKeyFromUrl(keyOrUrl);
      if (!key) {
        throw new Error('Invalid file URL - cannot extract key');
      }
    }

    console.log('🗑️  [FileUpload] Deleting file:', key);

    const result = await r2Service.deleteFile(key);

    console.log('✅ [FileUpload] File deleted:', key);

    return result;
  }

  /**
   * 🔥 DELETE MULTIPLE FILES (BATCH)
   * 
   * More efficient than one-by-one
   * 
   * @param {Array<string>} keysOrUrls - Array of keys or URLs
   * @returns {Promise<object>}
   */
  async deleteFiles(keysOrUrls) {
    if (!this.enabled) {
      throw new Error('File upload is not configured');
    }

    console.log(`🗑️  [FileUpload] Batch deleting ${keysOrUrls.length} files`);

    // Extract keys from URLs
    const keys = keysOrUrls.map(keyOrUrl => {
      if (keyOrUrl.startsWith('http')) {
        return r2Service.extractKeyFromUrl(keyOrUrl);
      }
      return keyOrUrl;
    }).filter(Boolean);

    const result = await r2Service.deleteFiles(keys);

    console.log('✅ [FileUpload] Batch delete completed:', {
      total: keys.length,
      deleted: result.deleted.length,
      failed: result.failed.length,
    });

    return result;
  }

  /**
   * 🔥 CANCEL UPLOAD
   * 
   * If user cancels upload after getting presigned URL
   * but before completing upload
   * 
   * @param {string} key - File key
   */
  async cancelUpload(key) {
    // If file was partially uploaded, delete it
    try {
      await this.deleteFile(key);
      console.log('✅ [FileUpload] Cancelled upload cleaned up:', key);
    } catch (error) {
      // File might not exist yet - ignore error
      console.log('ℹ️  [FileUpload] Cancel upload - file not found (OK):', key);
    }
  }

  /**
   * Extract attachments URLs from message for deletion
   * 
   * @param {object} message - Message document
   * @returns {Array<string>} Array of file URLs
   */
  extractAttachmentUrls(message) {
    if (!message.attachments || message.attachments.length === 0) {
      return [];
    }

    return message.attachments.map(att => att.url);
  }

  /**
   * Get file info for FE display
   * 
   * @param {string} url - Public URL
   * @returns {object} File metadata
   */
  getFileInfo(url) {
    const key = r2Service.extractKeyFromUrl(url);
    
    return {
      url,
      key,
      publicUrl: url,
    };
  }

  /**
   * Get upload limits (for FE validation)
   */
  getLimits() {
    return {
      maxFileSize: this.limits.maxFileSize,
      maxFileSizeGB: this.limits.maxFileSize / 1024 / 1024 / 1024,
      maxBatchSize: this.limits.maxBatchSize,
      maxBatchSizeGB: this.limits.maxBatchSize / 1024 / 1024 / 1024,
      maxFilesPerBatch: this.limits.maxFilesPerBatch,
      supportedTypes: Object.keys(this.mimeTypeMap),
    };
  }
}

export default new FileUploadService();
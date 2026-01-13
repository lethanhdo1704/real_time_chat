// backend/services/fileUpload.service.js
import r2Service from './storage/r2.service.js';
import { getEnvConfig } from '../config/validateEnv.js';
import crypto from 'crypto';

/**
 * 🔥 FILE UPLOAD SERVICE - R2 VERSION - ALL FILE TYPES SUPPORTED
 * 
 * Responsibilities:
 * - Validate files (size, batch total)
 * - Classify files (image/video/audio/file)
 * - Generate presigned URLs via R2
 * - Delete files from R2
 * 
 * ✅ SUPPORTS ALL FILE TYPES - No MIME type restrictions
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
      console.log('✅ FileUpload service initialized with R2 (ALL file types enabled)');
    }

    // File type classification map (for organizing storage)
    this.mimeTypeMap = {
      // Images
      'image/jpeg': 'image',
      'image/jpg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'image/webp': 'image',
      'image/svg+xml': 'image',
      'image/bmp': 'image',
      'image/tiff': 'image',
      'image/x-icon': 'image',
      'image/heic': 'image',
      'image/heif': 'image',
      'image/avif': 'image',
      
      // Videos
      'video/mp4': 'video',
      'video/webm': 'video',
      'video/ogg': 'video',
      'video/quicktime': 'video',
      'video/x-msvideo': 'video',
      'video/x-matroska': 'video',
      'video/mpeg': 'video',
      'video/3gpp': 'video',
      'video/x-flv': 'video',
      'video/x-ms-wmv': 'video',
      
      // Audio
      'audio/mpeg': 'audio',
      'audio/mp3': 'audio',
      'audio/wav': 'audio',
      'audio/ogg': 'audio',
      'audio/webm': 'audio',
      'audio/aac': 'audio',
      'audio/m4a': 'audio',
      'audio/x-m4a': 'audio',
      'audio/flac': 'audio',
      'audio/x-flac': 'audio',
      'audio/wma': 'audio',
      
      // Documents - PDF
      'application/pdf': 'file',
      
      // Documents - Microsoft Office (Legacy)
      'application/msword': 'file',
      'application/vnd.ms-excel': 'file',
      'application/vnd.ms-powerpoint': 'file',
      
      // Documents - Microsoft Office (OpenXML)
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'file',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'file',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template': 'file',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.template': 'file',
      'application/vnd.openxmlformats-officedocument.presentationml.template': 'file',
      
      // Documents - OpenOffice/LibreOffice
      'application/vnd.oasis.opendocument.text': 'file',
      'application/vnd.oasis.opendocument.spreadsheet': 'file',
      'application/vnd.oasis.opendocument.presentation': 'file',
      
      // Documents - Text
      'text/plain': 'file',
      'text/csv': 'file',
      'text/html': 'file',
      'text/xml': 'file',
      'application/xml': 'file',
      'application/json': 'file',
      'text/markdown': 'file',
      'text/rtf': 'file',
      'application/rtf': 'file',
      
      // Archives
      'application/zip': 'file',
      'application/x-zip-compressed': 'file',
      'application/x-rar-compressed': 'file',
      'application/x-rar': 'file',
      'application/x-7z-compressed': 'file',
      'application/x-tar': 'file',
      'application/gzip': 'file',
      'application/x-gzip': 'file',
      'application/x-bzip2': 'file',
      
      // Programming/Development
      'text/javascript': 'file',
      'application/javascript': 'file',
      'text/css': 'file',
      'application/x-python': 'file',
      'text/x-python': 'file',
      'application/java-archive': 'file',
      
      // Other
      'application/octet-stream': 'file',
    };

    // 🔥 CRITICAL: Allow ALL file types, even if not in the map
    this.allowUnknownTypes = true;

    // Size limits
    this.limits = {
      maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB per file
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
   * 🔥 CLASSIFY FILE TYPE - WITH SMART FALLBACK
   * 
   * Uses MIME type to organize files into folders:
   * - images/ for images
   * - videos/ for videos
   * - audios/ for audio
   * - files/ for everything else
   * 
   * @param {string} mimeType - MIME type from FE
   * @returns {string} 'image' | 'video' | 'audio' | 'file'
   */
  classifyFileType(mimeType) {
    if (!mimeType) {
      return 'file'; // Default for empty/null MIME type
    }

    const normalized = mimeType.toLowerCase().trim();
    
    // Check exact match first
    if (this.mimeTypeMap[normalized]) {
      return this.mimeTypeMap[normalized];
    }
    
    // 🔥 SMART FALLBACK: Classify by MIME type prefix
    if (normalized.startsWith('image/')) return 'image';
    if (normalized.startsWith('video/')) return 'video';
    if (normalized.startsWith('audio/')) return 'audio';
    
    // Everything else is a 'file'
    return 'file';
  }

  /**
   * 🔥 VALIDATE SINGLE FILE - SIZE ONLY, ALL TYPES ACCEPTED
   * 
   * @param {object} file
   * @param {string} file.name - Original filename
   * @param {number} file.size - File size in bytes
   * @param {string} file.mime - MIME type (optional, defaults to octet-stream)
   * @throws {Error} If validation fails
   */
  validateFile(file) {
    // Check required fields
    if (!file.name) {
      throw new Error('File name is required');
    }

    if (file.size === undefined || file.size === null) {
      throw new Error('File size is required');
    }

    // Allow empty files (edge case, but might be valid)
    if (file.size < 0) {
      throw new Error('File size cannot be negative');
    }

    // 🔥 ONLY VALIDATE SIZE - NOT MIME TYPE
    if (file.size > this.limits.maxFileSize) {
      const maxSizeGB = (this.limits.maxFileSize / 1024 / 1024 / 1024).toFixed(1);
      const fileSizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
      throw new Error(
        `File "${file.name}" (${fileSizeGB}GB) exceeds maximum size of ${maxSizeGB}GB`
      );
    }

    // 🔥 NO MIME TYPE VALIDATION
    // Accept all file types - MIME type is used only for classification

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
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

    if (totalSize > this.limits.maxBatchSize) {
      const totalGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);
      const limitGB = (this.limits.maxBatchSize / 1024 / 1024 / 1024).toFixed(1);
      
      throw new Error(
        `Batch total size (${totalGB}GB) exceeds limit of ${limitGB}GB`
      );
    }

    console.log('✅ [FileUpload] Batch validated:', {
      files: files.length,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(this.limits.maxBatchSize / 1024 / 1024 / 1024).toFixed(1)}GB`,
      types: files.map(f => f.mime || 'unknown'),
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
      // Normalize MIME type
      const normalizedMime = file.mime || 'application/octet-stream';
      
      // Classify file type (for folder organization)
      const mediaType = this.classifyFileType(normalizedMime);
      
      // Generate folder path
      const folder = `chat-app/${userId}/${mediaType}s`;
      
      // Generate unique key
      const key = r2Service.generateFileKey(folder, file.name);
      
      // Generate presigned upload URL
      const { uploadUrl, publicUrl } = await r2Service.generatePresignedUploadUrl({
        key,
        contentType: normalizedMime,
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
          mime: normalizedMime,
          mediaType,
          key, // FE should store this for cancel/delete
        },
      };
    });

    const results = await Promise.all(uploadPromises);

    console.log(`✅ [FileUpload] Generated ${results.length} presigned URLs`, {
      types: results.map(r => r.metadata.mediaType),
    });

    return results;
  }

  /**
   * 🔥 DELETE FILE FROM R2
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
   */
  async cancelUpload(key) {
    try {
      await this.deleteFile(key);
      console.log('✅ [FileUpload] Cancelled upload cleaned up:', key);
    } catch (error) {
      console.log('ℹ️  [FileUpload] Cancel upload - file not found (OK):', key);
    }
  }

  /**
   * Extract attachments URLs from message for deletion
   */
  extractAttachmentUrls(message) {
    if (!message.attachments || message.attachments.length === 0) {
      return [];
    }

    return message.attachments.map(att => att.url);
  }

  /**
   * Get file info for FE display
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
   * 🔥 Get upload limits (for FE validation)
   * 
   * Returns info about what file types are allowed
   */
  getLimits() {
    return {
      maxFileSize: this.limits.maxFileSize,
      maxFileSizeGB: this.limits.maxFileSize / 1024 / 1024 / 1024,
      maxBatchSize: this.limits.maxBatchSize,
      maxBatchSizeGB: this.limits.maxBatchSize / 1024 / 1024 / 1024,
      maxFilesPerBatch: this.limits.maxFilesPerBatch,
      
      // 🔥 Indicate that ALL file types are supported
      supportedTypes: ['*'], // Asterisk means "all types"
      allowUnknownTypes: this.allowUnknownTypes,
      
      // Info message for frontend
      message: 'All file types are supported. Only size limits apply.',
    };
  }
}

export default new FileUploadService();
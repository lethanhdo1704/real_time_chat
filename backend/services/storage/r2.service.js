// backend/services/storage/r2.service.js
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnvConfig } from '../../config/validateEnv.js';
import crypto from 'crypto';

/**
 * 🔥 CLOUDFLARE R2 STORAGE SERVICE
 * 
 * Responsibilities:
 * - Initialize R2 client
 * - Generate presigned URLs for uploads
 * - Delete objects
 * - Generate public URLs
 * 
 * ❌ NOT responsible for:
 * - Business logic (file validation)
 * - Message creation
 * - Batch size validation
 * 
 * @production
 */
class R2Service {
  constructor() {
    this.client = null;
    this.bucket = null;
    this.publicUrl = null; // ✅ Đổi tên từ publicDomain → publicUrl
    this.enabled = false;

    this.initialize();
  }

  /**
   * ✅ IMPROVED: Initialize R2 client with validation
   */
  initialize() {
    try {
      const config = getEnvConfig();

      if (!config.r2?.enabled) {
        console.warn('⚠️  R2 not configured. File upload disabled.');
        return;
      }

      // ✅ VALIDATE required fields
      const required = ['endpoint', 'accessKeyId', 'secretAccessKey', 'bucket'];
      const missing = required.filter(field => !config.r2[field]);
      
      if (missing.length > 0) {
        throw new Error(`Missing R2 configuration: ${missing.join(', ')}`);
      }

      // Initialize S3 client for R2
      this.client = new S3Client({
        region: 'auto', // R2 uses 'auto' region
        endpoint: config.r2.endpoint,
        credentials: {
          accessKeyId: config.r2.accessKeyId,
          secretAccessKey: config.r2.secretAccessKey,
        },
      });

      this.bucket = config.r2.bucket;
      this.publicUrl = config.r2.publicUrl || null;
      this.enabled = true;

      console.log('✅ R2 Storage initialized:', {
        bucket: this.bucket,
        endpoint: config.r2.endpoint,
        publicUrl: this.publicUrl || '⚠️  Not configured (files may not be accessible)',
      });
    } catch (error) {
      console.error('❌ R2 initialization failed:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Check if R2 is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Generate unique file key
   * Pattern: {folder}/{timestamp}_{random}_{filename}
   * 
   * @param {string} folder - Folder path (e.g., 'chat-app/user123/images')
   * @param {string} filename - Original filename
   * @returns {string} Unique key
   */
  generateFileKey(folder, filename) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    
    // ✅ Sanitize filename properly
    const ext = filename.split('.').pop().toLowerCase();
    const baseName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    const sanitized = baseName
      .replace(/[^a-zA-Z0-9-_]/g, '_') // Replace special chars
      .substring(0, 50); // Limit length
    
    return `${folder}/${timestamp}_${random}_${sanitized}.${ext}`;
  }

  /**
   * 🔥 GENERATE PRESIGNED UPLOAD URL
   * 
   * Frontend uploads directly to this URL
   * No file passes through backend
   * 
   * @param {object} params
   * @param {string} params.key - File key/path
   * @param {string} params.contentType - MIME type
   * @param {number} params.expiresIn - URL expiration in seconds (default: 3600)
   * @returns {Promise<object>} { uploadUrl, key, publicUrl }
   */
  async generatePresignedUploadUrl({ key, contentType, expiresIn = 3600 }) {
    if (!this.enabled) {
      throw new Error('R2 storage is not configured');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.client, command, {
        expiresIn,
      });

      const publicUrl = this.getPublicUrl(key);

      console.log('✅ [R2] Presigned upload URL generated:', {
        key,
        contentType,
        expiresIn: `${expiresIn}s`,
      });

      return {
        uploadUrl,
        key,
        publicUrl,
      };
    } catch (error) {
      console.error('❌ [R2] Failed to generate presigned URL:', error);
      throw new Error(`Failed to generate upload URL: ${error.message}`);
    }
  }

  /**
   * ✅ IMPROVED: Get public URL for file
   * 
   * @param {string} key - File key
   * @returns {string} Public URL
   */
  getPublicUrl(key) {
    if (this.publicUrl) {
      // ✅ Use configured public URL (recommended)
      const baseUrl = this.publicUrl.replace(/\/$/, ''); // Remove trailing slash
      return `${baseUrl}/${key}`;
    }

    // ⚠️ Fallback: Not recommended for production
    console.warn(
      '⚠️  [R2] No public URL configured. Configure R2_PUBLIC_URL in .env for production.\n' +
      '   Example: R2_PUBLIC_URL=https://pub-xxxxx.r2.dev'
    );
    
    const config = getEnvConfig();
    const endpoint = config.r2.endpoint.replace(/\/$/, '');
    return `${endpoint}/${this.bucket}/${key}`;
  }

  /**
   * 🔥 GENERATE PRESIGNED DOWNLOAD URL
   * 
   * For private files that need temporary access
   * 
   * @param {string} key - File key
   * @param {number} expiresIn - URL expiration in seconds (default: 3600)
   * @returns {Promise<string>} Presigned download URL
   */
  async generatePresignedDownloadUrl(key, expiresIn = 3600) {
    if (!this.enabled) {
      throw new Error('R2 storage is not configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const downloadUrl = await getSignedUrl(this.client, command, {
        expiresIn,
      });

      console.log('✅ [R2] Presigned download URL generated:', { key, expiresIn });

      return downloadUrl;
    } catch (error) {
      console.error('❌ [R2] Failed to generate download URL:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * 🔥 DELETE FILE FROM R2
   * 
   * Called when:
   * - User cancels upload
   * - Admin deletes message with attachments
   * - Cleanup old files
   * 
   * @param {string} key - File key to delete
   * @returns {Promise<object>} { success, key }
   */
  async deleteFile(key) {
    if (!this.enabled) {
      throw new Error('R2 storage is not configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);

      console.log('✅ [R2] File deleted:', key);

      return {
        success: true,
        key,
      };
    } catch (error) {
      console.error('❌ [R2] Failed to delete file:', key, error.message);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * 🔥 DELETE MULTIPLE FILES (BATCH)
   * 
   * More efficient than deleting one by one
   * 
   * @param {string[]} keys - Array of file keys
   * @returns {Promise<object>} { success, deleted, failed }
   */
  async deleteFiles(keys) {
    if (!this.enabled) {
      throw new Error('R2 storage is not configured');
    }

    if (!keys || keys.length === 0) {
      return { success: true, deleted: [], failed: [] };
    }

    console.log(`🗑️  [R2] Batch deleting ${keys.length} files...`);

    const results = await Promise.allSettled(
      keys.map(key => this.deleteFile(key))
    );

    const deleted = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value.key);
    
    const failed = results
      .filter(r => r.status === 'rejected')
      .map((r, i) => ({
        key: keys[i],
        error: r.reason?.message || 'Unknown error',
      }));

    console.log('✅ [R2] Batch delete completed:', {
      total: keys.length,
      deleted: deleted.length,
      failed: failed.length,
    });

    return {
      success: failed.length === 0,
      deleted,
      failed,
    };
  }

  /**
   * ✅ IMPROVED: Extract file key from public URL
   * 
   * Supports multiple URL formats:
   * - Custom domain: https://cdn.example.com/chat-app/user123/file.jpg
   * - R2 dev: https://pub-xxxxx.r2.dev/chat-app/user123/file.jpg
   * - R2 storage: https://xxx.r2.cloudflarestorage.com/bucket/key
   * 
   * @param {string} url - Public URL
   * @returns {string|null} File key or null if invalid
   */
  extractKeyFromUrl(url) {
    try {
      if (!url || !url.startsWith('http')) {
        return null;
      }

      // Case 1: Custom domain (if configured)
      if (this.publicUrl && url.startsWith(this.publicUrl)) {
        const baseUrl = this.publicUrl.replace(/\/$/, '');
        return url.replace(`${baseUrl}/`, '');
      }

      // Case 2: R2 dev subdomain (most common)
      // Format: https://pub-xxxxx.r2.dev/chat-app/user123/file.jpg
      if (url.includes('.r2.dev/')) {
        const parts = url.split('.r2.dev/');
        return parts[1] || null;
      }

      // Case 3: R2 storage URL (internal, not typically public)
      // Format: https://xxx.r2.cloudflarestorage.com/bucket/key
      if (url.includes('.r2.cloudflarestorage.com/')) {
        const match = url.match(/\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/);
        if (match) {
          return match[1];
        }
      }

      // Fallback: Extract path from any URL
      const urlObj = new URL(url);
      const key = urlObj.pathname.substring(1); // Remove leading slash
      return key || null;
    } catch (error) {
      console.error('❌ [R2] Failed to extract key from URL:', url, error.message);
      return null;
    }
  }

  /**
   * Get file metadata (without downloading)
   * 
   * ⚠️  Note: R2 has limited HeadObject support
   * This returns basic info derived from the key
   * 
   * @param {string} key - File key
   * @returns {Promise<object>} File metadata
   */
  async getFileMetadata(key) {
    if (!this.enabled) {
      throw new Error('R2 storage is not configured');
    }

    // ⚠️  R2 limitation: Limited HeadObject support
    // For now, return basic info from key
    return {
      key,
      publicUrl: this.getPublicUrl(key),
      note: 'Full metadata not available - R2 API limitation',
    };
  }
}

export default new R2Service();
// frontend/src/user/services/uploadService.js

const API_BASE_URL = "/api";

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export const uploadService = {
  /**
   * Get upload limits from backend
   */
  async getUploadLimits(token) {
    const res = await fetch(`${API_BASE_URL}/upload/limits`, {
      headers: authHeaders(token),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to get upload limits");
    }

    const response = await res.json();
    console.log('📋 [UploadService] Upload limits:', response.data);
    return response.data;
  },

  /**
   * Generate presigned URL for single file
   * 🔥 UPDATED: Always set allowUnknownTypes = true
   */
  async generateUploadUrl(file, token) {
    const metadata = {
      name: file.name,
      size: file.size,
      mime: file.type || 'application/octet-stream',
    };

    console.log('📤 [UploadService] Requesting upload URL:', metadata);

    const res = await fetch(`${API_BASE_URL}/upload/generate-url`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(metadata),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to generate upload URL");
    }

    const response = await res.json();
    return response.data;
  },

  /**
   * Generate presigned URLs for multiple files (batch)
   * 🔥 UPDATED: Normalize MIME types for all files
   */
  async generateUploadUrls(files, token) {
    const filesMetadata = files.map(file => ({
      name: file.name,
      size: file.size,
      mime: file.type || 'application/octet-stream', // Fallback for unknown types
    }));

    console.log('📤 [UploadService] Requesting batch upload URLs:', {
      count: filesMetadata.length,
      files: filesMetadata.map(f => ({ name: f.name, mime: f.mime })),
    });

    const res = await fetch(`${API_BASE_URL}/upload/generate-urls`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ files: filesMetadata }),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to generate upload URLs");
    }

    const response = await res.json();
    console.log('✅ [UploadService] Batch URLs generated:', response.data.length);
    return response.data;
  },

  /**
   * Upload file directly to R2 using presigned URL
   * 
   * Supports AbortController for cancellation
   * 
   * @param {File} file - File object
   * @param {string} uploadUrl - Presigned URL from backend
   * @param {Function} onProgress - Progress callback
   * @param {AbortSignal} signal - AbortController signal
   * @returns {Promise}
   */
  async uploadToR2(file, uploadUrl, onProgress, signal) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();

      // Handle abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = e.loaded / elapsed;

          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent: (e.loaded / e.total) * 100,
            speed: speed,
          });
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          console.log('✅ [UploadService] File uploaded:', file.name);
          resolve({
            success: true,
            status: xhr.status,
          });
        } else {
          console.error('❌ [UploadService] Upload failed:', xhr.status);
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        console.error('❌ [UploadService] Network error');
        reject(new Error('Upload failed - network error'));
      });

      xhr.addEventListener('abort', () => {
        console.log('🚫 [UploadService] Upload aborted');
        const error = new Error('Upload cancelled');
        error.name = 'AbortError';
        reject(error);
      });

      // Start upload
      xhr.open('PUT', uploadUrl);
      
      // 🔥 CRITICAL: Set Content-Type, fallback to octet-stream
      const contentType = file.type || 'application/octet-stream';
      xhr.setRequestHeader('Content-Type', contentType);
      
      console.log('📤 [UploadService] Starting upload:', {
        name: file.name,
        size: file.size,
        type: contentType,
      });
      
      xhr.send(file);
    });
  },

  /**
   * Cancel upload by deleting file from R2
   */
  async cancelUpload(key, token) {
    console.log('🚫 [UploadService] Cancelling upload:', key);

    const res = await fetch(`${API_BASE_URL}/upload/cancel`, {
      method: "DELETE",
      headers: authHeaders(token),
      body: JSON.stringify({ key }),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to cancel upload");
    }

    const response = await res.json();
    return response;
  },

  /**
   * Delete file from R2
   */
  async deleteFile(key, token) {
    console.log('🗑️ [UploadService] Deleting file:', key);

    const res = await fetch(`${API_BASE_URL}/upload/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: authHeaders(token),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to delete file");
    }

    const response = await res.json();
    return response;
  },

  /**
   * Delete multiple files (batch)
   */
  async deleteFiles(keys, token) {
    console.log('🗑️ [UploadService] Batch deleting:', keys.length);

    const res = await fetch(`${API_BASE_URL}/upload/batch`, {
      method: "DELETE",
      headers: authHeaders(token),
      body: JSON.stringify({ keys }),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to delete files");
    }

    const response = await res.json();
    return response.data;
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Format upload speed
   */
  formatSpeed(bytesPerSecond) {
    return this.formatFileSize(bytesPerSecond) + '/s';
  },

  /**
   * 🔥 VALIDATE FILE - SIZE ONLY, ALL TYPES ALLOWED
   * 
   * NO MIME type validation - backend handles all types
   */
  validateFile(file, limits) {
    if (!file) {
      throw new Error('Invalid file');
    }

    if (!file.name) {
      throw new Error('File name is required');
    }

    // Allow 0-size files (edge case)
    if (file.size < 0) {
      throw new Error('Invalid file size');
    }

    // Check size limit
    if (limits?.maxFileSize && file.size > limits.maxFileSize) {
      const maxSizeGB = (limits.maxFileSize / 1024 / 1024 / 1024).toFixed(1);
      const fileSizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
      throw new Error(
        `File "${file.name}" (${fileSizeGB}GB) exceeds maximum size of ${maxSizeGB}GB`
      );
    }

    // 🔥 NO MIME TYPE VALIDATION
    // All file types are supported - backend will classify them
    
    console.log('✅ [UploadService] File validated:', {
      name: file.name,
      size: this.formatFileSize(file.size),
      type: file.type || 'unknown',
    });

    return true;
  },

  /**
   * 🔥 VALIDATE BATCH - SIZE AND COUNT ONLY
   */
  validateBatch(files, limits) {
    if (!files || files.length === 0) {
      throw new Error('No files selected');
    }

    if (limits?.maxFilesPerBatch && files.length > limits.maxFilesPerBatch) {
      throw new Error(`Maximum ${limits.maxFilesPerBatch} files per batch`);
    }

    // Validate each file (size only)
    files.forEach((file, index) => {
      try {
        this.validateFile(file, limits);
      } catch (error) {
        throw new Error(`File #${index + 1}: ${error.message}`);
      }
    });

    // Check total batch size
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    
    if (limits?.maxBatchSize && totalSize > limits.maxBatchSize) {
      const totalGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);
      const limitGB = (limits.maxBatchSize / 1024 / 1024 / 1024).toFixed(1);
      throw new Error(
        `Batch total size (${totalGB}GB) exceeds limit of ${limitGB}GB`
      );
    }

    console.log('✅ [UploadService] Batch validated:', {
      files: files.length,
      totalSize: this.formatFileSize(totalSize),
      types: files.map(f => f.type || 'unknown'),
    });

    return true;
  },

  /**
   * 🔥 Get file type category for display
   * 
   * @param {string} fileName - File name with extension
   * @param {string} mimeType - MIME type
   * @returns {string} Category: 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'unknown'
   */
  getFileCategory(fileName, mimeType) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mime = (mimeType || '').toLowerCase();
    
    // Check by MIME type first
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    
    // Check by extension for documents
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'odt', 'ods', 'odp'].includes(ext)) {
      return 'document';
    }
    
    // Check by extension for archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
      return 'archive';
    }
    
    // Check by extension for code
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml'].includes(ext)) {
      return 'code';
    }
    
    return 'unknown';
  },

  /**
   * 🔥 Get file icon emoji based on type
   */
  getFileIcon(fileName, mimeType) {
    const category = this.getFileCategory(fileName, mimeType);
    
    const icons = {
      image: '🖼️',
      video: '🎥',
      audio: '🎵',
      document: '📄',
      archive: '📦',
      code: '💻',
      unknown: '📎',
    };
    
    return icons[category] || icons.unknown;
  },

  /**
   * 🔥 Get human-readable file type description
   */
  getFileTypeDescription(fileName, mimeType) {
    const category = this.getFileCategory(fileName, mimeType);
    const ext = fileName.split('.').pop()?.toUpperCase();
    
    const descriptions = {
      image: 'Image',
      video: 'Video',
      audio: 'Audio',
      document: 'Document',
      archive: 'Archive',
      code: 'Code',
      unknown: ext || 'File',
    };
    
    return descriptions[category];
  },
};
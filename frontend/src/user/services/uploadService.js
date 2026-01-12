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
    return response.data;
  },

  /**
   * Generate presigned URL for single file
   */
  async generateUploadUrl(file, token) {
    const metadata = {
      name: file.name,
      size: file.size,
      mime: file.type,
    };

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
    return response.data; // { uploadUrl, metadata }
  },

  /**
   * Generate presigned URLs for multiple files (batch)
   */
  async generateUploadUrls(files, token) {
    const filesMetadata = files.map(file => ({
      name: file.name,
      size: file.size,
      mime: file.type,
    }));

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
    return response.data; // [{ uploadUrl, metadata }, ...]
  },

  /**
   * 🔥 FIXED: Upload file directly to R2 using presigned URL
   * 
   * Now supports AbortController for cancellation
   * 
   * @param {File} file - File object
   * @param {string} uploadUrl - Presigned URL from backend
   * @param {Function} onProgress - Progress callback (loaded, total, percent, speed)
   * @param {AbortSignal} signal - AbortController signal for cancellation
   * @returns {Promise}
   */
  async uploadToR2(file, uploadUrl, onProgress, signal) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();

      // 🔥 NEW: Handle abort signal
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = e.loaded / elapsed; // bytes/sec

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
          resolve({
            success: true,
            status: xhr.status,
          });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed - network error'));
      });

      xhr.addEventListener('abort', () => {
        const error = new Error('Upload cancelled');
        error.name = 'AbortError';
        reject(error);
      });

      // Start upload
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  },

  /**
   * Cancel upload by deleting file from R2
   * 
   * Note: This is called AFTER upload completes but BEFORE message is sent
   * For aborting ongoing uploads, use AbortController in uploadToR2
   */
  async cancelUpload(key, token) {
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
   * Validate file before upload
   * 
   * 🔥 UPDATED: Only validate size, not MIME type
   * Backend will handle MIME type validation with allowUnknownTypes
   */
  validateFile(file, limits) {
    if (!file || !file.size) {
      throw new Error('Invalid file');
    }

    if (limits?.maxFileSize && file.size > limits.maxFileSize) {
      const maxSizeGB = (limits.maxFileSize / 1024 / 1024 / 1024).toFixed(0);
      throw new Error(`File exceeds maximum size of ${maxSizeGB}GB`);
    }

    // 🔥 REMOVED: MIME type validation
    // Backend handles all MIME types with allowUnknownTypes flag

    return true;
  },

  /**
   * Validate batch of files
   * 
   * 🔥 UPDATED: Only validate size and count, not MIME types
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
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    if (limits?.maxBatchSize && totalSize > limits.maxBatchSize) {
      const totalGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);
      const limitGB = (limits.maxBatchSize / 1024 / 1024 / 1024).toFixed(0);
      throw new Error(`Batch total size (${totalGB}GB) exceeds limit of ${limitGB}GB`);
    }

    return true;
  },
};
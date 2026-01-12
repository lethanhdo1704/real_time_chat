// frontend/src/user/hooks/chat/useFileUpload.js

import { useState, useCallback, useRef } from 'react';
import { uploadService } from '../../services/uploadService';

/**
 * 🔥 FIXED: useFileUpload Hook - WITH PREVIEW URLS
 * 
 * PRESIGNED URL FLOW:
 * 1. Select files → Create preview URLs
 * 2. Generate presigned URLs from BE
 * 3. Upload directly to R2 with progress
 * 4. Return attachment metadata
 * 
 * File structure:
 * {
 *   id: string,           // UUID for React key
 *   file: File,           // Original File object
 *   name: string,         // Display name
 *   size: number,         // File size in bytes
 *   type: string,         // MIME type
 *   previewUrl: string,   // Blob URL for preview (CRITICAL!)
 * }
 */
export const useFileUpload = () => {
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  
  // Files state - NOW WITH PREVIEW URLs
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // Upload limits (cached)
  const [limits, setLimits] = useState(null);
  
  // AbortController for cancellation
  const abortControllersRef = useRef([]);
  const uploadStartTimeRef = useRef(null);

  /**
   * Fetch upload limits from backend (cached)
   */
  const fetchLimits = useCallback(async (token) => {
    if (limits) return limits;

    try {
      const data = await uploadService.getUploadLimits(token);
      setLimits(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch limits:', error);
      const defaultLimits = {
        maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
        maxBatchSize: 1 * 1024 * 1024 * 1024, // 1GB
        maxFilesPerBatch: 20,
      };
      setLimits(defaultLimits);
      return defaultLimits;
    }
  }, [limits]);

  /**
   * 🔥 FIXED: Select files (WITH preview URL creation)
   * 
   * Creates blob URLs for preview WITHOUT uploading
   */
  const selectFiles = useCallback(async (files, token) => {
    setUploadError(null);

    const currentLimits = await fetchLimits(token);

    try {
      // Validate batch
      uploadService.validateBatch(files, currentLimits);

      // 🔥 CRITICAL: Create preview URLs
      const preparedFiles = files.map(file => ({
        id: crypto.randomUUID(), // For React key
        file: file,              // Original File object
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: URL.createObjectURL(file), // 🔥 THIS IS THE KEY!
      }));

      console.log('✅ [useFileUpload] Files prepared with preview URLs:', {
        count: preparedFiles.length,
        files: preparedFiles.map(f => ({
          name: f.name,
          size: f.size,
          hasPreview: !!f.previewUrl,
        })),
      });

      // Append to existing files (support multiple selections)
      setSelectedFiles(prev => [...prev, ...preparedFiles]);
      
      return true;
    } catch (error) {
      console.error('❌ [useFileUpload] Validation error:', error);
      setUploadError(error.message);
      return false;
    }
  }, [fetchLimits]);

  /**
   * 🔥 FIXED: Upload files to R2
   * 
   * Extracts File objects from prepared files
   */
  const uploadFiles = useCallback(async (preparedFiles, token) => {
    if (!preparedFiles || preparedFiles.length === 0) {
      throw new Error('No files to upload');
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);
    setUploadError(null);
    
    // Reset tracking
    abortControllersRef.current = [];
    uploadStartTimeRef.current = Date.now();

    try {
      console.log(`📤 [useFileUpload] Starting upload: ${preparedFiles.length} files`);

      // Extract File objects
      const files = preparedFiles.map(pf => pf.file);

      // Step 1: Generate presigned URLs
      const urlsData = await uploadService.generateUploadUrls(files, token);
      console.log('✅ [useFileUpload] Presigned URLs generated');

      // Step 2: Upload each file to R2 (parallel)
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      const fileProgress = new Array(files.length).fill(0);

      const uploadPromises = urlsData.map(async (urlData, index) => {
        const file = files[index];
        const abortController = new AbortController();
        abortControllersRef.current.push(abortController);

        // Upload with progress tracking
        await uploadService.uploadToR2(
          file,
          urlData.uploadUrl,
          (progress) => {
            // Update this file's progress
            fileProgress[index] = progress.loaded;

            // Calculate total progress
            const totalLoaded = fileProgress.reduce((sum, p) => sum + p, 0);
            const percent = (totalLoaded / totalSize) * 100;

            // Calculate speed
            const elapsed = (Date.now() - uploadStartTimeRef.current) / 1000;
            const speed = totalLoaded / elapsed;

            setUploadProgress(percent);
            setUploadSpeed(speed);
          },
          abortController.signal
        );

        console.log(`✅ [useFileUpload] File ${index + 1}/${files.length} uploaded`);
        return urlData.metadata;
      });

      const attachments = await Promise.all(uploadPromises);

      console.log('✅ [useFileUpload] All files uploaded');
      
      setUploading(false);
      setUploadProgress(100);
      
      return attachments;

    } catch (error) {
      console.error('❌ [useFileUpload] Upload error:', error);
      
      if (error.name === 'AbortError') {
        setUploadError('Upload cancelled');
      } else {
        setUploadError(error.message);
      }
      
      setUploading(false);
      setUploadProgress(0);
      throw error;
    }
  }, []);

  /**
   * 🔥 Cancel upload
   */
  const cancelUpload = useCallback(() => {
    if (!uploading) return;

    console.log('🚫 [useFileUpload] Cancelling upload...');

    // Abort all uploads
    abortControllersRef.current.forEach(controller => {
      controller.abort();
    });

    // Reset state
    setUploading(false);
    setUploadProgress(0);
    setUploadSpeed(0);
    setUploadError('Upload cancelled');
    
    console.log('✅ [useFileUpload] Upload cancelled');
  }, [uploading]);

  /**
   * 🔥 FIXED: Clear files (WITH memory cleanup)
   * 
   * Revokes blob URLs to prevent memory leaks
   */
  const clearFiles = useCallback(() => {
    console.log('🧹 [useFileUpload] Cleaning up files...');
    
    // Revoke all preview URLs
    selectedFiles.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });

    setSelectedFiles([]);
    setUploadError(null);
    setUploadProgress(0);
    setUploadSpeed(0);
    
    console.log('✅ [useFileUpload] Files cleared');
  }, [selectedFiles]);

  /**
   * 🔥 FIXED: Remove a file (WITH memory cleanup)
   */
  const removeFile = useCallback((index) => {
    console.log(`🗑️ [useFileUpload] Removing file at index ${index}`);
    
    setSelectedFiles(prev => {
      const file = prev[index];
      
      // Revoke preview URL
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  return {
    // State
    uploading,
    uploadProgress,
    uploadSpeed,
    uploadError,
    selectedFiles,
    limits,

    // Actions
    selectFiles,
    uploadFiles,
    cancelUpload,
    clearFiles,
    removeFile,
    fetchLimits,
  };
};
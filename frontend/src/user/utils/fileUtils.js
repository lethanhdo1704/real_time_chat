// frontend/src/user/utils/fileUtils.js

/**
 * Truncate filename but keep extension visible
 * 
 * Examples:
 * - "very-long-document-name-here.docx" (35 chars)
 *   → "very-long-do...here.docx" (24 chars)
 * 
 * - "short.pdf" (9 chars)
 *   → "short.pdf" (unchanged)
 * 
 * @param {string} filename - Original filename
 * @param {number} maxLength - Maximum total length (default: 30)
 * @returns {string} Truncated filename with extension preserved
 */
export const truncateFilename = (filename, maxLength = 30) => {
  if (!filename || filename.length <= maxLength) {
    return filename;
  }
  
  const lastDotIndex = filename.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < filename.length - 1;
  
  if (!hasExtension) {
    // No extension, truncate from end
    return filename.slice(0, maxLength - 3) + '...';
  }
  
  const extension = filename.slice(lastDotIndex); // e.g., ".docx"
  const nameWithoutExt = filename.slice(0, lastDotIndex); // e.g., "very-long-document-name-here"
  
  // Calculate available space for name (excluding "..." and extension)
  const availableForName = maxLength - 3 - extension.length;
  
  if (availableForName <= 3) {
    // Extension is too long, just show "...extension"
    return '...' + extension;
  }
  
  // Split available space: 60% for start, 40% for end
  const startLength = Math.ceil(availableForName * 0.6);
  const endLength = Math.floor(availableForName * 0.4);
  
  const start = nameWithoutExt.slice(0, startLength);
  const end = nameWithoutExt.slice(-endLength);
  
  return start + '...' + end + extension;
};

/**
 * Truncate filename for small displays (mobile)
 * 
 * @param {string} filename - Original filename
 * @returns {string} Truncated filename (max 20 chars)
 */
export const truncateFilenameMobile = (filename) => {
  return truncateFilename(filename, 20);
};
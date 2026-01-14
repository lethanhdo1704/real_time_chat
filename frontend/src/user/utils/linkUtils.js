// frontend/src/user/utils/linkUtils.js

import LinkifyIt from 'linkify-it';


const linkify = new LinkifyIt();

// ✅ STRICT CONFIG - Tránh false positives như "123"
linkify
  .set({ 
    fuzzyLink: true,      // youtube.com → http://youtube.com
    fuzzyIP: false,       // Tắt fuzzy IP để tránh nhầm số
    fuzzyEmail: false,    // Tắt email detection
  })
  .tlds('com', true)      // Chỉ nhận TLDs phổ biến
  .tlds('org', true)
  .tlds('net', true)
  .tlds('io', true)
  .tlds('dev', true)
  .tlds('vn', true)
  .tlds('edu', true)
  .tlds('gov', true)
  .tlds(['ai', 'app', 'co', 'tv', 'me', 'tech', 'xyz', 'info'], true);

// ============================================
// LINK EXTRACTION
// ============================================

/**
 * Extract all valid links from text and convert to attachment format
 * 
 * ✅ STRICT VALIDATION:
 * - Must have valid TLD (.com, .org, .net, etc.)
 * - Must have valid hostname (not just numbers like "123")
 * - Filters out mailto: links
 * 
 * @param {string} text - Text to extract links from
 * @returns {Array<Object>} - Array of link attachments
 * 
 * @example
 * extractLinkAttachments("Check https://github.com and youtube.com")
 * // Returns:
 * [
 *   { url: "https://github.com", name: "github.com", mediaType: "link", ... },
 *   { url: "http://youtube.com", name: "youtube.com", mediaType: "link", ... }
 * ]
 * 
 * extractLinkAttachments("Just numbers 123 456")
 * // Returns: [] (no links detected)
 */
export const extractLinkAttachments = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  // Use linkify-it to find all links
  const matches = linkify.match(text);
  
  if (!matches || matches.length === 0) return [];
  
  // Convert to attachment format with strict validation
  const linkAttachments = matches
    .filter(match => {
      // ✅ Skip mailto: links (emails)
      if (match.schema === 'mailto:') return false;
      
      try {
        const url = match.url;
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        
        // ✅ Must have valid hostname (not empty, not just numbers)
        if (!hostname || hostname.length === 0) return false;
        
        // ✅ Reject if hostname is just numbers (like "123")
        if (/^\d+$/.test(hostname)) return false;
        
        // ✅ Must have at least one dot (domain.tld)
        if (!hostname.includes('.')) return false;
        
        // ✅ Valid TLD check (linkify-it already does this with our config)
        return true;
        
      } catch (err) {
        // Invalid URL
        return false;
      }
    })
    .map(match => {
      try {
        const url = match.url;
        const urlObj = new URL(url);
        
        return {
          url,
          name: urlObj.hostname.replace('www.', ''),
          size: 0,
          mime: 'text/url',
          mediaType: 'link',
        };
      } catch (err) {
        console.warn('[linkUtils] Invalid URL:', match.url, err);
        return null;
      }
    })
    .filter(Boolean);
  
  // Remove duplicates (same URL)
  const uniqueLinks = [];
  const seenUrls = new Set();
  
  for (const link of linkAttachments) {
    if (!seenUrls.has(link.url)) {
      seenUrls.add(link.url);
      uniqueLinks.push(link);
    }
  }
  
  return uniqueLinks;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extract domain name from URL
 * @param {string} url - Full URL
 * @returns {string} - Domain name without www
 */
export const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
};

/**
 * Check if text contains any valid URLs
 * @param {string} text - Text to check
 * @returns {boolean}
 */
export const containsLinks = (text) => {
  if (!text || typeof text !== 'string') return false;
  const matches = linkify.match(text);
  return matches && matches.length > 0;
};

/**
 * Count number of links in text
 * @param {string} text - Text to analyze
 * @returns {number}
 */
export const countLinks = (text) => {
  if (!text || typeof text !== 'string') return 0;
  const matches = linkify.match(text);
  return matches ? matches.length : 0;
};

/**
 * Get all link URLs from text (simple array of URLs)
 * @param {string} text - Text to extract from
 * @returns {Array<string>} - Array of URLs
 */
export const getLinkUrls = (text) => {
  if (!text || typeof text !== 'string') return [];
  const matches = linkify.match(text);
  return matches ? matches.map(m => m.url) : [];
};

/**
 * Test if a string is a valid URL
 * @param {string} str - String to test
 * @returns {boolean}
 */
export const isValidUrl = (str) => {
  if (!str || typeof str !== 'string') return false;
  const matches = linkify.match(str.trim());
  return matches && matches.length > 0;
};

// ============================================
// EXPORTS
// ============================================

export default {
  extractLinkAttachments,
  extractDomain,
  containsLinks,
  countLinks,
  getLinkUrls,
  isValidUrl,
};
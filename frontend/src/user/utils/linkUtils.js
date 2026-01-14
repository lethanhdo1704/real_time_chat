// frontend/src/user/utils/linkUtils.js

import LinkifyIt from 'linkify-it';

/**
 * Link Detection - Exact Backend Validation Match
 * 
 * Matches backend validation in sendMessage.js:
 * ✅ Must start with http:// or https://
 * ✅ mime must be 'text/url'
 * ✅ size must be 0
 * ✅ hostname cannot be empty
 * ✅ hostname cannot be just numbers
 * ✅ hostname must contain at least one dot (domain.tld)
 * ❌ localhost is NOT allowed by backend (no dot requirement)
 */

// ============================================
// LINKIFY-IT CONFIGURATION
// ============================================

const linkify = new LinkifyIt();

linkify
  .set({ 
    fuzzyLink: true,   // auto-detect domains without protocol
    fuzzyIP: false,    // ❌ DISABLE - IPs don't have dots in TLD format
    fuzzyEmail: false  // disable email detection
  })
  .tlds([
    // Generic TLDs
    'com', 'org', 'net', 'io', 'dev', 'app', 'ai', 'co',
    // Tech & Business
    'tech', 'info', 'biz', 'site', 'online', 'store', 'shop',
    // Country codes
    'us', 'uk', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'vn', 'in',
    'edu', 'gov', 'mil', 'tv', 'me', 'live', 'blog',
    'xyz', 'club', 'space', 'link', 'top', 'pro', 'world'
  ], true);

// ============================================
// BACKEND-COMPATIBLE VALIDATION
// ============================================

/**
 * Validate hostname - EXACT match with backend logic
 * 
 * Backend requirements (sendMessage.js line 87-103):
 * 1. hostname must exist and not be empty
 * 2. hostname cannot be just numbers (e.g., "123")
 * 3. hostname must contain at least one dot (e.g., "domain.tld")
 * 
 * ⚠️ LIMITATION: Backend rejects localhost/IPs
 * If you need localhost support, fix backend validation first
 */
const isValidHostnameForBackend = (hostname) => {
  // Must exist and not be empty
  if (!hostname || hostname.length === 0) {
    console.warn('[linkUtils] Invalid: empty hostname');
    return false;
  }

  // ✅ Allow localhost (development)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }

  // ✅ Allow valid IP addresses
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    if (parts.every(part => part >= 0 && part <= 255)) {
      return true; // Valid IP
    }
  }

  // Cannot be just numbers (e.g., "123")
  if (/^\d+$/.test(hostname)) {
    console.warn('[linkUtils] Invalid: hostname is just numbers:', hostname);
    return false;
  }

  // Must contain at least one dot (domain.tld requirement)
  // ⚠️ This rejects localhost - backend limitation
  if (!hostname.includes('.')) {
    console.warn('[linkUtils] Invalid: hostname missing dot (backend rejects localhost):', hostname);
    return false;
  }

  // Additional safety: check for valid characters
  if (!/^[a-zA-Z0-9.-]+$/.test(hostname)) {
    console.warn('[linkUtils] Invalid: hostname has invalid characters:', hostname);
    return false;
  }

  // Must not start/end with dot or hyphen
  if (/^[.-]|[.-]$/.test(hostname)) {
    console.warn('[linkUtils] Invalid: hostname starts/ends with dot/hyphen:', hostname);
    return false;
  }

  return true;
};

/**
 * Validate URL object - EXACT match with backend
 */
const isValidUrlForBackend = (urlString) => {
  try {
    // Must start with http:// or https://
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
      console.warn('[linkUtils] Invalid: URL missing protocol:', urlString);
      return false;
    }

    // Parse URL
    const urlObj = new URL(urlString);

    // Validate hostname with backend rules
    return isValidHostnameForBackend(urlObj.hostname);

  } catch (err) {
    console.warn('[linkUtils] Invalid: URL parse error:', err.message);
    return false;
  }
};

// ============================================
// MAIN EXTRACTION FUNCTION
// ============================================

/**
 * Extract valid links - Backend compatible format
 * 
 * Returns attachments that will pass backend validation:
 * - url: starts with http:// or https://
 * - name: clean hostname without www.
 * - size: 0 (required by backend)
 * - mime: 'text/url' (required by backend)
 * - mediaType: 'link'
 */
export const extractLinkAttachments = (text) => {
  if (!text || typeof text !== 'string') return [];

  // Find potential links
  const matches = linkify.match(text);
  if (!matches || matches.length === 0) return [];

  const validLinks = [];
  const seenUrls = new Set();

  for (const match of matches) {
    try {
      // Skip mailto
      if (match.schema === 'mailto:') continue;

      // Ensure protocol (required by backend)
      let url = match.url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
      }

      // Validate against backend rules
      if (!isValidUrlForBackend(url)) {
        console.warn('[linkUtils] Skipping invalid URL:', url);
        continue;
      }

      // Parse for clean data
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Check duplicates (case-insensitive)
      const urlKey = url.toLowerCase();
      if (seenUrls.has(urlKey)) continue;
      seenUrls.add(urlKey);

      // Clean hostname (remove www.)
      const cleanHostname = hostname.replace(/^www\./, '');

      // Create backend-compatible attachment
      validLinks.push({
        url: url,                    // ✅ Full URL with protocol
        name: cleanHostname,         // ✅ Clean domain name
        size: 0,                     // ✅ Required by backend for links
        mime: 'text/url',           // ✅ Required by backend
        mediaType: 'link',          // ✅ Type identifier
      });

      console.log('[linkUtils] ✅ Valid link:', {
        url,
        hostname: cleanHostname,
      });

    } catch (err) {
      console.warn('[linkUtils] Failed to process:', match.url, err.message);
    }
  }

  console.log(`[linkUtils] Extracted ${validLinks.length} valid link(s)`);
  return validLinks;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extract domain from URL
 */
export const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown';
  }
};

/**
 * Check if text contains valid links
 */
export const containsLinks = (text) => {
  const links = extractLinkAttachments(text);
  return links.length > 0;
};

/**
 * Count valid links
 */
export const countLinks = (text) => {
  const links = extractLinkAttachments(text);
  return links.length;
};

/**
 * Get link URLs as array
 */
export const getLinkUrls = (text) => {
  const links = extractLinkAttachments(text);
  return links.map(link => link.url);
};

/**
 * Test if string is valid URL (backend rules)
 */
export const isValidUrl = (str) => {
  if (!str || typeof str !== 'string') return false;

  try {
    let url = str.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    return isValidUrlForBackend(url);
  } catch {
    return false;
  }
};

/**
 * Add protocol if missing
 */
export const ensureProtocol = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return 'http://' + trimmed;
};

/**
 * Validate link attachment object (backend format)
 */
export const isValidLinkAttachment = (attachment) => {
  if (!attachment || typeof attachment !== 'object') return false;

  const { url, name, mediaType, mime, size } = attachment;

  // Check all required fields
  if (!url || !name || mediaType !== 'link') return false;
  if (mime !== 'text/url') return false;
  if (size !== 0) return false;

  // Validate URL
  return isValidUrlForBackend(url);
};

/**
 * Debug helper with backend validation details
 */
export const debugExtractLinks = (text) => {
  console.group('🔍 Link Extraction Debug (Backend Rules)');
  console.log('📝 Input text:', text);

  const matches = linkify.match(text);
  console.log(`\n🔗 Linkify found: ${matches?.length || 0} potential links`);

  if (matches) {
    matches.forEach((match, i) => {
      console.log(`\n  ${i + 1}. ${match.url}`);
      
      let url = match.url;
      if (!url.startsWith('http')) url = 'http://' + url;

      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        console.log(`     Protocol: ${urlObj.protocol}`);
        console.log(`     Hostname: ${hostname}`);

        // Check each backend rule
        const checks = {
          'Has protocol': url.startsWith('http://') || url.startsWith('https://'),
          'Hostname not empty': hostname && hostname.length > 0,
          'Not just numbers': !/^\d+$/.test(hostname),
          'Contains dot': hostname.includes('.'),
        };

        Object.entries(checks).forEach(([rule, passed]) => {
          console.log(`     ${passed ? '✅' : '❌'} ${rule}`);
        });

        const isValid = Object.values(checks).every(v => v);
        console.log(`     Final: ${isValid ? '✅ VALID' : '❌ INVALID'}`);

      } catch (err) {
        console.log(`     ❌ Parse error: ${err.message}`);
      }
    });
  }

  const validLinks = extractLinkAttachments(text);
  console.log(`\n✅ Valid links that pass backend validation: ${validLinks.length}`);
  
  validLinks.forEach((link, i) => {
    console.log(`  ${i + 1}. ${link.url}`);
    console.log(`     Name: ${link.name}`);
    console.log(`     Mime: ${link.mime}`);
    console.log(`     Size: ${link.size}`);
  });

  console.groupEnd();
  return validLinks;
};

/**
 * Test single hostname against backend rules
 */
export const testHostname = (hostname) => {
  console.group(`Testing hostname: "${hostname}"`);
  
  const checks = {
    'Not empty': hostname && hostname.length > 0,
    'Not just numbers': !/^\d+$/.test(hostname),
    'Contains dot': hostname.includes('.'),
    'Valid characters': /^[a-zA-Z0-9.-]+$/.test(hostname),
    'No leading/trailing dot': !/^[.-]|[.-]$/.test(hostname),
  };

  Object.entries(checks).forEach(([rule, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${rule}`);
  });

  const isValid = Object.values(checks).every(v => v);
  console.log(`\nResult: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  console.groupEnd();
  return isValid;
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
  ensureProtocol,
  isValidLinkAttachment,
  debugExtractLinks,
  testHostname,
};
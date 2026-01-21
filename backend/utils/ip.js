// backend/utils/ip.js

/**
 * Chuyển IP string thành số (IPv4 only)
 */
const ipToNumber = (ip) => {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  
  return parts.reduce((acc, octet) => {
    const num = parseInt(octet, 10);
    if (isNaN(num) || num < 0 || num > 255) return null;
    return (acc << 8) + num;
  }, 0);
};

/**
 * Parse CIDR notation (VD: 192.168.1.0/24)
 * Trả về { network: number, mask: number }
 */
const parseCIDR = (cidr) => {
  const [ip, prefix] = cidr.split('/');
  
  if (!prefix) {
    // Không có /prefix => IP đơn lẻ
    const ipNum = ipToNumber(ip);
    return ipNum !== null ? { network: ipNum, mask: 0xFFFFFFFF } : null;
  }

  const prefixNum = parseInt(prefix, 10);
  if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > 32) return null;

  const ipNum = ipToNumber(ip);
  if (ipNum === null) return null;

  // Tạo subnet mask
  const mask = (0xFFFFFFFF << (32 - prefixNum)) >>> 0;
  const network = ipNum & mask;

  return { network, mask };
};

/**
 * Kiểm tra IP có trong whitelist không
 * @param {string} clientIP - IP cần check
 * @param {string[]} whitelist - Mảng IP hoặc CIDR
 * @returns {boolean}
 */
export const isIPInWhitelist = (clientIP, whitelist) => {
  // Xử lý IPv6 mapped IPv4 (::ffff:192.168.1.1 => 192.168.1.1)
  let normalizedIP = clientIP;
  if (clientIP.startsWith('::ffff:')) {
    normalizedIP = clientIP.substring(7);
  }

  const clientIPNum = ipToNumber(normalizedIP);
  if (clientIPNum === null) {
    console.warn(`⚠️ Invalid client IP format: ${clientIP}`);
    return false;
  }

  // Kiểm tra từng entry trong whitelist
  for (const entry of whitelist) {
    const parsed = parseCIDR(entry);
    if (!parsed) {
      console.warn(`⚠️ Invalid whitelist entry: ${entry}`);
      continue;
    }

    const { network, mask } = parsed;

    // Check xem IP có nằm trong subnet không
    if ((clientIPNum & mask) === network) {
      return true;
    }
  }

  return false;
};

/**
 * Lấy IP thật từ request (helper function)
 */
export const getRealIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
};
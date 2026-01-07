// frontend/src/user/utils/formatLastSeen.js

/**
 * Format lastSeen timestamp into human-readable text
 * 
 * @param {Date|string|null} lastSeen - Last seen timestamp
 * @param {Function} t - i18n translation function
 * @returns {string} Formatted text
 * 
 * Examples:
 * - "Active just now" (< 1 min)
 * - "Active 5m ago" (5 minutes)
 * - "Active 2h ago" (2 hours)
 * - "Active yesterday at 14:30" (yesterday)
 * - "Active 3d ago" (3 days)
 * - "Active on 07/01/2025" (> 7 days)
 */
export function formatLastSeen(lastSeen, t = null) {
  if (!lastSeen) {
    return t ? t('presence.activeRecently') : 'Active recently';
  }
  
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  
  // Validate date
  if (isNaN(lastSeenDate.getTime())) {
    return t ? t('presence.activeRecently') : 'Active recently';
  }
  
  const diffMs = now - lastSeenDate;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Less than 1 minute (0-59 seconds)
  if (diffSeconds < 60) {
    return t ? t('presence.justNow') : 'Active just now';
  }
  
  // Less than 1 hour (1-59 minutes)
  if (diffMinutes < 60) {
    return t 
      ? t('presence.minutesAgo', { count: diffMinutes })
      : `Active ${diffMinutes}m ago`;
  }
  
  // Less than 24 hours (1-23 hours)
  if (diffHours < 24) {
    return t 
      ? t('presence.hoursAgo', { count: diffHours })
      : `Active ${diffHours}h ago`;
  }
  
  // Yesterday (24-48 hours) - with time
  if (diffDays === 1) {
    const timeStr = lastSeenDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    return t 
      ? t('presence.yesterdayAt', { time: timeStr })
      : `Active yesterday at ${timeStr}`;
  }
  
  // Less than 7 days (2-6 days)
  if (diffDays < 7) {
    return t 
      ? t('presence.daysAgo', { count: diffDays })
      : `Active ${diffDays}d ago`;
  }
  
  // More than 7 days - show full date
  const day = lastSeenDate.getDate().toString().padStart(2, '0');
  const month = (lastSeenDate.getMonth() + 1).toString().padStart(2, '0');
  const year = lastSeenDate.getFullYear();
  const dateStr = `${day}/${month}/${year}`;
  
  return t 
    ? t('presence.onDate', { date: dateStr })
    : `Active on ${dateStr}`;
}

/**
 * Get update interval in milliseconds based on how old lastSeen is
 * 
 * @param {Date|string|null} lastSeen - Last seen timestamp
 * @returns {number|null} Update interval in ms, or null if no updates needed
 * 
 * Update frequency:
 * - < 1 min: every 5 seconds (to show "just now" → "1m ago" transition)
 * - 1-59 min: every 30 seconds (more accurate minute updates)
 * - 1-23 hours: every 5 minutes (hour updates)
 * - >= 1 day: every hour (day/date updates)
 */
export function getLastSeenUpdateInterval(lastSeen) {
  if (!lastSeen) return null;
  
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  
  if (isNaN(lastSeenDate.getTime())) return null;
  
  const diffMs = now - lastSeenDate;
  const diffSeconds = diffMs / 1000;
  const diffMinutes = diffSeconds / 60;
  const diffHours = diffMinutes / 60;
  
  // Just happened: update every 5 seconds
  // WHY: Transition from "just now" to "1m ago" needs frequent updates
  if (diffSeconds < 60) {
    return 5 * 1000; // 5 seconds
  }
  
  // Recent: update every 30 seconds
  // WHY: More accurate minute counting (1m, 2m, 3m...)
  if (diffMinutes < 60) {
    return 30 * 1000; // 30 seconds
  }
  
  // Today: update every 5 minutes
  // WHY: Hour transitions don't need second-precision
  if (diffHours < 24) {
    return 5 * 60 * 1000; // 5 minutes
  }
  
  // Older: update every hour
  // WHY: Day/date changes are infrequent
  return 60 * 60 * 1000; // 1 hour
}

/**
 * 🆕 Get precise time difference
 * Useful for tooltips or detailed views
 * 
 * @param {Date|string|null} lastSeen
 * @returns {Object} { seconds, minutes, hours, days }
 */
export function getTimeDifference(lastSeen) {
  if (!lastSeen) return null;
  
  const now = new Date();
  const lastSeenDate = new Date(lastSeen);
  
  if (isNaN(lastSeenDate.getTime())) return null;
  
  const diffMs = now - lastSeenDate;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  return {
    seconds: diffSeconds,
    minutes: diffMinutes,
    hours: diffHours,
    days: diffDays,
    timestamp: lastSeenDate,
  };
}
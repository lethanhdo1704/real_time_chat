// frontend/src/user/hooks/useLastSeenFormat.js
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatLastSeen, getLastSeenUpdateInterval } from '../utils/formatLastSeen';

/**
 * Hook to format lastSeen with automatic updates and i18n support
 * 
 * Features:
 * - Auto-updates every 5s to 1h based on age
 * - Supports i18n translations
 * - Returns null when user is online
 * - Handles invalid dates gracefully
 * 
 * @param {Date|string|null} lastSeen - Last seen timestamp
 * @param {boolean} isOnline - Whether user is currently online
 * @returns {string|null} Formatted last seen text, or null if online
 * 
 * Usage:
 * ```jsx
 * const lastSeenText = useLastSeenFormat(user.lastSeen, user.isOnline);
 * // Returns: "Active 5m ago" or null if online
 * ```
 */
export function useLastSeenFormat(lastSeen, isOnline = false) {
  const { t } = useTranslation('chat');
  
  const [formattedText, setFormattedText] = useState(() => {
    // If online, don't show lastSeen
    if (isOnline) return null;
    return formatLastSeen(lastSeen, t);
  });

  useEffect(() => {
    // If online, clear lastSeen display
    if (isOnline) {
      setFormattedText(null);
      return;
    }

    // If no lastSeen, show fallback
    if (!lastSeen) {
      setFormattedText(t('presence.activeRecently', 'Active recently'));
      return;
    }

    // Initial format
    setFormattedText(formatLastSeen(lastSeen, t));

    // Setup auto-update interval
    const interval = getLastSeenUpdateInterval(lastSeen);
    
    if (!interval) {
      return; // No updates needed
    }

    // Update text at specified interval
    const timer = setInterval(() => {
      setFormattedText(formatLastSeen(lastSeen, t));
    }, interval);

    return () => clearInterval(timer);
  }, [lastSeen, isOnline, t]);

  return formattedText;
}



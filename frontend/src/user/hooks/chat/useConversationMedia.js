// frontend/src/hooks/chat/useConversationMedia.js
import { useState, useEffect, useCallback } from 'react';
import { getConversationMedia } from '../../services/chatApi';

/**
 * 🔥 UPDATED: Hook for fetching conversation media (images/videos/audios/files/links)
 * Now supports custom initial limit for 2-row loading strategy
 * 
 * ✅ Load only 2 rows initially (6 images, 4 videos, 2 audios/files/links)
 * ✅ Load more on demand
 * ✅ More efficient queries
 * ✅ Better performance
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} mediaType - Media type (image, video, audio, file, link)
 * @param {number} initialLimit - Initial number of items to load (default: 6 for 2 rows of images)
 * @returns {Object} { items, loading, error, hasMore, loadMore, refresh }
 */
export default function useConversationMedia(conversationId, mediaType, initialLimit = 6) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [oldestItemId, setOldestItemId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  /**
   * Fetch media items
   */
  const fetchMedia = useCallback(async (reset = false, customLimit = null) => {
    if (!conversationId || !mediaType) {
      console.log('⏭️ [useConversationMedia] Skip: missing conversationId or mediaType');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use customLimit if provided, otherwise use 20 for pagination
      const limit = customLimit !== null ? customLimit : 20;

      const params = {
        mediaType,
        limit,
      };

      // Use cursor for pagination (except on reset/initial load)
      if (!reset && oldestItemId) {
        params.before = oldestItemId;
      }

      console.log('🎬 [useConversationMedia] Fetching media:', {
        conversationId,
        mediaType,
        limit,
        before: params.before || 'none',
        reset,
      });

      const data = await getConversationMedia(conversationId, params);

      console.log('✅ [useConversationMedia] Received:', {
        itemsCount: data.items.length,
        hasMore: data.hasMore,
        oldestItemId: data.oldestItemId,
      });

      if (reset) {
        // Initial load or refresh
        setItems(data.items);
      } else {
        // Append for pagination
        setItems(prev => [...prev, ...data.items]);
      }

      setHasMore(data.hasMore);
      setOldestItemId(data.oldestItemId);

    } catch (err) {
      console.error('❌ [useConversationMedia] Error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, mediaType, oldestItemId]);

  /**
   * Load more items (pagination)
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      console.log('📥 [useConversationMedia] Loading more...');
      fetchMedia(false);
    }
  }, [loading, hasMore, fetchMedia]);

  /**
   * Refresh from beginning
   */
  const refresh = useCallback(() => {
    console.log('🔄 [useConversationMedia] Refreshing...');
    setOldestItemId(null);
    fetchMedia(true, initialLimit);
  }, [fetchMedia, initialLimit]);

  /**
   * Initial load and when conversationId/mediaType changes
   */
  useEffect(() => {
    if (conversationId && mediaType) {
      console.log('🔄 [useConversationMedia] Initial load or mediaType changed');
      setItems([]);
      setOldestItemId(null);
      fetchMedia(true, initialLimit);
    }
  }, [conversationId, mediaType]); // Only conversationId and mediaType trigger reload

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
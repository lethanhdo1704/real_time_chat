// frontend/src/hooks/chat/useConversationMedia.js
import { useState, useEffect, useCallback } from 'react';
import { getMessages } from '../../services/chatApi';

/**
 * Hook to load media/files/links by tab
 * Uses existing getMessages API with mediaType filter
 * 
 * Features:
 * ✅ Load messages by mediaType (image, video, audio, file, link)
 * ✅ Pagination support
 * ✅ Loading/error states
 * ✅ Auto-fetch on tab change
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} mediaType - Media type filter ('image' | 'video' | 'audio' | 'file' | 'link')
 * @returns {Object} { items, loading, error, hasMore, loadMore }
 */
export const useConversationMedia = (conversationId, mediaType) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [oldestMessageId, setOldestMessageId] = useState(null);

  // Fetch media items
  const fetchItems = async (before = null, append = false) => {
    if (!conversationId || !mediaType) {
      console.warn('⚠️ [useConversationMedia] Missing conversationId or mediaType');
      return;
    }

    console.log('📥 [useConversationMedia] Fetching:', {
      conversationId,
      mediaType,
      before,
      append,
    });

    setLoading(true);
    setError(null);

    try {
      const params = {
        mediaType,
        limit: 20,
      };

      if (before) {
        params.before = before;
      }

      const data = await getMessages(conversationId, params);

      console.log('✅ [useConversationMedia] Received:', {
        count: data.messages?.length || 0,
        hasMore: data.hasMore,
      });

      // Transform messages to extract attachments
      const mediaItems = [];
      
      data.messages.forEach((msg) => {
        if (msg.attachments && msg.attachments.length > 0) {
          msg.attachments.forEach((att) => {
            if (att.mediaType === mediaType) {
              mediaItems.push({
                id: att.id || att._id,
                messageId: msg.messageId,
                type: att.mediaType,
                url: att.url,
                thumbnailUrl: att.thumbnailUrl,
                name: att.name || att.fileName,
                size: att.size,
                duration: att.duration,
                date: msg.createdAt,
                sender: msg.sender,
              });
            }
          });
        }
      });

      console.log('📊 [useConversationMedia] Extracted items:', mediaItems.length);

      if (append) {
        setItems((prev) => [...prev, ...mediaItems]);
      } else {
        setItems(mediaItems);
      }

      setHasMore(data.hasMore);
      setOldestMessageId(data.oldestMessageId);
    } catch (err) {
      console.error('❌ [useConversationMedia] Fetch failed:', err);
      setError(err.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  // Load more (pagination)
  const loadMore = useCallback(() => {
    if (!loading && hasMore && oldestMessageId) {
      console.log('📥 [useConversationMedia] Loading more...');
      fetchItems(oldestMessageId, true);
    }
  }, [loading, hasMore, oldestMessageId, conversationId, mediaType]);

  // Auto-fetch on conversationId or mediaType change
  useEffect(() => {
    if (conversationId && mediaType) {
      console.log('🔄 [useConversationMedia] Tab changed, fetching...');
      setItems([]); // Clear previous items
      setOldestMessageId(null);
      fetchItems();
    }
  }, [conversationId, mediaType]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchItems(),
  };
};

export default useConversationMedia;
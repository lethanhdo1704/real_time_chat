// frontend/src/hooks/chat/useConversationInfo.js
import { useState, useEffect } from 'react';
import { getConversationInfo } from '../../services/chatApi';
import useChatStore from '../../store/chat/chatStore';

/**
 * Hook to fetch and manage conversation info with counters
 * Used by ConversationInfo modal
 * 
 * Features:
 * ✅ Fetches conversation info from backend
 * ✅ Updates Redux store with counters
 * ✅ Returns loading/error states
 * ✅ Auto-fetch on conversationId change
 * 
 * @param {string} conversationId - Conversation ID to fetch info for
 * @returns {Object} { info, loading, error, refetch }
 */
export const useConversationInfo = (conversationId) => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateConversation = useChatStore((state) => state.updateConversation);

  // Fetch conversation info
  const fetchInfo = async () => {
    if (!conversationId) {
      console.warn('⚠️ [useConversationInfo] No conversationId provided');
      return;
    }

    console.log('📊 [useConversationInfo] Fetching info for:', conversationId);
    setLoading(true);
    setError(null);

    try {
      const data = await getConversationInfo(conversationId);

      console.log('✅ [useConversationInfo] Info received:', {
        totalMessages: data.statistics?.totalMessages,
        sharedImages: data.statistics?.shared?.images,
      });

      // Transform backend response to match our state structure
      const transformedInfo = {
        id: data.id,
        type: data.type,
        name: data.name,
        avatar: data.avatar,
        createdAt: data.createdAt,
        counters: {
          totalMessages: data.statistics.totalMessages,
          sharedImages: data.statistics.shared.images,
          sharedVideos: data.statistics.shared.videos,
          sharedAudios: data.statistics.shared.audios,
          sharedFiles: data.statistics.shared.files,
          sharedLinks: data.statistics.shared.links,
        },
      };

      setInfo(transformedInfo);

      // 🔥 Update Redux store with counters
      updateConversation(conversationId, {
        counters: transformedInfo.counters,
      });

      console.log('✅ [useConversationInfo] Store updated with counters');
    } catch (err) {
      console.error('❌ [useConversationInfo] Fetch failed:', err);
      setError(err.message || 'Failed to load conversation info');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount or conversationId change
  useEffect(() => {
    if (conversationId) {
      fetchInfo();
    }
  }, [conversationId]);

  return {
    info,
    loading,
    error,
    refetch: fetchInfo,
  };
};

export default useConversationInfo;
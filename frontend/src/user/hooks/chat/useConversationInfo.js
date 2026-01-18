// frontend/src/hooks/chat/useConversationInfo.js - FIXED
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
 * 🔥 NEW: Returns members list for groups
 * 🔥 NEW: Returns otherParticipant for private chats
 * 🔥 NEW: Returns currentUserRole for permission checks
 * 🔥 FIXED: Properly syncs joinMode to Redux store
 * 
 * @param {string} conversationId - Conversation ID to fetch info for
 * @returns {Object} { info, members, currentUserRole, otherParticipant, loading, error, refetch }
 */
export const useConversationInfo = (conversationId) => {
  const [info, setInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [otherParticipant, setOtherParticipant] = useState(null);
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
        type: data.type,
        joinMode: data.joinMode, // ✅ Log joinMode
        messagePermission: data.messagePermission,
        totalMessages: data.statistics?.totalMessages,
        sharedImages: data.statistics?.shared?.images,
        membersCount: data.type === 'group' ? data.totalMembers : 2,
      });

      // Transform backend response to match our state structure
      const transformedInfo = {
        id: data._id,
        type: data.type,
        name: data.name,
        avatar: data.avatar,
        createdBy: data.createdBy,
        joinMode: data.joinMode || 'approval', // ✅ CRITICAL: Include joinMode with fallback
        messagePermission: data.messagePermission || 'all',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
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

      // 🔥 NEW: Handle group members
      if (data.type === 'group') {
        setMembers(data.members || []);
        setCurrentUserRole(data.currentUserRole);
        setOtherParticipant(null); // Reset for groups
        
        console.log('👥 [useConversationInfo] Group members loaded:', {
          count: data.members?.length,
          currentUserRole: data.currentUserRole,
        });
      }

      // 🔥 NEW: Handle private chat participant
      if (data.type === 'private') {
        setOtherParticipant(data.otherParticipant || null);
        setMembers([]); // Reset for private
        setCurrentUserRole(null); // No roles in private chat
        
        console.log('💬 [useConversationInfo] Private chat participant:', data.otherParticipant?.nickname);
      }

      // 🔥 FIXED: Update Redux store with ALL group settings including joinMode
      updateConversation(conversationId, {
        counters: transformedInfo.counters,
        joinMode: transformedInfo.joinMode, // ✅ CRITICAL: Must sync joinMode
        messagePermission: transformedInfo.messagePermission, // ✅ Also sync message permission
        ...(data.type === 'group' && {
          members: data.members,
          totalMembers: data.totalMembers,
          currentUserRole: data.currentUserRole,
        }),
        ...(data.type === 'private' && {
          otherParticipant: data.otherParticipant,
        }),
      });

      console.log('✅ [useConversationInfo] Store updated with:', {
        joinMode: transformedInfo.joinMode,
        messagePermission: transformedInfo.messagePermission,
        countersUpdated: true,
        membersUpdated: data.type === 'group',
      });
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
    } else {
      // Reset state when conversationId is cleared
      setInfo(null);
      setMembers([]);
      setCurrentUserRole(null);
      setOtherParticipant(null);
      setError(null);
    }
  }, [conversationId]);

  return {
    info,
    members,               // 🔥 NEW: Array of group members
    totalMembers: members.length, // 🔥 NEW: Total member count
    currentUserRole,       // 🔥 NEW: Current user's role (owner/admin/member)
    otherParticipant,      // 🔥 NEW: Other participant in private chat
    loading,
    error,
    refetch: fetchInfo,
  };
};

export default useConversationInfo;
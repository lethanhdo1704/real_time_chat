// frontend/src/hooks/chat/useRestoreChatFromUrl.js - FULL CODE FIXED

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import useChatStore from "../../store/chat/chatStore";
import api from "../../services/api";

/**
 * useRestoreChatFromUrl Hook
 * 
 * ✅ Restore conversation state from URL parameter
 * ✅ Fetch conversation details from backend
 * ✅ Handle both private and group chats
 * ✅ Set active conversation and friend
 * ✅ Graceful error handling
 */
export default function useRestoreChatFromUrl() {
  const { conversationId } = useParams();

  useEffect(() => {
    if (!conversationId) {
      console.log('🔄 [useRestoreChatFromUrl] No conversationId, skipping');
      return;
    }

    console.log('🔄 [useRestoreChatFromUrl] START restore:', conversationId);

    let cancelled = false;

    const restore = async () => {
      try {
        console.log('🌐 [useRestoreChatFromUrl] Fetching conversation:', conversationId);
        
        // ✅ Call API to get conversation detail
        const response = await api.get(`/conversations/${conversationId}`);
        
        if (cancelled) {
          console.log('⚠️ [useRestoreChatFromUrl] Request cancelled');
          return;
        }

        console.log('✅ [useRestoreChatFromUrl] Raw response:', response.data);

        // ✅ Extract conversation from response
        // Backend returns: { success: true, data: {...} }
        const conversation = response.data.data || response.data;
        
        console.log('✅ [useRestoreChatFromUrl] Conversation loaded:', {
          conversationId: conversation.conversationId || conversation._id,
          type: conversation.type,
          hasFriend: !!conversation.friend,
          hasMembers: !!conversation.members,
        });

        // ✅ Get store instance
        const store = useChatStore.getState();
        
        // ✅ Add or update conversation in store
        if (!store.conversations.has(conversationId)) {
          console.log('➕ [useRestoreChatFromUrl] Adding conversation to store');
          store.addConversation(conversation);
        } else {
          console.log('♻️ [useRestoreChatFromUrl] Updating existing conversation');
          store.updateConversation(conversationId, conversation);
        }
        
        // ✅ Set active conversation ID
        store.setActiveConversation(conversationId);

        // ✅ Set active friend if private chat
        if (conversation.type === 'private' && conversation.friend) {
          console.log('👤 [useRestoreChatFromUrl] Setting active friend:', conversation.friend.nickname);
          store.setActiveFriend(conversation.friend);
        } else if (conversation.type === 'group') {
          console.log('👥 [useRestoreChatFromUrl] Group chat - no active friend');
          store.setActiveFriend(null);
        }

        console.log('✅ [useRestoreChatFromUrl] Restore complete');

      } catch (err) {
        if (cancelled) return;

        console.error('❌ [useRestoreChatFromUrl] Restore failed:', {
          status: err?.status || err?.response?.status,
          message: err?.message || err?.response?.data?.message,
          conversationId,
          error: err
        });

        // ✅ Clear state on error (but keep URL intact)
        const store = useChatStore.getState();
        store.setActiveConversation(null);
        store.setActiveFriend(null);
        
        // Don't redirect - let user see error and try refresh
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);
}
// frontend/src/components/FriendFeature/FriendList.jsx
import { useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import ConversationItem from "../Chat/ConversationItem";
import useChatStore from "../../store/chatStore";
import useFriendStore from "../../store/friendStore";
import useFriendActions from "../../hooks/useFriendActions";
import { checkConversation } from "../../services/chatApi";

/**
 * FriendList Component - ✅ UPDATED WITH CHECK CONVERSATION API
 * 
 * New Flow:
 * 1. User clicks friend
 * 2. Call BE API to check if conversation exists
 * 3. If exists → Navigate to /friends/:conversationId
 * 4. If not exists → Lazy mode (call onSelectFriend)
 */
export default function FriendList({ currentUser, onSelectFriend }) {
  const { t } = useTranslation("friendFeature");
  const hasFetchedRef = useRef(false);

  // ============================================
  // GET STATE FROM STORES
  // ============================================

  const friends = useFriendStore((state) => state.friends);

  const conversationsMap = useChatStore((state) => state.conversations);
  const conversationsOrder = useChatStore((state) => state.conversationsOrder);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  
  const conversations = useMemo(() => {
    return conversationsOrder
      .map((id) => conversationsMap.get(id))
      .filter(Boolean);
  }, [conversationsOrder, conversationsMap]);

  // ============================================
  // GET ACTIONS FROM HOOK
  // ============================================
  
  const {
    loading,
    error,
    loadFriendsData
  } = useFriendActions();

  // ============================================
  // HELPER: GET CONVERSATION FOR FRIEND
  // ============================================

  const getConversationForFriend = useCallback((friendUid) => {
    return conversations.find((conv) => {
      if (conv.type === "private") {
        return conv.friend?.uid === friendUid;
      }
      return false;
    });
  }, [conversations]);

  // ============================================
  // SORT FRIENDS BY CONVERSATION PRIORITY
  // ============================================

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const convA = getConversationForFriend(a.uid);
      const convB = getConversationForFriend(b.uid);

      // 1. Unread messages first
      const unreadA = convA?.unreadCount || 0;
      const unreadB = convB?.unreadCount || 0;
      if (unreadA > 0 && unreadB === 0) return -1;
      if (unreadA === 0 && unreadB > 0) return 1;

      // 2. Sort by lastMessageAt
      const timeA = convA?.lastMessageAt ? new Date(convA.lastMessageAt) : null;
      const timeB = convB?.lastMessageAt ? new Date(convB.lastMessageAt) : null;
      if (timeA && timeB) return timeB - timeA;
      if (timeA) return -1;
      if (timeB) return 1;

      // 3. Alphabetical by name
      const nameA = a.nickname || a.uid || "";
      const nameB = b.nickname || b.uid || "";
      return nameA.localeCompare(nameB);
    });
  }, [friends, getConversationForFriend]);

  // ============================================
  // 🔥 NEW: HANDLE FRIEND SELECTION WITH API CHECK
  // ============================================

  const handleSelectFriend = useCallback(async (friend) => {
    try {
      console.log('🔍 [FriendList] Checking conversation with friend:', friend.uid);

      // 🔥 STEP 1: Call backend to check if conversation exists
      const result = await checkConversation(friend.uid);

      console.log('✅ [FriendList] Check result:', result);

      if (result.exists && result.conversationId) {
        // 🔥 CASE A: Conversation exists → Navigate directly
        console.log('📍 [FriendList] Conversation exists, navigating to:', result.conversationId);
        
        // Call parent handler with conversation info
        if (onSelectFriend) {
          onSelectFriend({
            ...friend,
            conversationId: result.conversationId,
            conversationExists: true,
          });
        }
      } else {
        // 🔥 CASE B: No conversation → Lazy mode
        console.log('💤 [FriendList] No conversation, entering lazy mode');
        
        // Call parent handler with friend info only
        if (onSelectFriend) {
          onSelectFriend({
            uid: friend.uid,
            _id: friend._id,
            nickname: friend.nickname,
            avatar: friend.avatar,
            fullName: friend.fullName,
            status: friend.status,
            conversationExists: false,
          });
        }
      }
    } catch (error) {
      console.error('❌ [FriendList] Failed to check conversation:', error);
      
      // Fallback: Use lazy mode on error
      if (onSelectFriend) {
        onSelectFriend({
          uid: friend.uid,
          _id: friend._id,
          nickname: friend.nickname,
          avatar: friend.avatar,
          fullName: friend.fullName,
          status: friend.status,
          conversationExists: false,
        });
      }
    }
  }, [onSelectFriend]);

  // ============================================
  // MANUAL RETRY HANDLER
  // ============================================

  const handleRetry = useCallback(() => {
    hasFetchedRef.current = false;
    loadFriendsData();
  }, [loadFriendsData]);

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <svg
          className="w-12 h-12 mx-auto text-red-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <button
          onClick={handleRetry}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors"
        >
          {t("friendList.retry") || "Try again"}
        </button>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <svg
          className="w-16 h-16 mx-auto text-gray-300 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        <p className="text-gray-500 text-sm">{t("friendList.empty.title")}</p>
        <p className="text-gray-400 text-xs mt-1">
          {t("friendList.empty.subtitle")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sortedFriends.map((friend) => {
        const conversation = getConversationForFriend(friend.uid);
        const isActive = conversation?._id === activeConversationId;

        return (
          <ConversationItem
            key={friend._id || friend.uid}
            conversation={conversation}
            friend={friend}
            isActive={isActive}
            currentUserId={currentUser?.uid}
            onClick={() => handleSelectFriend(friend)}
          />
        );
      })}
    </div>
  );
}
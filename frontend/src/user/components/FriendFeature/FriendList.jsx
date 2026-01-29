// frontend/src/components/FriendFeature/FriendList.jsx - OPTIMIZED VERSION
import { useEffect, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import ConversationItem from "../Chat/ConversationItem";
import useChatStore from "../../store/chat/chatStore";
import useFriendStore from "../../store/friendStore";
import useFriendActions from "../../hooks/friends/useFriendActions";
import { checkConversation } from "../../services/chatApi";

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
  // ✅ OPTIMIZED: STABLE HELPER FUNCTION
  // ============================================

  const getConversationForFriend = useCallback((friendUid) => {
    return conversations.find((conv) => {
      if (conv.type === "private") {
        return conv.friend?.uid === friendUid;
      }
      return false;
    });
  }, [conversations]); // ✅ Only recreate when conversations array changes

  // ============================================
  // 🔥 OPTIMIZED SORTING - Pre-compute values
  // ============================================

  const sortedFriends = useMemo(() => {
    // ✅ Build lookup maps ONCE to avoid repeated computations
    const convMap = new Map();
    const timeMap = new Map();
    
    friends.forEach(friend => {
      const conv = getConversationForFriend(friend.uid);
      convMap.set(friend.uid, conv);
      
      // ✅ Parse time ONCE and store as timestamp (number)
      if (conv?.lastMessage?.createdAt) {
        timeMap.set(friend.uid, new Date(conv.lastMessage.createdAt).getTime());
      } else if (conv?.lastMessageAt) {
        timeMap.set(friend.uid, new Date(conv.lastMessageAt).getTime());
      }
    });
    
    return [...friends].sort((a, b) => {
      const timeA = timeMap.get(a.uid);
      const timeB = timeMap.get(b.uid);

      // ============================================
      // 🔥 PRIORITY 1: lastMessageAt (NEWEST FIRST)
      // ============================================
      
      // Both have messages → Compare timestamps (numbers, not Date objects)
      if (timeA && timeB) {
        const timeDiff = timeB - timeA; // NEWEST FIRST
        
        // ============================================
        // 🔥 PRIORITY 2: unreadCount (IF SAME TIME)
        // ============================================
        if (timeDiff === 0) {
          const convA = convMap.get(a.uid);
          const convB = convMap.get(b.uid);
          const unreadA = convA?.unreadCount || 0;
          const unreadB = convB?.unreadCount || 0;
          
          if (unreadA > 0 && unreadB === 0) return -1;
          if (unreadA === 0 && unreadB > 0) return 1;
          
          return 0;
        }
        
        return timeDiff;
      }

      // Only A has message → A comes first
      if (timeA) return -1;
      
      // Only B has message → B comes first
      if (timeB) return 1;

      // ============================================
      // 🔥 PRIORITY 3: Alphabetical (NO MESSAGES)
      // ============================================
      const nameA = a.nickname || a.fullName || a.uid || "";
      const nameB = b.nickname || b.fullName || b.uid || "";
      return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
    });
  }, [friends, getConversationForFriend]);

  // ============================================
  // 🔥 OPTIMIZED: CACHE-FIRST FRIEND SELECTION
  // ============================================

  const handleSelectFriend = useCallback(async (friend) => {
    // ============================================
    // ✅ STEP 1: Check store cache FIRST (fast path)
    // ============================================
    const existingConv = getConversationForFriend(friend.uid);
    
    if (existingConv) {
      // ✅ Conversation already in store → Navigate immediately
      console.log('⚡ [FriendList] Using cached conversation:', existingConv.conversationId || existingConv._id);
      
      if (onSelectFriend) {
        onSelectFriend({
          ...friend,
          conversationId: existingConv.conversationId || existingConv._id,
          conversationExists: true,
        });
      }
      return; // ✅ Early exit - no API call needed
    }

    // ============================================
    // ✅ STEP 2: Cache miss → Check API (slow path)
    // ============================================
    try {
      console.log('🔍 [FriendList] No cached conversation, checking API for friend:', friend.uid);

      // 🔥 Call backend to check if conversation exists
      const result = await checkConversation(friend.uid);

      console.log('✅ [FriendList] API check result:', result);

      if (result.exists && result.conversationId) {
        // 🔥 CASE A: Conversation exists on server → Navigate
        console.log('📍 [FriendList] Conversation exists on server, navigating to:', result.conversationId);
        
        if (onSelectFriend) {
          onSelectFriend({
            ...friend,
            conversationId: result.conversationId,
            conversationExists: true,
          });
        }
      } else {
        // 🔥 CASE B: No conversation → Lazy mode
        console.log('💤 [FriendList] No conversation exists, entering lazy mode');
        
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
  }, [onSelectFriend, getConversationForFriend]); // ✅ Stable dependencies

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
    <div className="flex flex-col flex-1 bg-white">
      {sortedFriends.map((friend) => {
        const conversation = getConversationForFriend(friend.uid);
        
        // 🔥 FIX: Normalize conversation ID for comparison
        const conversationId = conversation?.conversationId || conversation?._id;
        const isActive = conversationId === activeConversationId;

        // Debug log (uncomment to debug)
        // console.log('🔍 [FriendList] Render friend:', {
        //   friendNickname: friend.nickname,
        //   conversationId,
        //   activeConversationId,
        //   isActive
        // });

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
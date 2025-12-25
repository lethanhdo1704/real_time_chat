// frontend/src/components/FriendFeature/FriendList.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { getFriendsAndRequests } from "../../services/friendService";
import { useTranslation } from "react-i18next";
import ConversationItem from "../Chat/ConversationItem";
import useChatStore from "../../store/chatStore";

/**
 * FriendList Component
 * 
 * Displays friends with conversation preview
 * Uses Zustand store for conversations (updated by useConversations hook)
 * Sorts by: unread > lastMessageAt > name
 */
export default function FriendList({ currentUser, onSelectFriend }) {
  const { t } = useTranslation("friendFeature");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // GET CONVERSATIONS FROM STORE (FIXED SELECTOR)
  // ============================================

  // ✅ Get primitives separately
  const conversationsMap = useChatStore((state) => state.conversations);
  const conversationsOrder = useChatStore((state) => state.conversationsOrder);
  
  // ✅ Convert to array using useMemo
  const conversations = useMemo(() => {
    return conversationsOrder
      .map((id) => conversationsMap.get(id))
      .filter(Boolean);
  }, [conversationsOrder, conversationsMap]);
  
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  // ============================================
  // FETCH FRIENDS
  // ============================================

  const fetchFriends = useCallback(async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    setError(null);
    
    try {
      const data = await getFriendsAndRequests();
      setFriends(data.friends || []);
    } catch (err) {
      console.error("Error fetching friends:", err);
      setError(err.message);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // ============================================
  // HELPER: GET CONVERSATION FOR FRIEND
  // ============================================

  const getConversationForFriend = useCallback((friendUid) => {
    return conversations.find((conv) => {
      if (conv.type === "private") {
        // Check if conversation is with this friend
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
  // HANDLE FRIEND SELECTION
  // ============================================

  const handleSelectFriend = useCallback((friend) => {
    if (onSelectFriend) {
      onSelectFriend({
        uid: friend.uid,
        _id: friend._id,
        nickname: friend.nickname,
        avatar: friend.avatar,
      });
    }
  }, [onSelectFriend]);

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
          onClick={fetchFriends}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
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
            key={friend._id}
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
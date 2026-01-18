// frontend/src/components/FriendFeature/GroupList.jsx - FIXED VERSION

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import useChatStore from "../../store/chat/chatStore";
import CreateGroupModal from "./CreateGroupModal";
import AvatarImage from "../common/AvatarImage";

/**
 * GroupList Component - FIXED
 * 
 * ✅ Fetch groups from Redux store (conversations)
 * ✅ Filter type='group' only
 * ✅ Navigate to chat on click
 * ✅ Show unread count
 * ✅ Create group modal
 * ✅ FIXED: Proper key props with fallback
 * ✅ FIXED: Better null safety
 * ✅ FIXED: Removed duplicate isActive declaration
 */
export default function GroupList({ currentUser }) {
  const { t } = useTranslation("friendFeature");
  const navigate = useNavigate();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // ============================================
  // GET STATE FROM STORES (learned from FriendList)
  // ============================================

  // Get conversations from store
  const conversations = useChatStore((state) => state.conversations);
  const conversationsOrder = useChatStore((state) => state.conversationsOrder);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const fetchConversationsOnce = useChatStore((state) => state.fetchConversationsOnce);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  // ✅ FIXED: Better filtering with null safety + debugging
  const groups = conversationsOrder
    .map((id) => {
      const conv = conversations.get(id);
      
      // 🔍 DEBUG: Log what we're getting
      if (conv && conv.type === 'group') {
        console.log('🔍 [GroupList] Found group in store:', {
          orderId: id,
          convId: conv._id,
          conversationId: conv.conversationId,
          name: conv.name,
          type: conv.type,
        });
      }
      
      return conv;
    })
    .filter((conv) => {
      // Filter out null/undefined
      if (!conv) {
        return false;
      }
      
      // Must be group type
      if (conv.type !== 'group') {
        return false;
      }
      
      // Not deleted
      if (conv.isDeleted) {
        console.warn('⚠️ [GroupList] Group is deleted:', conv._id || conv.conversationId);
        return false;
      }
      
      // ✅ CRITICAL: Must have valid ID for key prop
      const groupId = conv._id || conv.conversationId;
      if (!groupId) {
        console.error('❌ [GroupList] Group without ID:', conv);
        return false;
      }
      
      return true;
    });

  // Fetch conversations on mount
  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      try {
        await fetchConversationsOnce();
      } catch (err) {
        console.error("❌ [GroupList] Error fetching groups:", err);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [fetchConversationsOnce]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSelectGroup = (group) => {
    const groupId = group._id || group.conversationId;
    
    // ✅ CRITICAL: Validate groupId before navigating
    if (!groupId) {
      console.error('❌ [GroupList] Cannot select group without ID:', group);
      return;
    }
    
    console.log('📍 [GroupList] Selecting group:', {
      id: groupId,
      name: group.name,
      fullGroup: group,
    });
    
    // Set active conversation
    setActiveConversation(groupId);
    
    // Navigate to chat
    navigate(`/groups/${groupId}`);
  };

  const handleCreateSuccess = (newGroup) => {
    console.log('✅ [GroupList] Group created:', newGroup);
    
    // Navigate to new group
    const groupId = newGroup._id || newGroup.conversationId;
    
    if (groupId) {
      setActiveConversation(groupId);
      navigate(`/groups/${groupId}`);
    } else {
      console.error('❌ [GroupList] Created group has no ID:', newGroup);
    }
  };

  // ============================================
  // FORMAT HELPERS
  // ============================================

  const formatLastMessageTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / 1000 / 60);
    
    if (diffInMinutes < 1) return t("groupList.justNow");
    if (diffInMinutes < 60) return `${diffInMinutes}${t("groupList.minutesAgo")}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}${t("groupList.hoursAgo")}`;
    return `${Math.floor(diffInMinutes / 1440)}${t("groupList.daysAgo")}`;
  };

  const truncateMessage = (message, maxLength = 40) => {
    if (!message) return t("groupList.noMessages");
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // ============================================
  // RENDER: Loading
  // ============================================

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // ============================================
  // RENDER: Main
  // ============================================

  return (
    <div className="space-y-3">
      {/* Create Group Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm font-medium cursor-pointer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {t("groupList.createButton")}
      </button>

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-sm">{t("groupList.empty.title")}</p>
          <p className="text-gray-400 text-xs mt-1">{t("groupList.empty.subtitle")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            // 🔥 Normalize conversation ID (learned from FriendList)
            const groupId = group._id || group.conversationId;
            const lastMessage = group.lastMessage?.content || '';
            const lastMessageTime = group.lastMessageAt || group.updatedAt;
            const unreadCount = group.unreadCount || 0;
            const memberCount = group.members?.length || 0;
            const groupName = group.name || t("groupList.unnamedGroup");

            // ✅ CRITICAL: Skip if no valid ID (shouldn't happen after filter, but safety check)
            if (!groupId) {
              console.warn('⚠️ [GroupList] Skipping group without ID in map:', group);
              return null;
            }

            // 🔥 FIX: Normalize conversation ID for comparison (learned from FriendList)
            const isActive = groupId === activeConversationId;

            return (
              <div
                key={groupId} // ✅ FIXED: Guaranteed unique key
                onClick={() => handleSelectGroup(group)}
                className={`flex items-center p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer group ${
                  isActive 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className="relative shrink-0">
                  <AvatarImage
                    avatar={group.avatar}
                    nickname={groupName}
                    avatarUpdatedAt={group.avatarUpdatedAt}
                    size="md"
                    variant="group"
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 ml-3 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {groupName}
                    </p>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">
                      {formatLastMessageTime(lastMessageTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {truncateMessage(lastMessage)}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 ml-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {memberCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// frontend/src/pages/Home.jsx
import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ChatWindow from "../components/Chat/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import { Sidebar, HomeEmptyChat, CopyToast } from "../components/Home";
import { useFriendRequestCount } from "../hooks/useFriendRequestCount";
import { useHomeChat } from "../hooks/useHomeChat";
import { useCopyToast } from "../hooks/useCopyToast";
import { useGlobalSocket } from "../hooks/useGlobalSocket";
import useInitFriends from "../hooks/useInitFriends";
import useChatStore from "../store/chatStore";
import useFriendStore from "../store/friendStore";
import useRestoreChatFromUrl from "../hooks/chat/useRestoreChatFromUrl";

/**
 * Home Component
 *
 * ✅ FIXED: Use handleSelectConversation to properly set store state
 * Best practice: Reuse existing hook instead of direct store manipulation
 */
export default function Home() {
  const { t } = useTranslation("home");
  const { user, logout, loading, token } = useContext(AuthContext);
  useInitFriends(user);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const location = useLocation();
  useRestoreChatFromUrl();
  const { count: requestCount, setCount: setRequestCount } =
    useFriendRequestCount(user);
  const { showToast, triggerToast, hideToast } = useCopyToast(2000);

  const {
    conversations,
    loading: loadingConversations,
    selectedConversation,
    handleSelectConversation,
    updateConversationFromSocket,
    markConversationAsRead,
    reloadConversations,
    addConversation,
  } = useHomeChat();

  const activeTab = location.pathname.split("/")[1] || "friends";
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId
  );
  const activeFriend = useChatStore((state) => state.activeFriend);
  const friends = useFriendStore((state) => state.friends);

  // ============================================
  // SET CURRENT USER IN STORE
  // ============================================

  useEffect(() => {
    if (user) {
      // Set current user in chat store
      useChatStore.getState().setCurrentUser(user);
      console.log("👤 [Home] Current user set:", user.uid);
    } else {
      // 🔥 Clear stores when no user (edge case protection)
      console.log("🧹 [Home] No user, clearing stores...");
      useChatStore.getState().resetStore();
      useFriendStore.getState().reset();
    }
  }, [user]);

  // ============================================
  // GLOBAL MESSAGE HANDLER
  // ============================================

  const handleGlobalMessage = useCallback(
    (data) => {
      console.log("🏠 [Home] Global message received:", {
        conversationId: data.conversationId,
        from: data.message.sender?.nickname,
        unreadCount: data.conversationUpdate?.unreadCount,
      });

      updateConversationFromSocket(
        data.conversationId,
        data.conversationUpdate
      );
    },
    [updateConversationFromSocket]
  );

  useGlobalSocket({
    onMessageReceived: handleGlobalMessage,
  });

  // ============================================
  // REDIRECT IF NOT LOGGED IN
  // ============================================

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">{t("home.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ============================================
  // 🔥 HANDLERS - BEST PRACTICE VERSION
  // ============================================

  /**
   * Handle selecting existing conversation from sidebar
   */
  const handleSelectConversationWithRoute = useCallback(
    (conversation) => {
      if (!conversation) return;

      // Clear activeFriend when selecting EXISTING conversation
      useChatStore.getState().setActiveFriend(null);

      const tab = conversation.type === "group" ? "groups" : "friends";
      const convId = conversation.conversationId || conversation._id;
      navigate(`/${tab}/${convId}`);
    },
    [navigate]
  );

  /**
   * 🔥 BEST PRACTICE: Handle friend selection using handleSelectConversation hook
   * This ensures proper store state management and marks conversation as read
   */
  const handleSelectFriend = useCallback(
    (friendInfo) => {
      console.log("👤 [Home] Friend selected:", {
        nickname: friendInfo.nickname || friendInfo.uid,
        conversationExists: friendInfo.conversationExists,
        conversationId: friendInfo.conversationId,
      });

      if (friendInfo.conversationExists && friendInfo.conversationId) {
        // 🔥 CASE A: Conversation exists → Use handleSelectConversation
        console.log(
          "✅ [Home] Navigating to existing conversation:",
          friendInfo.conversationId
        );

        // Try to find conversation in store
        const conversation = conversations.find(
          (c) => (c.conversationId || c._id) === friendInfo.conversationId
        );

        if (conversation) {
          // ✅ Use existing hook (handles setActiveConversation + markAsRead)
          console.log(
            "📋 [Home] Found conversation in store, using handleSelectConversation"
          );
          handleSelectConversation(conversation);
        } else {
          // ✅ Create placeholder conversation object
          console.log("🧩 [Home] Creating placeholder conversation");
          handleSelectConversation({
            _id: friendInfo.conversationId,
            conversationId: friendInfo.conversationId,
            type: "private",
            friend: {
              uid: friendInfo.uid,
              _id: friendInfo._id,
              nickname: friendInfo.nickname,
              avatar: friendInfo.avatar,
              fullName: friendInfo.fullName,
              status: friendInfo.status,
            },
            unreadCount: 0,
          });
        }

        // Set activeFriend as fallback for ChatWindow header
        useChatStore.getState().setActiveFriend({
          uid: friendInfo.uid,
          _id: friendInfo._id,
          nickname: friendInfo.nickname,
          avatar: friendInfo.avatar,
          fullName: friendInfo.fullName,
          status: friendInfo.status,
        });

        // Navigate to conversation route
        navigate(`/friends/${friendInfo.conversationId}`);
      } else {
        // 🔥 CASE B: No conversation → Lazy mode
        console.log("💤 [Home] Entering lazy mode (no conversation yet)");

        // Set activeFriend for lazy mode
        useChatStore.getState().setActiveFriend({
          uid: friendInfo.uid,
          _id: friendInfo._id,
          nickname: friendInfo.nickname,
          avatar: friendInfo.avatar,
          fullName: friendInfo.fullName,
          status: friendInfo.status,
        });

        // Clear conversation ID (important for lazy mode)
        handleSelectConversation(null);

        // Stay on /friends route (no conversationId)
        if (location.pathname !== "/friends") {
          navigate("/friends");
        }
      }
    },
    [navigate, location, conversations, handleSelectConversation]
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <CopyToast
        show={showToast}
        onClose={hideToast}
        message={t("home.toast.copiedUID")}
      />

      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab) => navigate(`/${tab}`)}
        requestCount={requestCount}
        handleLogout={() => {
          logout();
          navigate("/login");
        }}
        handleCopyUID={triggerToast}
        updateRequestCount={setRequestCount}
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversationWithRoute}
        onSelectFriend={handleSelectFriend}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}

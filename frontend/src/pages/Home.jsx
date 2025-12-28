// frontend/src/pages/Home.jsx - MOBILE WITH BOTTOM NAV (NO HAMBURGER)
import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ChatWindow from "../components/Chat/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import NavigationColumn from "../components/Home/NavigationColumn";
import ContextPanel from "../components/Home/ContextPanel";
import BottomNavigation from "../components/Home/BottomNavigation";
import { useFriendRequestCount } from "../hooks/useFriendRequestCount";
import { useHomeChat } from "../hooks/useHomeChat";
import { useGlobalSocket } from "../hooks/useGlobalSocket";
import useInitFriends from "../hooks/useInitFriends";
import useChatStore from "../store/chatStore";
import useFriendStore from "../store/friendStore";
import useRestoreChatFromUrl from "../hooks/chat/useRestoreChatFromUrl";

/**
 * Home Component - Responsive Layout with Bottom Navigation
 * 
 * Desktop (≥ 768px): 3-column fixed layout
 * - Column 1: NavigationColumn (64px)
 * - Column 2: ContextPanel (320px)
 * - Column 3: ChatWindow (flex-1)
 * 
 * Mobile (< 768px): Bottom Navigation + Smart Views
 * - NO conversation: Show ContextPanel (list view) + Bottom Nav
 * - HAS conversation: Show ChatWindow (full-width) + NO Bottom Nav
 * - Bottom Navigation replaces hamburger menu
 */
export default function Home() {
  const { t } = useTranslation("home");
  const { user, logout, loading } = useContext(AuthContext);
  useInitFriends(user);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const location = useLocation();
  useRestoreChatFromUrl();

  const unseenRequestCount = useFriendStore((state) => state.unseenCount);
  const { count: requestCount, setCount: setRequestCount } = useFriendRequestCount(user);

  const {
    conversations,
    handleSelectConversation,
    updateConversationFromSocket,
  } = useHomeChat();

  const activeTab = location.pathname.split("/")[1] || "friends";
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const activeFriend = useChatStore((state) => state.activeFriend);

  // Check if we're in a conversation (mobile behavior control)
  const hasActiveConversation = !!conversationId || !!activeConversationId || !!activeFriend;

  // ============================================
  // SET CURRENT USER IN STORE
  // ============================================

  useEffect(() => {
    if (user) {
      useChatStore.getState().setCurrentUser(user);
      console.log("👤 [Home] Current user set:", user.uid);
    } else {
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
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 font-semibold text-lg">{t("home.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ============================================
  // HANDLERS
  // ============================================

  const handleTabChange = useCallback((tab) => {
    navigate(`/${tab}`);
  }, [navigate]);

  const handleSelectConversationWithRoute = useCallback(
    (conversation) => {
      if (!conversation) return;

      useChatStore.getState().setActiveFriend(null);

      const tab = conversation.type === "group" ? "groups" : "friends";
      const convId = conversation.conversationId || conversation._id;
      navigate(`/${tab}/${convId}`);
    },
    [navigate]
  );

  const handleSelectFriend = useCallback(
    (friendInfo) => {
      console.log("👤 [Home] Friend selected:", {
        nickname: friendInfo.nickname || friendInfo.uid,
        conversationExists: friendInfo.conversationExists,
        conversationId: friendInfo.conversationId,
      });

      if (friendInfo.conversationExists && friendInfo.conversationId) {
        const conversation = conversations.find(
          (c) => (c.conversationId || c._id) === friendInfo.conversationId
        );

        if (conversation) {
          handleSelectConversation(conversation);
        } else {
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

        useChatStore.getState().setActiveFriend({
          uid: friendInfo.uid,
          _id: friendInfo._id,
          nickname: friendInfo.nickname,
          avatar: friendInfo.avatar,
          fullName: friendInfo.fullName,
          status: friendInfo.status,
        });

        navigate(`/friends/${friendInfo.conversationId}`);
      } else {
        useChatStore.getState().setActiveFriend({
          uid: friendInfo.uid,
          _id: friendInfo._id,
          nickname: friendInfo.nickname,
          avatar: friendInfo.avatar,
          fullName: friendInfo.fullName,
          status: friendInfo.status,
        });

        handleSelectConversation(null);

        if (location.pathname !== "/friends") {
          navigate("/friends");
        }
      }
    },
    [navigate, location, conversations, handleSelectConversation]
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      
      {/* ===============================================
          DESKTOP LAYOUT (≥ 768px)
          - Always show 3 columns side by side
          =============================================== */}
      
      {/* Column 1: Navigation - Desktop only */}
      <div className="hidden md:flex">
        <NavigationColumn
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unseenRequestCount={unseenRequestCount}
          onLogout={handleLogout}
        />
      </div>

      {/* Column 2: Context Panel - Desktop only */}
      <div className="hidden md:flex">
        <ContextPanel
          activeTab={activeTab}
          user={user}
          onSelectFriend={handleSelectFriend}
          onSelectConversation={handleSelectConversationWithRoute}
          onUpdateRequestCount={setRequestCount}
        />
      </div>

      {/* Column 3: Chat Window - Desktop always visible */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <ChatWindow />
      </div>

      {/* ===============================================
          MOBILE LAYOUT (< 768px)
          - Conditional rendering based on conversation state
          =============================================== */}

      {/* MOBILE: List View (when NO conversation) */}
      {!hasActiveConversation && (
        <div className="flex flex-col md:hidden w-full h-full pb-16">
          {/* pb-16 = space for bottom navigation */}
          <ContextPanel
            activeTab={activeTab}
            user={user}
            onSelectFriend={handleSelectFriend}
            onSelectConversation={handleSelectConversationWithRoute}
            onUpdateRequestCount={setRequestCount}
          />
        </div>
      )}

      {/* MOBILE: Chat View (when HAS conversation) */}
      {hasActiveConversation && (
        <div className="flex md:hidden w-full h-full">
          <ChatWindow />
        </div>
      )}

      {/* ===============================================
          BOTTOM NAVIGATION - Mobile only, hide when chat active
          =============================================== */}
      {!hasActiveConversation && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unseenRequestCount={unseenRequestCount}
        />
      )}
    </div>
  );
}
// frontend/src/user/pages/Home.jsx - FULL UPDATED WITH CALL INTEGRATION

import { useContext, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ChatWindow from "../components/Chat/ChatWindow/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import NavigationColumn from "../components/Home/NavigationColumn";
import ContextPanel from "../components/Home/ContextPanel";
import BottomNavigation from "../components/Home/BottomNavigation";
import { CallManager } from "../components/Call";
import { useFriendRequestCount } from "../hooks/friends/useFriendRequestCount";
import { useHomeChat } from "../hooks/chat/useHomeChat";
import { useGlobalSocket } from "../hooks/socket/useGlobalSocket";
import useInitFriends from "../hooks/friends/useInitFriends";
import useChatStore from "../store/chat/chatStore";
import useFriendStore from "../store/friendStore";
import useRestoreChatFromUrl from "../hooks/chat/useRestoreChatFromUrl";

/**
 * 🏠 HOME COMPONENT
 * 
 * Main application layout with:
 * - Desktop: NavigationColumn + ContextPanel + ChatWindow
 * - Mobile: ContextPanel OR ChatWindow + BottomNavigation
 * 
 * ✅ UPDATED: Integrated CallManager for call UI
 * 
 * CallManager will render:
 * - IncomingCallModal (when receiving call)
 * - OutgoingCallModal (when calling)
 * - CallScreen (during call)
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
      <div className="flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50
        h-[calc(var(--vh,1vh)*100)]
        supports-[height:100dvh]:h-dvh"
      >
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

  const handleMobileBack = useCallback(() => {
    navigate(`/${activeTab}`);
  }, [navigate, activeTab]);

  // ============================================
  // RENDER - DVH + --VH FALLBACK
  // ============================================
  return (
    <div className="flex bg-gray-50 overflow-hidden relative
      h-[calc(var(--vh,1vh)*100)]
      supports-[height:100dvh]:h-dvh"
    >
      
      {/* ===============================================
          DESKTOP LAYOUT (≥ 768px)
          =============================================== */}
      
      <div className="hidden md:flex">
        <NavigationColumn
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unseenRequestCount={unseenRequestCount}
          onLogout={handleLogout}
        />
      </div>

      <div className="hidden md:flex">
        <ContextPanel
          activeTab={activeTab}
          user={user}
          onSelectFriend={handleSelectFriend}
          onSelectConversation={handleSelectConversationWithRoute}
          onUpdateRequestCount={setRequestCount}
          onLogout={handleLogout}
        />
      </div>

      {/* Desktop Chat Area or Empty State */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        {hasActiveConversation ? (
          <ChatWindow />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-linear-to-br from-gray-50 to-blue-50">
            <div className="text-center px-4">
              <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                {t("home.welcome.title") || "Chào mừng đến với Chat"}
              </h2>
              <p className="text-gray-500">
                {t("home.welcome.subtitle") || "Chọn một người bạn hoặc nhóm để bắt đầu trò chuyện"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===============================================
          MOBILE LAYOUT (< 768px)
          =============================================== */}

      <div className="md:hidden flex flex-col w-full h-full overflow-hidden">

        {!hasActiveConversation && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ContextPanel
              activeTab={activeTab}
              user={user}
              onSelectFriend={handleSelectFriend}
              onSelectConversation={handleSelectConversationWithRoute}
              onUpdateRequestCount={setRequestCount}
              onBack={handleMobileBack}
              onLogout={handleLogout}
            />
          </div>
        )}

        {hasActiveConversation && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatWindow />
          </div>
        )}

        {!hasActiveConversation && (
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
            unseenRequestCount={unseenRequestCount}
          />
        )}

      </div>

      {/* ===============================================
          🎯 CALL MANAGER - GLOBAL OVERLAY
          Renders call UI on top of everything
          =============================================== */}
      <CallManager />

    </div>
  );
}
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
 * Home Component - Mobile-First Optimized (Pure Tailwind)
 * 
 * ✅ Responsive hamburger menu
 * ✅ Smooth sidebar transitions
 * ✅ Better touch targets (min 44px)
 * ✅ Optimized for mobile devices
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

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
  // CLOSE SIDEBAR ON CONVERSATION SELECT (MOBILE)
  // ============================================
  useEffect(() => {
    if (conversationId && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [conversationId]);

  // ============================================
  // PREVENT BODY SCROLL WHEN SIDEBAR OPEN
  // ============================================
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMobileSidebarOpen]);

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
          <p className="text-gray-500 text-sm mt-2">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ============================================
  // HANDLERS
  // ============================================

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
        console.log(
          "✅ [Home] Navigating to existing conversation:",
          friendInfo.conversationId
        );

        const conversation = conversations.find(
          (c) => (c.conversationId || c._id) === friendInfo.conversationId
        );

        if (conversation) {
          console.log(
            "📋 [Home] Found conversation in store, using handleSelectConversation"
          );
          handleSelectConversation(conversation);
        } else {
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
        console.log("💤 [Home] Entering lazy mode (no conversation yet)");

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

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden relative">
      <CopyToast
        show={showToast}
        onClose={hideToast}
        message={t("home.toast.copiedUID")}
      />

      {/* HAMBURGER MENU BUTTON - Mobile only, min 44px touch target */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        style={{ 
          minWidth: '48px',
          minHeight: '48px',
          WebkitTapHighlightColor: 'transparent'
        }}
        aria-label="Toggle menu"
      >
        <div className="w-12 h-12 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white transition-transform duration-300"
            style={{
              transform: isMobileSidebarOpen ? 'rotate(90deg)' : 'rotate(0deg)'
            }}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileSidebarOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </div>
      </button>

      {/* BACKDROP OVERLAY - Mobile only */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        />
      )}

      {/* SIDEBAR - Responsive with smooth slide animation */}
      <div
        className={`
          fixed lg:static
          inset-0 lg:inset-auto
          z-40
          w-[85vw] max-w-sm lg:w-auto
          transform transition-transform duration-300 ease-out
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
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
          isMobile={true}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white lg:bg-gray-50">
        <ChatWindow />
      </div>
    </div>
  );
}
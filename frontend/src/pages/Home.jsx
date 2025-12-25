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
import  conversationService  from "../services/api";
import { connectSocket } from "../socket";
import useInitFriends from '../hooks/useInitFriends'; // ✅ NEW

export default function Home() {
  const { t } = useTranslation("home");
  const { user, logout, loading, token } = useContext(AuthContext);
  useInitFriends(user);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const location = useLocation();
  
  const { count: requestCount, setCount: setRequestCount } = useFriendRequestCount(user);
  const { showToast, triggerToast, hideToast } = useCopyToast(2000);
  
  const {
    conversations,
    loading: loadingConversations,
    selectedConversation,
    handleSelectConversation,
    updateConversationFromSocket, // ✅ Use this for socket updates
    markConversationAsRead,
    reloadConversations,
    addConversation,
  } = useHomeChat();

  const activeTab = location.pathname.split('/')[1] || 'friends';

  // ✅ FIXED: Stable callback, no reload
  const handleGlobalMessage = useCallback((data) => {
    console.log('🏠 [Home] Global message received:', {
      conversationId: data.conversationId,
      from: data.message.sender?.nickname,
      unreadCount: data.conversationUpdate?.unreadCount
    });

    // ✅ Update conversation with backend-calculated data
    updateConversationFromSocket(
      data.conversationId,
      data.conversationUpdate
    );
    
    // ❌ REMOVED: setTimeout reloadConversations
  }, [updateConversationFromSocket]);

  // ✅ Register socket listener ONCE with stable callback
  useGlobalSocket({
    onMessageReceived: handleGlobalMessage
  });

  // ✅ Auto-select conversation from URL
  useEffect(() => {
    if (!conversationId) {
      if (selectedConversation) {
        handleSelectConversation(null);
      }
      return;
    }

    if (conversations.length === 0) return;

    const currentConvId = selectedConversation?.conversationId;
    if (currentConvId === conversationId) return;

    const conversation = conversations.find(
      c => c.conversationId === conversationId || c._id === conversationId
    );
    
    if (conversation) {
      handleSelectConversation(conversation);
    }
  }, [conversationId, conversations, selectedConversation, handleSelectConversation]);

  // ✅ Connect socket on mount
  useEffect(() => {
    if (user && token) {
      connectSocket();
    }
  }, [user, token]);

  // ✅ Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

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

  const handleSelectConversationWithRoute = useCallback((conversation) => {
    if (!conversation) return;
    const tab = conversation.type === 'group' ? 'groups' : 'friends';
    const convId = conversation.conversationId || conversation._id;
    navigate(`/${tab}/${convId}`);
  }, [navigate]);

  const handleSelectFriend = async (friendInfo) => {
    try {
      const friendUid = friendInfo.uid || friendInfo._id;
      const conversation = await conversationService.createPrivateConversation(
        friendUid,
        token
      );

      addConversation(conversation);
      navigate(`/friends/${conversation.conversationId}`);
      
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert(`Error: ${error.message}`);
    }
  };

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
        conversations={conversations} // ✅ Direct use, no enrichment
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversationWithRoute}
        onSelectFriend={handleSelectFriend}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onMessageRead={() => markConversationAsRead(selectedConversation.conversationId)}
          />
        ) : (
          <HomeEmptyChat />
        )}
      </div>
    </div>
  );
}
// frontend/src/pages/Home.jsx
import { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ChatWindow from "../components/Chat/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import { Sidebar, HomeEmptyChat, CopyToast } from "../components/Home";
import { useFriendRequestCount } from "../hooks/useFriendRequestCount";
import { useHomeChat } from "../hooks/useHomeChat";
import { useCopyToast } from "../hooks/useCopyToast";
import { useChatSocket } from "../hooks/useChatSocket";
import { conversationService } from "../services/api";
import { connectSocket } from "../socket";
import "../styles/animations.css";

export default function Home() {
  const { t } = useTranslation("home");
  const { user, logout, loading, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const location = useLocation();
  
  const [requestCount, setRequestCount] = useFriendRequestCount(user);
  const { showToast, triggerToast, hideToast } = useCopyToast(2000);
  
  const {
    conversations: rawConversations,
    lastMessages,
    unreadCounts,
    selectedConversation,
    loading: loadingConversations,
    handleSelectConversation,
    updateConversationLastMessage,
    reloadConversations,
    addConversation, // ✅ GET NEW FUNCTION
  } = useHomeChat();

  const activeTab = location.pathname.split('/')[1] || 'friends';

  useChatSocket({
    activeConversationId: selectedConversation?.conversationId,
    onMessageReceived: null,
    onTyping: null,
    onMessageRead: null,
    onUpdateSidebar: (conversationId, message) => {
      updateConversationLastMessage(conversationId, message);
      setTimeout(() => {
        reloadConversations();
      }, 300);
    },
  });

  const enrichedConversations = useMemo(() => {
    if (!Array.isArray(rawConversations)) return [];
    
    return rawConversations.map(conv => {
      const convId = conv.conversationId || conv._id;
      const lastMessage = lastMessages?.[convId];
      const unreadCount = unreadCounts?.[convId] || 0;
      
      return {
        ...conv,
        lastMessage: lastMessage || null,
        lastMessageAt: lastMessage?.createdAt || conv.lastMessageAt,
        unreadCount: unreadCount,
      };
    });
  }, [rawConversations, lastMessages, unreadCounts]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && token) {
      connectSocket();
    }
  }, [user, token]);

  // Load conversation from URL - FIXED: Only update if conversationId actually changed
  useEffect(() => {
    if (conversationId && enrichedConversations.length > 0) {
      const currentConvId = selectedConversation?.conversationId || selectedConversation?._id;
      
      // Only update if the URL conversationId is different from current selection
      if (currentConvId !== conversationId) {
        const conversation = enrichedConversations.find(
          c => c.conversationId === conversationId || c._id === conversationId
        );
        
        if (conversation) {
          handleSelectConversation(conversation);
        }
      }
    } else if (!conversationId && selectedConversation) {
      // Clear selection when navigating away from conversation
      handleSelectConversation(null);
    }
  }, [conversationId, enrichedConversations.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">{t("home.loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCopyUID = () => {
    triggerToast();
  };

  const updateRequestCount = (count) => {
    setRequestCount(count);
  };

  const setActiveTab = (tab) => {
    navigate(`/${tab}`);
  };

  // ✅ UPDATED: Add conversation to state immediately
  const handleSelectFriend = async (friendInfo) => {
    try {
      const friendUid = friendInfo.uid || friendInfo._id;
      
      console.log('Creating/fetching conversation with friend:', friendUid);
      
      const conversation = await conversationService.createPrivateConversation(
        friendUid,
        token
      );

      console.log('Conversation created/fetched:', conversation);

      // ✅ ADD TO STATE IMMEDIATELY - This fixes the issue!
      addConversation(conversation);

      // Navigate to the conversation
      navigate(`/friends/${conversation.conversationId}`);
      
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert(`Error: ${error.message || 'Failed to create conversation'}`);
    }
  };

  const handleSelectConversationWithRoute = useCallback((conversation) => {
    if (!conversation) return;
    
    const tab = conversation.type === 'group' ? 'groups' : 'friends';
    const convId = conversation.conversationId || conversation._id;
    navigate(`/${tab}/${convId}`);
  }, [navigate]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden min-h-0">
      <CopyToast 
        show={showToast} 
        onClose={hideToast}
        message={t("home.toast.copiedUID")}
      />

      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        requestCount={requestCount}
        handleLogout={handleLogout}
        handleCopyUID={handleCopyUID}
        updateRequestCount={updateRequestCount}
        conversations={enrichedConversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversationWithRoute}
        onSelectFriend={handleSelectFriend}
      />

      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onUpdateSidebar={updateConversationLastMessage}
          />
        ) : (
          <HomeEmptyChat />
        )}
      </div>
    </div>
  );
}
// frontend/src/pages/Home.jsx
import { useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ChatWindow from "../components/Chat/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import { Sidebar, HomeEmptyChat, CopyToast } from "../components/Home";
import { useFriendRequestCount } from "../hooks/useFriendRequestCount";
import { useHomeChat } from "../hooks/useHomeChat";
import { useCopyToast } from "../hooks/useCopyToast";
import { useGlobalSocket } from "../hooks/useGlobalSocket"; 
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
    addConversation,
  } = useHomeChat();

  const lastMessagesCache = useRef({});
  const [sidebarUpdateTrigger, setSidebarUpdateTrigger] = useState(0);

  const activeTab = location.pathname.split('/')[1] || 'friends';

  useGlobalSocket({
    onMessageReceived: (conversationId, message) => {
      console.log('🏠 [Home] Global message received:', {
        conversationId,
        from: message.sender?.nickname
      });
      
      lastMessagesCache.current[conversationId] = message;
      updateConversationLastMessage(conversationId, message);
      setSidebarUpdateTrigger(prev => prev + 1);
      
      setTimeout(() => {
        console.log('🔄 [Home] Reloading conversations from backend');
        reloadConversations();
      }, 500);
    }
  });

  const enrichedConversations = useMemo(() => {
    if (!Array.isArray(rawConversations)) return [];
    
    console.log('🔄 Enriching conversations:', {
      total: rawConversations.length,
      cacheSize: Object.keys(lastMessagesCache.current).length,
      unreadCounts: unreadCounts
    });
    
    return rawConversations.map(conv => {
      const convId = conv.conversationId || conv._id;
      const lastMessage = lastMessagesCache.current[convId] || 
                          lastMessages?.[convId] || 
                          conv.lastMessage;
      const unreadCount = unreadCounts?.[convId] || 0;
      
      if (lastMessage && !lastMessagesCache.current[convId]) {
        lastMessagesCache.current[convId] = lastMessage;
      }
      
      return {
        ...conv,
        lastMessage: lastMessage || null,
        lastMessageAt: lastMessage?.createdAt || conv.lastMessageAt,
        unreadCount: unreadCount,
      };
    });
  }, [rawConversations, lastMessages, unreadCounts, sidebarUpdateTrigger]);

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

  useEffect(() => {
    if (rawConversations.length > 0 && Object.keys(lastMessages).length > 0) {
      rawConversations.forEach(conv => {
        const convId = conv.conversationId || conv._id;
        const lastMsg = lastMessages[convId];
        
        if (lastMsg && !lastMessagesCache.current[convId]) {
          lastMessagesCache.current[convId] = lastMsg;
        }
      });
    }
  }, [rawConversations, lastMessages]);

  useEffect(() => {
    if (conversationId && enrichedConversations.length > 0) {
      const currentConvId = selectedConversation?.conversationId || selectedConversation?._id;
      
      if (currentConvId !== conversationId) {
        const conversation = enrichedConversations.find(
          c => c.conversationId === conversationId || c._id === conversationId
        );
        
        if (conversation) {
          handleSelectConversation(conversation);
        }
      }
    } else if (!conversationId && selectedConversation) {
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

  const handleSelectFriend = async (friendInfo) => {
    try {
      const friendUid = friendInfo.uid || friendInfo._id;
      console.log('Creating/fetching conversation with friend:', friendUid);
      
      const conversation = await conversationService.createPrivateConversation(
        friendUid,
        token
      );

      console.log('Conversation created/fetched:', conversation);
      addConversation(conversation);
      
      const convId = conversation.conversationId || conversation._id;
      if (conversation.lastMessage) {
        lastMessagesCache.current[convId] = conversation.lastMessage;
      }

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
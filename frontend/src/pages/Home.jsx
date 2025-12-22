// frontend/src/pages/Home.jsx
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ChatWindow from "../components/Chat/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import { Sidebar, HomeEmptyChat, CopyToast } from "../components/Home";
import { useFriendRequestCount } from "../hooks/useFriendRequestCount";
import { useHomeChat } from "../hooks/useHomeChat";
import { useCopyToast } from "../hooks/useCopyToast";
import { conversationService } from "../services/api";
import "../styles/animations.css";

export default function Home() {
  const { t } = useTranslation("home");
  const { user, logout, loading, token } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Custom hooks
  const [requestCount, setRequestCount] = useFriendRequestCount(user);
  const [activeTab, setActiveTab] = useState("chats");
  const { showToast, triggerToast, hideToast } = useCopyToast(2000);
  
  const {
    conversations,
    lastMessages,
    unreadCounts,
    loading: loadingConversations,
    selectedConversation,
    handleSelectConversation,
    updateConversationLastMessage,
    reloadConversations,
  } = useHomeChat();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Loading state
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

  // Not authenticated
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

  /**
   * Handle when user clicks on a friend in FriendList
   * Create or get conversation with that friend
   */
  const handleSelectFriend = async (friendInfo) => {
    
    try {
      // friendInfo has: uid, nickname, avatar (from Friend object)
      const friendUid = friendInfo.uid || friendInfo._id;
      
      const response = await conversationService.createPrivateConversation(
        friendUid,
        token
      );


      // Transform conversation structure to match expected format
      const normalizedConversation = {
        ...response,
        _id: response.conversationId,
      };

 

      // Switch to chats tab
      setActiveTab("chats");

      // Select the conversation with normalized structure
      handleSelectConversation(normalizedConversation);
      

      // Reload conversations to update sidebar
      await reloadConversations();
      
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
      console.error("❌ Error stack:", error.stack);
    }
  };

  // Debug: Log when selectedConversation changes
  useEffect(() => {
  }, [selectedConversation]);

  // Debug: Log conversations list
  useEffect(() => {
  }, [conversations]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden min-h-0">
      {/* Copy Toast */}
      <CopyToast 
        show={showToast} 
        onClose={hideToast}
        message={t("home.toast.copiedUID")}
      />

      {/* Sidebar */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        requestCount={requestCount}
        handleLogout={handleLogout}
        handleCopyUID={handleCopyUID}
        updateRequestCount={updateRequestCount}
        // New conversation props
        conversations={conversations}
        lastMessages={lastMessages}
        unreadCounts={unreadCounts}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        loadingConversations={loadingConversations}
        // For FriendList
        onSelectFriend={handleSelectFriend}
      />

      {/* Chat Window */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            <ChatWindow
              conversation={selectedConversation}
              onUpdateSidebar={updateConversationLastMessage}
            />
          </>
        ) : (
          <>
            <HomeEmptyChat />
          </>
        )}
      </div>
    </div>
  );
}
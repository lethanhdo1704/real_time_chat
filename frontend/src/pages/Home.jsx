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
import "../styles/animations.css"; // Import animations

export default function Home() {
  const { t } = useTranslation("home");
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Custom hooks
  const [requestCount, setRequestCount] = useFriendRequestCount(user);
  const [activeTab, setActiveTab] = useState("friends");
  const { showToast, triggerToast, hideToast } = useCopyToast(2000);
  const {
    selectedChat,
    currentRoom,
    handleSelectFriend,
    handleSelectRoom,
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
    console.log('Updating request count:', count);
    setRequestCount(count);
  };

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
        handleSelectFriend={handleSelectFriend}
        handleSelectRoom={handleSelectRoom}
        updateRequestCount={updateRequestCount}
      />

      {/* Chat Window */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
        {selectedChat?.type === 'private' ? (
          <ChatWindow
            receiverId={selectedChat.receiverId}
            receiverName={selectedChat.receiverName}
            receiverAvatar={selectedChat.receiverAvatar}
          />
        ) : currentRoom ? (
          <ChatWindow
            currentRoom={currentRoom}
            user={{
              uid: user.uid,
              nickname: user.nickname,
              avatar: user.avatar,
            }}
          />
        ) : (
          <HomeEmptyChat />
        )}
      </div>
    </div>
  );
}
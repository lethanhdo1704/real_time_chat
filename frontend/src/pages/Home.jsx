// frontend/src/pages/Home.jsx
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ChatWindow from "../components/Chat/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import { Sidebar, HomeEmptyChat, CopyToast } from "../components/Home";
import { useFriendRequestCount } from "../hooks/useFriendRequestCount";

export default function Home() {
  const { t } = useTranslation("home");
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("friends");
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [requestCount, setRequestCount] = useFriendRequestCount(user);
  
  // States cho chat
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);

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
    setShowCopyToast(true);
  };

  const updateRequestCount = (count) => {
    console.log('Updating request count:', count);
    setRequestCount(count);
  };

  // Handle selecting a friend for private chat
  const handleSelectFriend = (chatInfo) => {
    setSelectedChat({
      ...chatInfo,
      type: 'private'
    });
    setCurrentRoom(null);
  };

  // Handle selecting a group
  const handleSelectRoom = (room) => {
    setCurrentRoom(room);
    setSelectedChat(null);
  };

  return (
    <>
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>

      <div className="flex h-screen bg-gray-100 overflow-hidden min-h-0">
        {/* Copy Toast */}
        <CopyToast 
          show={showCopyToast} 
          onClose={() => setShowCopyToast(false)}
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

        {/* Chat Window - Full width on mobile, fills remaining space on desktop */}
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
    </>
  );
}
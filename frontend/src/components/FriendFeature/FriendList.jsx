  // frontend/src/components/FriendFeature/FriendList.jsx
  import { useEffect, useState } from "react";
  import { getFriendsAndRequests } from "../../services/friendService";
  import socket from "../../socket";
  import { useTranslation } from "react-i18next";

  export default function FriendList({ currentUser, onCopyUID, onSelectFriend, selectedFriendId: externalSelectedId }) {
    const { t } = useTranslation("friendFeature");
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFriendId, setSelectedFriendId] = useState(externalSelectedId);
    const [lastMessages, setLastMessages] = useState({});
    const [unreadCounts, setUnreadCounts] = useState({});

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const data = await getFriendsAndRequests(currentUser.uid);
        setFriends(data.friends || []);
        
        if (data.friends && data.friends.length > 0) {
          await fetchLastMessages(data.friends);
        }
      } catch (err) {
        console.error("Error fetching friends:", err);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchLastMessages = async (friendsList) => {
      try {
        // FIX: Check both localStorage and sessionStorage
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        
        const response = await fetch(`http://localhost:5000/api/messages/last-messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: currentUser.uid,
            friendIds: friendsList.map(f => f.uid)
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setLastMessages(data.lastMessages || {});
          setUnreadCounts(data.unreadCounts || {});
        }
      } catch (err) {
        console.error("Error fetching last messages:", err);
      }
    };

    useEffect(() => {
      if (currentUser?.uid) {
        fetchFriends();
      }
    }, [currentUser?.uid]);

    // Sync with external selection
    useEffect(() => {
      setSelectedFriendId(externalSelectedId);
    }, [externalSelectedId]);

    // Listen for new messages
    useEffect(() => {
      const handleNewMessage = (msg) => {
        const otherUserId = msg.sender === currentUser.uid ? msg.receiver : msg.sender;
        
        // Update last message
        setLastMessages(prev => ({
          ...prev,
          [otherUserId]: {
            text: msg.text,
            timestamp: msg.createdAt || new Date().toISOString(),
            senderId: msg.sender,
            read: msg.read
          }
        }));
        
        // Update unread count if from other user and not currently selected
        if (msg.sender !== currentUser.uid && selectedFriendId !== msg.sender) {
          setUnreadCounts(prev => ({
            ...prev,
            [msg.sender]: (prev[msg.sender] || 0) + 1
          }));
        }
      };

      const handleMessagesRead = ({ friendId, count }) => {
        // Someone read our messages
        setLastMessages(prev => ({
          ...prev,
          [friendId]: prev[friendId] ? { ...prev[friendId], read: true } : prev[friendId]
        }));
      };

      const handleMessagesMarkedAsRead = ({ friendId }) => {
        // We marked messages as read
        setUnreadCounts(prev => ({
          ...prev,
          [friendId]: 0
        }));
      };

      socket.on("receivePrivateMessage", handleNewMessage);
      socket.on("messagesRead", handleMessagesRead);
      socket.on("messagesMarkedAsRead", handleMessagesMarkedAsRead);
      
      return () => {
        socket.off("receivePrivateMessage", handleNewMessage);
        socket.off("messagesRead", handleMessagesRead);
        socket.off("messagesMarkedAsRead", handleMessagesMarkedAsRead);
      };
    }, [currentUser?.uid, selectedFriendId]);

    const handleCopyUID = (e, uid) => {
      e.stopPropagation();
      navigator.clipboard.writeText(uid);
      if (onCopyUID) onCopyUID();
    };

    const handleSelectFriend = (friend) => {
      setSelectedFriendId(friend.uid);
      
      // Clear unread count
      setUnreadCounts(prev => ({
        ...prev,
        [friend.uid]: 0
      }));
      
      if (onSelectFriend) {
        onSelectFriend({
          receiverId: friend.uid,
          receiverName: friend.nickname || friend.uid,
          receiverAvatar: friend.avatar || "https://i.pravatar.cc/40"
        });
      }
    };

    const formatTime = (timestamp) => {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút`;
      if (diffHours < 24) return `${diffHours} giờ`;
      if (diffDays < 7) return `${diffDays} ngày`;
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    };

    const truncateText = (text, maxLength = 30) => {
      if (!text) return "";
      return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    };

    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      );
    }

    // Sort by last message time
    const sortedFriends = [...friends].sort((a, b) => {
      const timeA = lastMessages[a.uid]?.timestamp;
      const timeB = lastMessages[b.uid]?.timestamp;
      if (timeA && timeB) return new Date(timeB) - new Date(timeA);
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;
      return (a.nickname || a.uid).localeCompare(b.nickname || b.uid);
    });

    return (
      <div className="space-y-2">
        {friends.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-500 text-sm">{t('friendList.empty.title')}</p>
            <p className="text-gray-400 text-xs mt-1">{t('friendList.empty.subtitle')}</p>
          </div>
        )}
        
        {sortedFriends.map((f) => {
          const lastMsg = lastMessages[f.uid];
          const unreadCount = unreadCounts[f.uid] || 0;
          const isMe = lastMsg?.senderId === currentUser.uid;
          const isSelected = selectedFriendId === f.uid;
          
          return (
            <div 
              key={f._id} 
              onClick={() => handleSelectFriend(f)}
              className={`flex items-center p-3 border rounded-lg transition-all cursor-pointer
                ${isSelected 
                  ? 'bg-blue-50 border-blue-300 shadow-md' 
                  : unreadCount > 0
                  ? 'bg-blue-50/30 border-blue-200 hover:bg-blue-50/50 hover:shadow-md'
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                }`}
            >
              <div className="relative shrink-0">
                <img
                  src={f.avatar || "https://i.pravatar.cc/40"}
                  alt={f.nickname || f.uid}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              
              <div className="flex-1 ml-3 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`font-medium truncate ${unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-900'}`}>
                    {f.nickname || f.uid}
                  </p>
                  {lastMsg && (
                    <span className={`text-xs ml-2 shrink-0 ${unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                      {formatTime(lastMsg.timestamp)}
                    </span>
                  )}
                </div>
                
                {lastMsg ? (
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm truncate flex items-center gap-1 ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                      {isMe && (
                        <>
                          <span className="text-gray-400">{t('friendList.you')}: </span>
                          {lastMsg.read ? (
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                            </svg>
                          )}
                        </>
                      )}
                      {truncateText(lastMsg.text)}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={(e) => handleCopyUID(e, f.uid)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors group"
                    title={t('friendList.copyUID')}
                  >
                    <span className="font-medium text-gray-400">{t('common.uid')}:</span>
                    <span className="truncate max-w-35">{f.uid}</span>
                    <svg className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="shrink-0 ml-2">
                {isSelected ? (
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                ) : unreadCount > 0 ? (
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                ) : (
                  <div className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
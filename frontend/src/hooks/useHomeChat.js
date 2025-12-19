// frontend/src/hooks/useHomeChat.js
import { useState } from "react";

/**
 * Custom hook để quản lý state và logic chọn chat trong Home page
 * Xử lý cả private chat (friends) và group chat (rooms)
 */
export function useHomeChat() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);

  /**
   * Xử lý khi user chọn một friend để chat riêng
   * @param {Object} chatInfo - Thông tin chat với friend
   * @param {string} chatInfo.receiverId - ID của người nhận
   * @param {string} chatInfo.receiverName - Tên người nhận
   * @param {string} chatInfo.receiverAvatar - Avatar người nhận
   */
  const handleSelectFriend = (chatInfo) => {
    setSelectedChat({
      ...chatInfo,
      type: "private",
    });
    setCurrentRoom(null); // Clear room khi chọn private chat
  };

  /**
   * Xử lý khi user chọn một room để chat nhóm
   * @param {Object} room - Thông tin room
   */
  const handleSelectRoom = (room) => {
    setCurrentRoom(room);
    setSelectedChat(null); // Clear private chat khi chọn room
  };

  /**
   * Reset về trạng thái ban đầu (không có chat nào được chọn)
   */
  const clearSelection = () => {
    setSelectedChat(null);
    setCurrentRoom(null);
  };

  return {
    selectedChat,
    currentRoom,
    handleSelectFriend,
    handleSelectRoom,
    clearSelection,
  };
}
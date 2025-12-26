// frontend/src/hooks/useGlobalSocket.js
import { useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { getSocket } from "../services/socketService";

/**
 * Global socket listener for sidebar updates
 * Listens to message_received events for ALL conversations
 * 
 * @param {Function} onMessageReceived - Callback(data) với data = { conversationId, message, conversationUpdate }
 */
export const useGlobalSocket = ({ onMessageReceived }) => {
  const { user } = useContext(AuthContext);

  const handleGlobalMessage = useCallback((data) => {
    // ✅ Backend gửi: { conversationId, message, conversationUpdate }
    console.log('🌍 [Global] Message received:', {
      conversationId: data.conversationId,
      from: data.message?.sender?.nickname,
      isOwnMessage: data.message?.sender?.uid === user?.uid,
      unreadCount: data.conversationUpdate?.unreadCount
    });

    if (onMessageReceived) {
      onMessageReceived(data); // ✅ Pass toàn bộ data
    }
  }, [onMessageReceived, user?.uid]);

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket || !user) return;

    console.log('🌍 [Global] Registering listener');
    socket.on('message_received', handleGlobalMessage);

    return () => {
      socket.off('message_received', handleGlobalMessage);
      console.log('🌍 [Global] Listener cleaned up');
    };
  }, [user, handleGlobalMessage]);
};
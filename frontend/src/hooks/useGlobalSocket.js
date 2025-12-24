import { useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";

/**
 * ✅ FIXED: Global socket listener for sidebar updates
 * Now properly handles callback updates
 */
export const useGlobalSocket = ({ onMessageReceived }) => {
  const { user } = useContext(AuthContext);

  // ✅ Memoize the callback to prevent unnecessary re-registrations
  const handleGlobalMessage = useCallback(({ message }) => {
    console.log('🌍 [Global] Message received:', {
      conversationId: message.conversation,
      from: message.sender?.nickname,
      isOwnMessage: message.sender?.uid === user?.uid
    });

    if (onMessageReceived) {
      onMessageReceived(message.conversation, {
        messageId: message.messageId,
        content: message.content,
        type: message.type,
        sender: message.sender,
        createdAt: message.createdAt,
      });
    }
  }, [onMessageReceived, user?.uid]);

  useEffect(() => {
    if (!user) return;

    // ✅ Register listener
    socket.on('message_received', handleGlobalMessage);
    console.log('🌍 [Global] Listener registered');

    // ✅ Cleanup
    return () => {
      socket.off('message_received', handleGlobalMessage);
      console.log('🌍 [Global] Listener cleaned up');
    };
  }, [user, handleGlobalMessage]);
};
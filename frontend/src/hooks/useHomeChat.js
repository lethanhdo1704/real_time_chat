// frontend/src/hooks/useHomeChat.js
import { useState, useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { conversationService } from "../services/api";
import { messageService } from "../services/messageService";

/**
 * Custom hook để quản lý conversations, last messages và unread counts
 * Sử dụng cho Sidebar - hiển thị danh sách chat
 */
export function useHomeChat() {
  const { token, user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedConversation, setSelectedConversation] = useState(null);

  /**
   * Load conversations và last messages
   */
  const loadConversations = useCallback(async () => {
  
    
    if (!token || !user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      
      // 1. Load conversations
      const conversationsData = await conversationService.getConversations(token);
      
      
      
      // SAFE: Ensure conversationsData is array
      const conversationsArray = Array.isArray(conversationsData) 
        ? conversationsData 
        : (conversationsData?.conversations || []);
      
  ;
      
      setConversations(conversationsArray);

      // 2. Extract conversationIds
      const conversationIds = conversationsArray.map(conv => conv.conversationId);

      if (conversationIds.length === 0) {
        setLoading(false);
        return;
      }

      // 3. Load last messages for all conversations
      const lastMessagesData = await messageService.getLastMessages(conversationIds, token);
      
      setLastMessages(lastMessagesData || {});

      // 4. Calculate unread counts
      const unreadMap = {};
      conversationsArray.forEach(conv => {
        const lastMsg = lastMessagesData[conv.conversationId];
        
        // Count unread if:
        // - Last message exists
        // - Last message is not from current user
        // - lastSeenMessage is different from last message
        if (lastMsg && lastMsg.sender?.uid !== user.uid) {
          const isUnread = conv.lastSeenMessage !== lastMsg.messageId;
          unreadMap[conv.conversationId] = isUnread ? 1 : 0;
        } else {
          unreadMap[conv.conversationId] = 0;
        }
      });
      
      setUnreadCounts(unreadMap);
      setLoading(false);
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [token, user]);

  /**
   * Update last message của một conversation (realtime)
   */
  const updateConversationLastMessage = useCallback((conversationId, message) => {

    
    setLastMessages(prev => ({
      ...prev,
      [conversationId]: message
    }));

    // Update unread count if message is not from current user
    if (message.sender?.uid !== user?.uid) {
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1
      }));
    }

    // Resort conversations
    setConversations(prev => {
      const updated = [...prev];
      const index = updated.findIndex(c => c.conversationId === conversationId);
      
      if (index !== -1) {
        updated[index] = {
          ...updated[index],
          lastMessageAt: message.createdAt
        };
        
        // Sort by lastMessageAt DESC
        return updated.sort((a, b) => 
          new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
      }
      
      return updated;
    });
  }, [user]);

  /**
   * Clear unread count khi user mở conversation
   */
  const clearUnreadCount = useCallback((conversationId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }));
  }, []);

  /**
   * Handle select conversation
   */
  const handleSelectConversation = useCallback((conversation) => {
   
    
    setSelectedConversation(conversation);
    
    const convId = conversation?.conversationId || conversation?._id;
    clearUnreadCount(convId);
  }, [clearUnreadCount]);

  /**
   * Get sorted conversations by lastMessageAt
   */
  const sortedConversations = Array.isArray(conversations) 
    ? [...conversations].sort((a, b) => {
        const dateA = new Date(a.lastMessageAt || 0);
        const dateB = new Date(b.lastMessageAt || 0);
        return dateB - dateA;
      })
    : [];


  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations: sortedConversations,
    lastMessages,
    unreadCounts,
    loading,
    error,
    selectedConversation,
    handleSelectConversation,
    updateConversationLastMessage,
    clearUnreadCount,
    reloadConversations: loadConversations,
  };
}
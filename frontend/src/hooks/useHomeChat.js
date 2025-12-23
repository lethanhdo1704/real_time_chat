// frontend/src/hooks/useHomeChat.js
import { useState, useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { conversationService } from "../services/api";
import { messageService } from "../services/messageService";

/**
 * Custom hook for managing conversations, last messages, and unread counts
 * Handles real-time updates and conversation selection state
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
   * Fetch all conversations and their associated last messages
   * Also initializes unread counts from backend data
   */
  const loadConversations = useCallback(async () => {
    if (!token || !user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user's conversations list
      const conversationsData = await conversationService.getUserConversations(token);
      
      // Normalize response to always work with array
      const conversationsArray = Array.isArray(conversationsData) 
        ? conversationsData 
        : (conversationsData?.conversations || []);
      
      setConversations(conversationsArray);

      // Extract conversation IDs for batch fetching last messages
      const conversationIds = conversationsArray.map(conv => conv.conversationId);

      if (conversationIds.length === 0) {
        setLoading(false);
        return;
      }

      // Batch fetch last messages for all conversations
      const lastMessagesData = await messageService.getLastMessages(conversationIds, token);
      setLastMessages(lastMessagesData || {});

      // Initialize unread counts from backend (already calculated correctly)
      const unreadMap = {};
      conversationsArray.forEach(conv => {
        unreadMap[conv.conversationId] = conv.unreadCount || 0;
      });
      
      setUnreadCounts(unreadMap);
      setLoading(false);
      
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError(err.message);
      setLoading(false);
    }
  }, [token, user]);

  /**
   * Update last message for a conversation (triggered by real-time socket events)
   * Also increments unread count if message is from another user
   * 
   * @param {string} conversationId - ID of the conversation to update
   * @param {Object} message - New message object
   */
  const updateConversationLastMessage = useCallback((conversationId, message) => {
    // Update last message in state
    setLastMessages(prev => ({
      ...prev,
      [conversationId]: message
    }));

    // Increment unread count only for messages from other users
    if (message.sender?.uid !== user?.uid) {
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || 0) + 1
      }));
    }

    // Update lastMessageAt timestamp and re-sort conversations by recency
    setConversations(prev => {
      const updated = [...prev];
      const index = updated.findIndex(c => c.conversationId === conversationId);
      
      if (index !== -1) {
        updated[index] = {
          ...updated[index],
          lastMessageAt: message.createdAt
        };
        
        // Sort by most recent message first
        return updated.sort((a, b) => 
          new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
      }
      
      return updated;
    });
  }, [user]);

  /**
   * Reset unread count for a conversation (called when user opens the chat)
   * 
   * @param {string} conversationId - ID of the conversation to clear
   */
  const clearUnreadCount = useCallback((conversationId) => {
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }));
  }, []);

  /**
   * Handle conversation selection and clear unread count
   * 
   * @param {Object} conversation - Conversation object to select
   */
  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation);
    
    const convId = conversation?.conversationId || conversation?._id;
    clearUnreadCount(convId);
  }, [clearUnreadCount]);

  /**
   * ✅ ADD NEW CONVERSATION TO STATE
   * Called when user creates a new conversation with a friend
   * 
   * @param {Object} newConversation - New conversation object from API
   */
  const addConversation = useCallback((newConversation) => {
    setConversations(prev => {
      // Check if conversation already exists
      const exists = prev.find(
        c => c.conversationId === newConversation.conversationId || 
             c._id === newConversation._id ||
             c.conversationId === newConversation._id
      );
      
      if (exists) {
        console.log('Conversation already exists, skipping add');
        return prev; // Already exists, don't add
      }
      
      console.log('Adding new conversation to state:', newConversation);
      // Add new conversation to the beginning of the list
      return [newConversation, ...prev];
    });
    
    // Initialize lastMessage and unreadCount for new conversation
    const convId = newConversation.conversationId || newConversation._id;
    setLastMessages(prev => ({
      ...prev,
      [convId]: newConversation.lastMessage || null
    }));
    setUnreadCounts(prev => ({
      ...prev,
      [convId]: 0
    }));
  }, []);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    lastMessages,
    unreadCounts,
    loading,
    error,
    selectedConversation,
    handleSelectConversation,
    updateConversationLastMessage,
    clearUnreadCount,
    reloadConversations: loadConversations,
    addConversation, // ✅ EXPORT NEW FUNCTION
  };
}
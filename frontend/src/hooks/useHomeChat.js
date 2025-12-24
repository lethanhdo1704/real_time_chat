import { useState, useEffect, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { conversationService } from "../services/api";
import { messageService } from "../services/messageService";

export function useHomeChat() {
  const { token, user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const loadConversations = useCallback(async () => {
    if (!token || !user) return;

    try {
      setLoading(true);
      setError(null);

      const conversationsData = await conversationService.getUserConversations(token);
      const conversationsArray = Array.isArray(conversationsData) 
        ? conversationsData 
        : (conversationsData?.conversations || []);
      
      setConversations(conversationsArray);

      const conversationIds = conversationsArray.map(conv => conv.conversationId);
      if (conversationIds.length === 0) {
        setLoading(false);
        return;
      }

      const lastMessagesData = await messageService.getLastMessages(conversationIds, token);
      setLastMessages(lastMessagesData || {});

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

  const updateConversationLastMessage = useCallback((conversationId, message) => {
    console.log('📊 updateConversationLastMessage:', {
      conversationId,
      messageFrom: message.sender?.nickname,
      currentUser: user?.uid,
      isOwnMessage: message.sender?.uid === user?.uid
    });

    setLastMessages(prev => ({
      ...prev,
      [conversationId]: message
    }));

    const isOwnMessage = message.sender?.uid === user?.uid;
    const isActiveConversation = selectedConversation?.conversationId === conversationId ||
                                  selectedConversation?._id === conversationId;
    
    if (!isOwnMessage && !isActiveConversation) {
      console.log('➕ Incrementing unread count for:', conversationId);
      setUnreadCounts(prev => {
        const currentCount = prev[conversationId] || 0;
        const newCount = currentCount + 1;
        console.log(`   ${currentCount} → ${newCount}`);
        return {
          ...prev,
          [conversationId]: newCount
        };
      });
    } else {
      console.log('⏭️  Not incrementing unread:', {
        isOwnMessage,
        isActiveConversation
      });
    }

    setConversations(prev => {
      const updated = [...prev];
      const index = updated.findIndex(c => c.conversationId === conversationId);
      
      if (index !== -1) {
        updated[index] = {
          ...updated[index],
          lastMessageAt: message.createdAt
        };
        
        return updated.sort((a, b) => 
          new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)
        );
      }
      
      return updated;
    });
  }, [user, selectedConversation]);

  const clearUnreadCount = useCallback((conversationId) => {
    if (!conversationId) return;
    console.log('🧹 Clearing unread count for:', conversationId);
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }));
  }, []);

  const handleSelectConversation = useCallback((conversation) => {
    console.log('🎯 Selecting conversation:', conversation?.conversationId || 'none');
    setSelectedConversation(conversation);
    if (conversation) {
      const convId = conversation.conversationId || conversation._id;
      clearUnreadCount(convId);
    }
  }, [clearUnreadCount]);

  const addConversation = useCallback((newConversation) => {
    setConversations(prev => {
      const exists = prev.find(
        c => c.conversationId === newConversation.conversationId || 
             c._id === newConversation._id ||
             c.conversationId === newConversation._id
      );
      
      if (exists) {
        console.log('ℹ️  Conversation already exists, skipping add');
        return prev;
      }
      
      console.log('➕ Adding new conversation to state:', newConversation);
      return [newConversation, ...prev];
    });
    
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
    addConversation,
  };
}
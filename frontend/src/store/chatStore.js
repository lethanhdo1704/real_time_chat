// frontend/src/store/chatStore.js
import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  // ============================================
  // STATE
  // ============================================
  
  currentUser: null,
  conversations: new Map(),
  conversationsOrder: [],
  activeConversationId: null,
  activeFriend: null,
  loadingConversations: false,
  conversationsError: null,
  messages: new Map(),
  loadingMessages: new Map(),
  hasMoreMessages: new Map(),
  messagesError: new Map(),
  optimisticMessages: new Map(),
  typingUsers: new Map(),
  
  // ============================================
  // ACTIONS - USER
  // ============================================
  
  setCurrentUser: (user) => {
    set({ currentUser: user });
  },
  
  // ============================================
  // 🔥 NEW: RESET STORE
  // ============================================
  
  resetStore: () => {
    console.log('🧹 [chatStore] Resetting all state...');
    set({
      currentUser: null,
      conversations: new Map(),
      conversationsOrder: [],
      activeConversationId: null,
      activeFriend: null,
      loadingConversations: false,
      conversationsError: null,
      messages: new Map(),
      loadingMessages: new Map(),
      hasMoreMessages: new Map(),
      messagesError: new Map(),
      optimisticMessages: new Map(),
      typingUsers: new Map(),
    });
    console.log('✅ [chatStore] Store reset complete');
  },
  
  // ============================================
  // ACTIONS - CONVERSATIONS
  // ============================================
  
  setConversations: (conversations) => {
    const conversationsMap = new Map();
    const order = [];
    
    conversations.forEach(conv => {
      const id = conv.conversationId || conv._id;
      conversationsMap.set(id, conv);
      order.push(id);
    });
    
    set({
      conversations: conversationsMap,
      conversationsOrder: order,
    });
  },
  
  addConversation: (conversation) => {
    const id = conversation.conversationId || conversation._id;
    const conversations = new Map(get().conversations);
    conversations.set(id, conversation);
    
    const order = [id, ...get().conversationsOrder.filter(cid => cid !== id)];
    
    set({
      conversations,
      conversationsOrder: order,
    });
  },
  
  updateConversation: (conversationId, updates) => {
    const conversations = new Map(get().conversations);
    const existing = conversations.get(conversationId);
    
    if (existing) {
      conversations.set(conversationId, {
        ...existing,
        ...updates,
      });
      
      set({ conversations });
    }
  },
  
  setActiveConversation: (conversationId, options = {}) => {
    console.log('📍 [Store] Setting activeConversationId:', conversationId, options);

    const { clearFriend = false } = options;

    const updates = { activeConversationId: conversationId };

    if (conversationId && !get().conversations.has(conversationId)) {
      console.log('🧩 [Store] Creating placeholder conversation');

      const conversations = new Map(get().conversations);

      conversations.set(conversationId, {
        _id: conversationId,
        conversationId,
        type: 'private',
        friend: null,
        members: [],
        unreadCount: 0,
        _placeholder: true,
      });

      updates.conversations = conversations;
    }

    if (clearFriend && conversationId) {
      updates.activeFriend = null;
    }

    set(updates);
  },

  
  setActiveFriend: (friend) => {
    console.log('👤 [Store] Setting activeFriend:', friend?.nickname || friend?.uid || null);
    set({ activeFriend: friend });
  },
  
  resetUnreadCount: (conversationId) => {
    const conversations = new Map(get().conversations);
    const existing = conversations.get(conversationId);
    
    if (existing) {
      conversations.set(conversationId, {
        ...existing,
        unreadCount: 0,
      });
      
      set({ conversations });
    }
  },
  
  setConversationsLoading: (loading) => {
    set({ loadingConversations: loading });
  },
  
  setConversationsError: (error) => {
    set({ conversationsError: error });
  },
  
  // ============================================
  // ACTIONS - MESSAGES
  // ============================================
  
  // 🔥 NEW: Ensure messages array exists for a conversation
  ensureConversationMessages: (conversationId) => {
    const messagesMap = new Map(get().messages);
    
    if (!messagesMap.has(conversationId)) {
      console.log('🆕 [Store] Creating messages array for:', conversationId);
      messagesMap.set(conversationId, []);
      set({ messages: messagesMap });
    }
  },
  
  setMessages: (conversationId, messages, hasMore = true) => {
    const messagesMap = new Map(get().messages);
    messagesMap.set(conversationId, messages);
    
    const hasMoreMap = new Map(get().hasMoreMessages);
    hasMoreMap.set(conversationId, hasMore);
    
    set({
      messages: messagesMap,
      hasMoreMessages: hasMoreMap,
    });
  },
  
  prependMessages: (conversationId, newMessages, hasMore) => {
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    messagesMap.set(conversationId, [...newMessages, ...existing]);
    
    const hasMoreMap = new Map(get().hasMoreMessages);
    hasMoreMap.set(conversationId, hasMore);
    
    set({
      messages: messagesMap,
      hasMoreMessages: hasMoreMap,
    });
  },
  
  addMessage: (conversationId, message) => {
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    // Check duplicate by _id or messageId
    const exists = existing.some(m => {
      if (message._id && m._id && m._id === message._id) return true;
      if (message.messageId && m.messageId && m.messageId === message.messageId) return true;
      return false;
    });
    
    if (exists) {
      console.log('⚠️ [chatStore] Message already exists, skipping:', 
        message.messageId || message._id);
      return;
    }
    
    console.log('✅ [chatStore] Adding new message:', 
      message.messageId || message._id);
    
    messagesMap.set(conversationId, [...existing, message]);
    set({ messages: messagesMap });
  },
  
  updateMessage: (conversationId, messageId, updates) => {
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const updated = existing.map(m => 
      (m._id === messageId || m.messageId === messageId)
        ? { ...m, ...updates }
        : m
    );
    
    messagesMap.set(conversationId, updated);
    set({ messages: messagesMap });
  },
  
  removeMessage: (conversationId, messageId) => {
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const filtered = existing.filter(m => 
      m._id !== messageId && m.messageId !== messageId
    );
    
    messagesMap.set(conversationId, filtered);
    set({ messages: messagesMap });
  },
  
  setMessagesLoading: (conversationId, loading) => {
    const loadingMap = new Map(get().loadingMessages);
    loadingMap.set(conversationId, loading);
    set({ loadingMessages: loadingMap });
  },
  
  setMessagesError: (conversationId, error) => {
    const errorMap = new Map(get().messagesError);
    errorMap.set(conversationId, error);
    set({ messagesError: errorMap });
  },
  
  // ============================================
  // ACTIONS - OPTIMISTIC MESSAGES
  // ============================================
  
  addOptimisticMessage: (clientMessageId, message) => {
    const optimistic = new Map(get().optimisticMessages);
    optimistic.set(clientMessageId, message);
    
    const conversationId = message.conversation;
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    messagesMap.set(conversationId, [...existing, message]);
    
    set({
      optimisticMessages: optimistic,
      messages: messagesMap,
    });
  },
  
  confirmOptimisticMessage: (conversationId, clientMessageId, confirmedMessage) => {
    const optimistic = new Map(get().optimisticMessages);
    optimistic.delete(clientMessageId);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const updated = existing.map(m => 
      m.clientMessageId === clientMessageId
        ? { ...m, ...confirmedMessage, _optimistic: false }
        : m
    );
    
    messagesMap.set(conversationId, updated);
    
    set({
      optimisticMessages: optimistic,
      messages: messagesMap,
    });
  },
  
  removeOptimisticMessage: (clientMessageId, conversationId) => {
    const optimistic = new Map(get().optimisticMessages);
    optimistic.delete(clientMessageId);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const filtered = existing.filter(m => m.clientMessageId !== clientMessageId);
    messagesMap.set(conversationId, filtered);
    
    set({
      optimisticMessages: optimistic,
      messages: messagesMap,
    });
  },
  
  // ============================================
  // ACTIONS - TYPING INDICATORS
  // ============================================
  
  addTypingUser: (conversationId, userUid) => {
    const typingMap = new Map(get().typingUsers);
    const usersSet = typingMap.get(conversationId) || new Set();
    
    usersSet.add(userUid);
    typingMap.set(conversationId, usersSet);
    
    set({ typingUsers: typingMap });
  },
  
  removeTypingUser: (conversationId, userUid) => {
    const typingMap = new Map(get().typingUsers);
    const usersSet = typingMap.get(conversationId);
    
    if (!usersSet) return;
    
    usersSet.delete(userUid);
    
    if (usersSet.size === 0) {
      typingMap.delete(conversationId);
    } else {
      typingMap.set(conversationId, usersSet);
    }
    
    set({ typingUsers: typingMap });
  },
  
  clearTypingUsers: (conversationId) => {
    const typingMap = new Map(get().typingUsers);
    typingMap.delete(conversationId);
    set({ typingUsers: typingMap });
  },
}));

// ============================================
// 🔥 EXPOSE TO WINDOW FOR DEBUGGING
// ============================================
if (typeof window !== 'undefined') {
  window.useChatStore = useChatStore;
  console.log('✅ [chatStore] Exposed to window for debugging');
}

export default useChatStore;
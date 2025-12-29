// frontend/src/store/chat/messageSlice.js

/**
 * Message Slice
 * Manages messages for all conversations
 */
export const createMessageSlice = (set, get) => ({
  // ============================================
  // STATE
  // ============================================
  
  messages: new Map(),
  loadingMessages: new Map(),
  hasMoreMessages: new Map(),
  messagesError: new Map(),
  optimisticMessages: new Map(),

  // ============================================
  // ACTIONS - MESSAGES
  // ============================================
  
  ensureConversationMessages: (conversationId) => {
    const messagesMap = new Map(get().messages);
    
    if (!messagesMap.has(conversationId)) {
      console.log('🆕 [messageSlice] Creating messages array for:', conversationId);
      messagesMap.set(conversationId, []);
      set({ messages: messagesMap });
    }
  },
  
  setMessages: (conversationId, messages, hasMore = true) => {
    console.log('📋 [messageSlice] setMessages:', conversationId, messages.length);
    
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
    console.log('⬆️ [messageSlice] prependMessages:', conversationId, newMessages.length);
    
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
    
    // Check duplicate
    const exists = existing.some(m => {
      if (message._id && m._id && m._id === message._id) return true;
      if (message.messageId && m.messageId && m.messageId === message.messageId) return true;
      return false;
    });
    
    if (exists) {
      console.log('⚠️ [messageSlice] Message already exists, skipping:', 
        message.messageId || message._id);
      return;
    }
    
    console.log('✅ [messageSlice] Adding new message:', 
      message.messageId || message._id);
    
    messagesMap.set(conversationId, [...existing, message]);
    set({ messages: messagesMap });
  },
  
  updateMessage: (conversationId, messageId, updates) => {
    console.log('🔄 [messageSlice] updateMessage:', conversationId, messageId);
    
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
    console.log('🗑️ [messageSlice] removeMessage:', conversationId, messageId);
    
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
    console.log('⏳ [messageSlice] addOptimisticMessage:', clientMessageId);
    
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
    console.log('✅ [messageSlice] confirmOptimisticMessage:', clientMessageId);
    
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
    console.log('❌ [messageSlice] removeOptimisticMessage:', clientMessageId);
    
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
});
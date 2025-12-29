// frontend/src/store/chat/messageSlice.js

/**
 * Message Slice - PRODUCTION READY
 * 
 * Features:
 * ✅ Message deduplication by ID
 * ✅ Optimistic message handling
 * ✅ Proper prepend for pagination
 * ✅ No duplicate messages on load more
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
  // 🔥 HELPER: DEDUPE MESSAGES
  // ============================================
  
  /**
   * Deduplicate messages by ID
   * Priority: messageId (server) > _id (server) > clientMessageId (optimistic)
   */
  _dedupeMessages: (messages) => {
    const map = new Map();
    
    messages.forEach((msg) => {
      // Determine unique ID (prefer server IDs)
      const id = msg.messageId || msg._id || msg.clientMessageId;
      
      if (!id) {
        console.warn('⚠️ [messageSlice] Message without ID:', msg);
        return;
      }
      
      const existing = map.get(id);
      
      if (existing) {
        // Prefer server message over optimistic
        if ((msg.messageId || msg._id) && !existing.messageId && !existing._id) {
          map.set(id, msg);
        }
        // Otherwise keep existing (first wins)
      } else {
        map.set(id, msg);
      }
    });
    
    return Array.from(map.values());
  },

  // ============================================
  // ACTIONS - BASIC OPERATIONS
  // ============================================
  
  /**
   * Ensure conversation has messages array initialized
   */
  ensureConversationMessages: (conversationId) => {
    const messagesMap = new Map(get().messages);
    
    if (!messagesMap.has(conversationId)) {
      console.log('🆕 [messageSlice] Creating messages array for:', conversationId);
      messagesMap.set(conversationId, []);
      set({ messages: messagesMap });
    }
  },
  
  /**
   * Set messages for a conversation (replaces all)
   * Used for initial load - WITH DEDUPE
   */
  setMessages: (conversationId, newMessages, hasMore = true) => {
    console.log('📋 [messageSlice] setMessages:', conversationId, newMessages.length);
    
    const messagesMap = new Map(get().messages);
    
    // 🔥 DEDUPE before setting
    const deduped = get()._dedupeMessages(newMessages);
    
    if (deduped.length !== newMessages.length) {
      console.log('🔄 [messageSlice] Deduped setMessages:', {
        original: newMessages.length,
        deduped: deduped.length,
        duplicatesRemoved: newMessages.length - deduped.length,
      });
    }
    
    messagesMap.set(conversationId, deduped);
    
    const hasMoreMap = new Map(get().hasMoreMessages);
    hasMoreMap.set(conversationId, hasMore);
    
    set({
      messages: messagesMap,
      hasMoreMessages: hasMoreMap,
    });
  },
  
  /**
   * Prepend messages (for pagination - loading older messages)
   * 🔥 WITH DEDUPLICATION
   */
  prependMessages: (conversationId, newMessages, hasMore) => {
    console.log('⬆️ [messageSlice] prependMessages:', conversationId, newMessages.length);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    // 🔥 DEBUG: Log message IDs before dedupe
    console.log('🔍 [messageSlice] Before dedupe:', {
      newFirstId: newMessages[0]?.messageId || newMessages[0]?._id,
      newLastId: newMessages[newMessages.length - 1]?.messageId || newMessages[newMessages.length - 1]?._id,
      existingFirstId: existing[0]?.messageId || existing[0]?._id,
      existingLastId: existing[existing.length - 1]?.messageId || existing[existing.length - 1]?._id,
    });
    
    // 🔥 DEDUPE: Combine new + existing, then dedupe
    const combined = [...newMessages, ...existing];
    const deduped = get()._dedupeMessages(combined);
    
    console.log('✅ [messageSlice] Prepend deduped:', {
      newCount: newMessages.length,
      existingCount: existing.length,
      combinedCount: combined.length,
      dedupedCount: deduped.length,
      duplicatesRemoved: combined.length - deduped.length,
    });
    
    messagesMap.set(conversationId, deduped);
    
    const hasMoreMap = new Map(get().hasMoreMessages);
    hasMoreMap.set(conversationId, hasMore);
    
    set({
      messages: messagesMap,
      hasMoreMessages: hasMoreMap,
    });
  },
  
  /**
   * Add a single message (append to end)
   * Used for new incoming messages - WITH DUPLICATE CHECK
   */
  addMessage: (conversationId, message) => {
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    // 🔥 CHECK: Don't add if already exists
    const messageId = message.messageId || message._id || message.clientMessageId;
    const isDuplicate = existing.some(m => {
      const existingId = m.messageId || m._id || m.clientMessageId;
      return existingId === messageId;
    });
    
    if (isDuplicate) {
      console.log('⏭️ [messageSlice] Message already exists, skipping:', messageId);
      return;
    }
    
    console.log('✅ [messageSlice] Adding new message:', messageId);
    
    messagesMap.set(conversationId, [...existing, message]);
    set({ messages: messagesMap });
  },
  
  /**
   * Update a message by ID
   */
  updateMessage: (conversationId, messageId, updates) => {
    console.log('🔄 [messageSlice] updateMessage:', conversationId, messageId);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const updated = existing.map(m => {
      const id = m.messageId || m._id || m.clientMessageId;
      if (id === messageId) {
        return { ...m, ...updates };
      }
      return m;
    });
    
    messagesMap.set(conversationId, updated);
    set({ messages: messagesMap });
  },
  
  /**
   * Remove a message by ID
   */
  removeMessage: (conversationId, messageId) => {
    console.log('🗑️ [messageSlice] removeMessage:', conversationId, messageId);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const filtered = existing.filter(m => {
      const id = m.messageId || m._id || m.clientMessageId;
      return id !== messageId;
    });
    
    messagesMap.set(conversationId, filtered);
    set({ messages: messagesMap });
  },

  // ============================================
  // ACTIONS - LOADING/ERROR
  // ============================================
  
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
  
  /**
   * Add optimistic message (shown immediately while sending)
   */
  addOptimisticMessage: (clientMessageId, message) => {
    console.log('⏳ [messageSlice] addOptimisticMessage:', clientMessageId);
    
    const conversationId = message.conversation;
    
    // Add to optimistic tracking
    const optimistic = new Map(get().optimisticMessages);
    optimistic.set(clientMessageId, message);
    
    // Add to messages (user sees it immediately)
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    // 🔥 CHECK: Don't add if already exists
    const isDuplicate = existing.some(m => m.clientMessageId === clientMessageId);
    
    if (isDuplicate) {
      console.log('⏭️ [messageSlice] Optimistic message already exists');
      return;
    }
    
    messagesMap.set(conversationId, [...existing, message]);
    
    set({
      optimisticMessages: optimistic,
      messages: messagesMap,
    });
  },
  
  /**
   * Confirm optimistic message with real data from server
   */
  confirmOptimisticMessage: (conversationId, clientMessageId, confirmedMessage) => {
    console.log('✅ [messageSlice] confirmOptimisticMessage:', clientMessageId);
    
    // Remove from optimistic tracking
    const optimistic = new Map(get().optimisticMessages);
    optimistic.delete(clientMessageId);
    
    // Update in messages (replace optimistic with real)
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const updated = existing.map(m => {
      if (m.clientMessageId === clientMessageId) {
        return {
          ...m,
          ...confirmedMessage,
          _optimistic: false,
        };
      }
      return m;
    });
    
    messagesMap.set(conversationId, updated);
    
    set({
      optimisticMessages: optimistic,
      messages: messagesMap,
    });
  },
  
  /**
   * Remove optimistic message (on error or cancel)
   */
  removeOptimisticMessage: (clientMessageId, conversationId) => {
    console.log('❌ [messageSlice] removeOptimisticMessage:', clientMessageId);
    
    // Remove from optimistic tracking
    const optimistic = new Map(get().optimisticMessages);
    optimistic.delete(clientMessageId);
    
    // Remove from messages
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
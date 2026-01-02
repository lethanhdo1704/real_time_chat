// frontend/src/store/chat/messageSlice.js

/**
 * Message Slice - WITH 3 DELETE TYPES
 * 
 * Features:
 * ✅ Message deduplication by ID
 * ✅ Optimistic message handling
 * ✅ Reply state management
 * ✅ 🆕 Hide message (KIỂU 1 & 2)
 * ✅ 🆕 Recall message (KIỂU 3)
 * ✅ 🆕 Admin delete (PRIORITY 1)
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
  replyingTo: new Map(),
  highlightedMessage: new Map(),

  // ============================================
  // HELPER: DEDUPE MESSAGES
  // ============================================
  
  _dedupeMessages: (messages) => {
    const map = new Map();
    
    messages.forEach((msg) => {
      const id = msg.messageId || msg._id || msg.clientMessageId;
      
      if (!id) {
        console.warn('⚠️ [messageSlice] Message without ID:', msg);
        return;
      }
      
      const existing = map.get(id);
      
      if (existing) {
        if ((msg.messageId || msg._id) && !existing.messageId && !existing._id) {
          map.set(id, msg);
        }
      } else {
        map.set(id, msg);
      }
    });
    
    return Array.from(map.values());
  },

  // ============================================
  // BASIC OPERATIONS (existing code...)
  // ============================================
  
  ensureConversationMessages: (conversationId) => {
    const messagesMap = new Map(get().messages);
    
    if (!messagesMap.has(conversationId)) {
      console.log('🆕 [messageSlice] Creating messages array for:', conversationId);
      messagesMap.set(conversationId, []);
      set({ messages: messagesMap });
    }
  },
  
  setMessages: (conversationId, newMessages, hasMore = true) => {
    console.log('📋 [messageSlice] setMessages:', conversationId, newMessages.length);
    
    const messagesMap = new Map(get().messages);
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
  
  prependMessages: (conversationId, newMessages, hasMore) => {
    console.log('⬆️ [messageSlice] prependMessages:', conversationId, newMessages.length);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
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
  
  addMessage: (conversationId, message) => {
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
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
  // 🆕 MESSAGE DELETION ACTIONS
  // ============================================

  /**
   * KIỂU 1 & 2: Hide message locally (no socket broadcast)
   * Used for both hideMessage and deleteForMe
   */
  hideMessageLocal: (conversationId, messageId) => {
    console.log('👁️‍🗨️ [messageSlice] hideMessageLocal:', conversationId, messageId);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const filtered = existing.filter(m => {
      const id = m.messageId || m._id || m.clientMessageId;
      return id !== messageId;
    });
    
    messagesMap.set(conversationId, filtered);
    set({ messages: messagesMap });
    
    console.log('✅ [messageSlice] Message hidden locally');
  },

  /**
   * KIỂU 3: Recall message (via socket)
   * Updates message to show recalled state
   */
  recallMessageFromSocket: (conversationId, messageId, recalledBy, recalledAt) => {
    console.log('↩️ [messageSlice] recallMessageFromSocket:', conversationId, messageId);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const updated = existing.map(m => {
      const id = m.messageId || m._id || m.clientMessageId;
      if (id === messageId) {
        return {
          ...m,
          isRecalled: true,
          recalledAt: recalledAt || new Date().toISOString(),
          recalledBy,
          content: "", // Clear content for recalled messages
        };
      }
      return m;
    });
    
    messagesMap.set(conversationId, updated);
    set({ messages: messagesMap });
    
    console.log('✅ [messageSlice] Message recalled via socket');
  },

  /**
   * PRIORITY 1: Admin delete (via socket)
   * Removes message completely for everyone
   */
  deleteMessageFromSocket: (conversationId, messageId) => {
    console.log('🗑️ [messageSlice] deleteMessageFromSocket:', conversationId, messageId);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const filtered = existing.filter(m => {
      const id = m.messageId || m._id || m.clientMessageId;
      return id !== messageId;
    });
    
    messagesMap.set(conversationId, filtered);
    set({ messages: messagesMap });
    
    console.log('✅ [messageSlice] Message deleted via socket');
  },

  // ============================================
  // LOADING/ERROR STATES
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
  // OPTIMISTIC MESSAGES
  // ============================================
  
  addOptimisticMessage: (clientMessageId, message) => {
    console.log('⏳ [messageSlice] addOptimisticMessage:', clientMessageId);
    
    const conversationId = message.conversation;
    
    const optimistic = new Map(get().optimisticMessages);
    optimistic.set(clientMessageId, message);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
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
  
  confirmOptimisticMessage: (conversationId, clientMessageId, confirmedMessage) => {
    console.log('✅ [messageSlice] confirmOptimisticMessage:', clientMessageId);
    
    const optimistic = new Map(get().optimisticMessages);
    optimistic.delete(clientMessageId);
    
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

  // ============================================
  // REPLY ACTIONS (existing code...)
  // ============================================

  setReplyingTo: (conversationId, message) => {
    console.log('💬 [messageSlice] setReplyingTo:', conversationId, message?.messageId);
    
    const replyingToMap = new Map(get().replyingTo);
    
    if (message) {
      replyingToMap.set(conversationId, message);
    } else {
      replyingToMap.delete(conversationId);
    }
    
    set({ replyingTo: replyingToMap });
  },

  clearReplyingTo: (conversationId) => {
    console.log('🧹 [messageSlice] clearReplyingTo:', conversationId);
    
    const replyingToMap = new Map(get().replyingTo);
    replyingToMap.delete(conversationId);
    
    set({ replyingTo: replyingToMap });
  },

  getReplyingTo: (conversationId) => {
    return get().replyingTo.get(conversationId) || null;
  },

  setHighlightedMessage: (conversationId, messageId) => {
    console.log('✨ [messageSlice] setHighlightedMessage:', conversationId, messageId);
    
    const highlightedMap = new Map(get().highlightedMessage);
    
    if (messageId) {
      highlightedMap.set(conversationId, messageId);
      
      setTimeout(() => {
        const currentHighlighted = get().highlightedMessage.get(conversationId);
        if (currentHighlighted === messageId) {
          get().clearHighlightedMessage(conversationId);
        }
      }, 2000);
    } else {
      highlightedMap.delete(conversationId);
    }
    
    set({ highlightedMessage: highlightedMap });
  },

  clearHighlightedMessage: (conversationId) => {
    console.log('🧹 [messageSlice] clearHighlightedMessage:', conversationId);
    
    const highlightedMap = new Map(get().highlightedMessage);
    highlightedMap.delete(conversationId);
    
    set({ highlightedMessage: highlightedMap });
  },

  getHighlightedMessage: (conversationId) => {
    return get().highlightedMessage.get(conversationId) || null;
  },

  findMessageById: (conversationId, messageId) => {
    const messages = get().messages.get(conversationId) || [];
    return messages.find(m => {
      const id = m.messageId || m._id;
      return id === messageId;
    }) || null;
  },
});
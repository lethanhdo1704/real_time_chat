// frontend/src/store/chat/messageSlice.js

/**
 * Message Slice - WITH READ RECEIPTS
 * 
 * Manages all message-related state including:
 * - Messages per conversation (Map)
 * - Loading/error states
 * - Optimistic messages
 * - Reply state
 * - Highlighted messages
 * - 🆕 READ RECEIPTS (avatars below messages)
 * 
 * Read Receipts Structure:
 * readReceipts: Map<conversationId, Map<messageId, User[]>>
 * 
 * User object: { userUid, avatar, nickname, readAt }
 * 
 * Key Rule: 1 user can only appear at 1 message at a time (their lastSeenMessage)
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

  // 🆕 READ RECEIPTS STATE
  // Structure: Map<conversationId, Map<messageId, User[]>>
  readReceipts: new Map(),

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
  // BASIC OPERATIONS
  // ============================================
  
  ensureConversationMessages: (conversationId) => {
    const messagesMap = new Map(get().messages);
    
    if (!messagesMap.has(conversationId)) {
      console.log('🆕 [messageSlice] Creating messages array for:', conversationId);
      messagesMap.set(conversationId, []);
      set({ messages: messagesMap });
    }

    // 🆕 Ensure readReceipts Map exists
    const receiptsMap = new Map(get().readReceipts);
    if (!receiptsMap.has(conversationId)) {
      console.log('🆕 [messageSlice] Creating readReceipts map for:', conversationId);
      receiptsMap.set(conversationId, new Map());
      set({ readReceipts: receiptsMap });
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
  // MESSAGE DELETION ACTIONS
  // ============================================

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
          content: "",
        };
      }
      return m;
    });
    
    messagesMap.set(conversationId, updated);
    set({ messages: messagesMap });
    
    console.log('✅ [messageSlice] Message recalled via socket');
  },

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
  // 🆕 READ RECEIPTS ACTIONS
  // ============================================

  /**
   * Update read receipt when user reads messages
   * 
   * ATOMIC OPERATION - 2 STEPS:
   * 1. Remove user from ALL messages in this conversation
   * 2. Add user to the NEW lastSeenMessage
   * 
   * This ensures: 1 user = 1 message maximum
   * 
   * @param {string} conversationId - Conversation ID
   * @param {string} userUid - User who read the message
   * @param {string} lastSeenMessageId - Last message they saw
   * @param {Object} userInfo - { avatar, nickname, readAt } for display
   */
  updateReadReceipt: (conversationId, userUid, lastSeenMessageId, userInfo = {}) => {
    console.log('📖 [messageSlice] updateReadReceipt:', {
      conversationId,
      userUid,
      lastSeenMessageId,
      userInfo,
    });

    const receiptsMap = new Map(get().readReceipts);
    
    // Get or create conversation's receipt map
    let conversationReceipts = receiptsMap.get(conversationId);
    if (!conversationReceipts) {
      conversationReceipts = new Map();
      receiptsMap.set(conversationId, conversationReceipts);
    } else {
      // Clone to avoid mutation
      conversationReceipts = new Map(conversationReceipts);
    }

    // ============================================
    // STEP 1: Remove user from ALL old messages
    // ============================================
    conversationReceipts.forEach((users, messageId) => {
      const filtered = users.filter(u => u.userUid !== userUid);
      
      if (filtered.length === 0) {
        // No users left → delete entry
        conversationReceipts.delete(messageId);
      } else {
        conversationReceipts.set(messageId, filtered);
      }
    });

    // ============================================
    // STEP 2: Add user to NEW lastSeenMessage
    // ============================================
    const existingUsers = conversationReceipts.get(lastSeenMessageId) || [];
    
    // Check if user already exists (prevent duplicates)
    const userExists = existingUsers.some(u => u.userUid === userUid);
    
    if (!userExists) {
      const newUser = {
        userUid,
        avatar: userInfo.avatar || null,
        nickname: userInfo.nickname || userUid,
        readAt: userInfo.readAt || new Date().toISOString(), // 🔥 Thêm readAt timestamp
      };
      
      conversationReceipts.set(lastSeenMessageId, [...existingUsers, newUser]);
      
      console.log('✅ [messageSlice] User added to lastSeenMessage:', {
        messageId: lastSeenMessageId,
        userUid,
        readAt: newUser.readAt,
        totalUsers: existingUsers.length + 1,
      });
    } else {
      console.log('⏭️ [messageSlice] User already at this message, skipping');
    }

    // ============================================
    // STEP 3: Update state
    // ============================================
    receiptsMap.set(conversationId, conversationReceipts);
    
    set({ readReceipts: receiptsMap });

    console.log('✅ [messageSlice] Read receipts updated for conversation:', conversationId);
  },

  /**
   * Get read receipts for a specific message
   * 
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @returns {Array} Array of users who read this message
   */
  getReadReceipts: (conversationId, messageId) => {
    const receiptsMap = get().readReceipts;
    const conversationReceipts = receiptsMap.get(conversationId);
    
    if (!conversationReceipts) return [];
    
    return conversationReceipts.get(messageId) || [];
  },

  /**
   * Clear read receipts for a conversation
   * Used when leaving conversation or resetting
   */
  clearReadReceipts: (conversationId) => {
    console.log('🧹 [messageSlice] clearReadReceipts:', conversationId);
    
    const receiptsMap = new Map(get().readReceipts);
    receiptsMap.delete(conversationId);
    
    set({ readReceipts: receiptsMap });
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

  setHasMoreMessages: (conversationId, hasMore) => {
    const hasMoreMap = new Map(get().hasMoreMessages);
    hasMoreMap.set(conversationId, hasMore);
    set({ hasMoreMessages: hasMoreMap });
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
  // REPLY ACTIONS
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
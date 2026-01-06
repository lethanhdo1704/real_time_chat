// frontend/src/store/chat/messageSlice.js

/**
 * Message Slice - WITH READ RECEIPTS + EDIT + 🆕 REACTIONS
 * 
 * Manages all message-related state including:
 * - Messages per conversation (Map)
 * - Loading/error states
 * - Optimistic messages
 * - Reply state
 * - Highlighted messages
 * - Read receipts (avatars below messages)
 * - Edit message support
 * - 🆕 REACTIONS (optimistic + socket sync)
 * 
 * Reactions Structure:
 * reactions: [
 *   {
 *     user: { _id, uid, nickname, avatar },
 *     emoji: "❤️",
 *     createdAt: "2024-01-06T..."
 *   }
 * ]
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
  // EDIT MESSAGE ACTIONS
  // ============================================

  editMessageLocal: (conversationId, messageId, newContent) => {
    console.log('✏️ [messageSlice] editMessageLocal:', conversationId, messageId);
    console.log('📝 New content:', newContent);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const updated = existing.map(m => {
      const id = m.messageId || m._id || m.clientMessageId;
      
      if (id === messageId) {
        return {
          ...m,
          content: newContent,
          text: newContent,
          isEdited: true,
          editedAt: new Date().toISOString(),
        };
      }
      
      return m;
    });
    
    messagesMap.set(conversationId, updated);
    set({ messages: messagesMap });
    
    console.log('✅ [messageSlice] Message edited locally:', messageId);
  },

  editMessageFromSocket: (conversationId, messageId, newContent, editedAt) => {
    console.log('📡 [messageSlice] editMessageFromSocket:', conversationId, messageId);
    
    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const updated = existing.map(m => {
      const id = m.messageId || m._id || m.clientMessageId;
      
      if (id === messageId) {
        return {
          ...m,
          content: newContent,
          text: newContent,
          isEdited: true,
          editedAt: editedAt || new Date().toISOString(),
        };
      }
      
      return m;
    });
    
    messagesMap.set(conversationId, updated);
    set({ messages: messagesMap });
    
    console.log('✅ [messageSlice] Message edited from socket:', messageId);
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
          reactions: [], // 🔥 Clear reactions on recall
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
  // 🆕 REACTION ACTIONS - OPTIMISTIC + SOCKET SYNC
  // ============================================

  /**
   * 🎭 TOGGLE REACTION (OPTIMISTIC)
   * Called immediately when user clicks emoji
   * Updates UI instantly, then waits for socket confirmation
   * 
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {string} emoji - Unicode emoji
   * @param {string} userId - Current user's _id (MongoDB)
   * @param {object} userInfo - { uid, nickname, avatar }
   */
  toggleReactionOptimistic: (conversationId, messageId, emoji, userId, userInfo) => {
    console.log('🎭 [messageSlice] toggleReactionOptimistic:', {
      conversationId,
      messageId,
      emoji,
      userId,
    });

    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const updated = existing.map(m => {
      const id = m.messageId || m._id || m.clientMessageId;
      
      if (id !== messageId) return m;

      // Get current reactions (ensure it's an array)
      const currentReactions = Array.isArray(m.reactions) ? [...m.reactions] : [];
      
      // Find existing reaction from this user with this emoji
      const existingIndex = currentReactions.findIndex(
        r => r.user?.uid === userId && r.emoji === emoji
      );

      let newReactions;
      
      if (existingIndex !== -1) {
        // Remove reaction (toggle off)
        newReactions = currentReactions.filter((_, idx) => idx !== existingIndex);
        console.log('➖ [messageSlice] Removing reaction (optimistic)');
      } else {
        // Add reaction (toggle on)
        newReactions = [
          ...currentReactions,
          {
            user: {
              _id: userId,
              uid: userInfo.uid,
              nickname: userInfo.nickname,
              avatar: userInfo.avatar,
            },
            emoji,
            createdAt: new Date().toISOString(),
            _optimistic: true, // 🔥 Mark as optimistic
          }
        ];
        console.log('➕ [messageSlice] Adding reaction (optimistic)');
      }

      return {
        ...m,
        reactions: newReactions,
      };
    });
    
    messagesMap.set(conversationId, updated);
    set({ messages: messagesMap });
    
    console.log('✅ [messageSlice] Optimistic reaction update applied');
  },

  /**
   * 🎭 SET REACTIONS (FINAL STATE FROM SOCKET)
   * Overwrites optimistic state with server truth
   * Called when receiving 'message:reaction:update' from backend
   * 
   * @param {string} conversationId - Conversation ID
   * @param {string} messageId - Message ID
   * @param {Array} reactions - Final reactions array from backend
   */
  setReactionsFinal: (conversationId, messageId, reactions) => {
    console.log('📡 [messageSlice] setReactionsFinal:', {
      conversationId,
      messageId,
      reactionsCount: reactions.length,
    });

    const messagesMap = new Map(get().messages);
    const existing = messagesMap.get(conversationId) || [];
    
    const updated = existing.map(m => {
      const id = m.messageId || m._id || m.clientMessageId;
      
      if (id === messageId) {
        return {
          ...m,
          reactions: reactions, // 🔥 Overwrite with server truth
        };
      }
      
      return m;
    });
    
    messagesMap.set(conversationId, updated);
    set({ messages: messagesMap });
    
    console.log('✅ [messageSlice] Final reactions set from socket');
  },

  // ============================================
  // READ RECEIPTS ACTIONS
  // ============================================

  updateReadReceipt: (conversationId, userUid, lastSeenMessageId, userInfo = {}) => {
    console.log('📖 [messageSlice] updateReadReceipt:', {
      conversationId,
      userUid,
      lastSeenMessageId,
      userInfo,
    });

    const receiptsMap = new Map(get().readReceipts);
    
    let conversationReceipts = receiptsMap.get(conversationId);
    if (!conversationReceipts) {
      conversationReceipts = new Map();
      receiptsMap.set(conversationId, conversationReceipts);
    } else {
      conversationReceipts = new Map(conversationReceipts);
    }

    conversationReceipts.forEach((users, messageId) => {
      const filtered = users.filter(u => u.userUid !== userUid);
      
      if (filtered.length === 0) {
        conversationReceipts.delete(messageId);
      } else {
        conversationReceipts.set(messageId, filtered);
      }
    });

    const existingUsers = conversationReceipts.get(lastSeenMessageId) || [];
    const userExists = existingUsers.some(u => u.userUid === userUid);
    
    if (!userExists) {
      const newUser = {
        userUid,
        avatar: userInfo.avatar || null,
        nickname: userInfo.nickname || userUid,
        readAt: userInfo.readAt || new Date().toISOString(),
      };
      
      conversationReceipts.set(lastSeenMessageId, [...existingUsers, newUser]);
      
      console.log('✅ [messageSlice] User added to lastSeenMessage:', {
        messageId: lastSeenMessageId,
        userUid,
        readAt: newUser.readAt,
        totalUsers: existingUsers.length + 1,
      });
    }

    receiptsMap.set(conversationId, conversationReceipts);
    set({ readReceipts: receiptsMap });
  },

  getReadReceipts: (conversationId, messageId) => {
    const receiptsMap = get().readReceipts;
    const conversationReceipts = receiptsMap.get(conversationId);
    
    if (!conversationReceipts) return [];
    
    return conversationReceipts.get(messageId) || [];
  },

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
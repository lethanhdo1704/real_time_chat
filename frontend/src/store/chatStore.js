// frontend/src/store/chatStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Chat Store - Central state management for chat application
 * 
 * State structure:
 * - conversations: Map<conversationId, Conversation> - All conversations
 * - conversationsOrder: string[] - Ordered conversation IDs (for sidebar)
 * - messages: Map<conversationId, Message[]> - Messages per conversation
 * - activeConversationId: string | null - Currently open conversation
 * - typingUsers: Map<conversationId, Set<userId>> - Who is typing where
 * - optimisticMessages: Map<tempId, Message> - Pending messages
 */

const useChatStore = create(
  devtools(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================
      
      // Conversations
      conversations: new Map(), // Map<conversationId, Conversation>
      conversationsOrder: [], // [conversationId, ...] sorted by lastMessageAt
      loadingConversations: false,
      conversationsError: null,

      // Messages
      messages: new Map(), // Map<conversationId, Message[]>
      loadingMessages: new Map(), // Map<conversationId, boolean>
      hasMoreMessages: new Map(), // Map<conversationId, boolean>
      messagesError: new Map(), // Map<conversationId, error>

      // UI State
      activeConversationId: null,
      
      // Typing indicators
      typingUsers: new Map(), // Map<conversationId, Set<userId>>
      
      // Optimistic updates
      optimisticMessages: new Map(), // Map<tempId, Message>
      sendingMessages: new Map(), // Map<tempId, boolean>

      // ============================================
      // CONVERSATIONS ACTIONS
      // ============================================

      /**
       * Set conversations from API
       * Sorts by lastMessageAt and stores in Map for O(1) access
       */
      setConversations: (conversations) =>
        set((state) => {
          const conversationsMap = new Map();
          
          // Convert array to Map
          conversations.forEach((conv) => {
            conversationsMap.set(conv._id, conv);
          });

          // Sort by lastMessageAt (newest first)
          const sorted = conversations
            .sort((a, b) => {
              const timeA = new Date(a.lastMessageAt || 0);
              const timeB = new Date(b.lastMessageAt || 0);
              return timeB - timeA;
            })
            .map((conv) => conv._id);

          return {
            conversations: conversationsMap,
            conversationsOrder: sorted,
            loadingConversations: false,
            conversationsError: null,
          };
        }),

      /**
       * Update a single conversation
       * Also re-sorts if lastMessageAt changed
       */
      updateConversation: (conversationId, updates) =>
        set((state) => {
          const conversations = new Map(state.conversations);
          const existing = conversations.get(conversationId);

          if (!existing) return state;

          const updated = { ...existing, ...updates };
          conversations.set(conversationId, updated);

          // Re-sort if lastMessageAt changed
          let conversationsOrder = [...state.conversationsOrder];
          if (updates.lastMessageAt || updates.lastMessage) {
            conversationsOrder = Array.from(conversations.values())
              .sort((a, b) => {
                const timeA = new Date(a.lastMessageAt || 0);
                const timeB = new Date(b.lastMessageAt || 0);
                return timeB - timeA;
              })
              .map((conv) => conv._id);
          }

          return {
            conversations,
            conversationsOrder,
          };
        }),

      /**
       * Add new conversation (e.g., when added to group)
       */
      addConversation: (conversation) =>
        set((state) => {
          const conversations = new Map(state.conversations);
          conversations.set(conversation._id, conversation);

          // Add to top of order
          const conversationsOrder = [
            conversation._id,
            ...state.conversationsOrder.filter((id) => id !== conversation._id),
          ];

          return {
            conversations,
            conversationsOrder,
          };
        }),

      /**
       * Remove conversation (e.g., left group)
       */
      removeConversation: (conversationId) =>
        set((state) => {
          const conversations = new Map(state.conversations);
          conversations.delete(conversationId);

          const conversationsOrder = state.conversationsOrder.filter(
            (id) => id !== conversationId
          );

          return {
            conversations,
            conversationsOrder,
          };
        }),

      /**
       * Set loading state for conversations
       */
      setConversationsLoading: (loading) =>
        set({ loadingConversations: loading }),

      /**
       * Set error for conversations
       */
      setConversationsError: (error) =>
        set({ conversationsError: error }),

      // ============================================
      // MESSAGES ACTIONS
      // ============================================

      /**
       * Set messages for a conversation
       * Used when initially loading messages
       */
      setMessages: (conversationId, messages, hasMore = true) =>
        set((state) => {
          const messagesMap = new Map(state.messages);
          messagesMap.set(conversationId, messages);

          const hasMoreMap = new Map(state.hasMoreMessages);
          hasMoreMap.set(conversationId, hasMore);

          const loadingMap = new Map(state.loadingMessages);
          loadingMap.set(conversationId, false);

          return {
            messages: messagesMap,
            hasMoreMessages: hasMoreMap,
            loadingMessages: loadingMap,
          };
        }),

      /**
       * Prepend older messages (pagination)
       */
      prependMessages: (conversationId, olderMessages, hasMore) =>
        set((state) => {
          const messagesMap = new Map(state.messages);
          const existing = messagesMap.get(conversationId) || [];
          
          // Prepend older messages (they come before existing)
          messagesMap.set(conversationId, [...olderMessages, ...existing]);

          const hasMoreMap = new Map(state.hasMoreMessages);
          hasMoreMap.set(conversationId, hasMore);

          const loadingMap = new Map(state.loadingMessages);
          loadingMap.set(conversationId, false);

          return {
            messages: messagesMap,
            hasMoreMessages: hasMoreMap,
            loadingMessages: loadingMap,
          };
        }),

      /**
       * Add new message to conversation
       * Used for real-time messages and optimistic updates confirmation
       */
      addMessage: (conversationId, message) =>
        set((state) => {
          const messagesMap = new Map(state.messages);
          const existing = messagesMap.get(conversationId) || [];

          // Check if message already exists (prevent duplicates)
          const exists = existing.some((m) => m._id === message._id);
          if (exists) return state;

          // Add to end (newest messages at bottom)
          messagesMap.set(conversationId, [...existing, message]);

          return {
            messages: messagesMap,
          };
        }),

      /**
       * Update existing message (for edits)
       */
      updateMessage: (conversationId, messageId, updates) =>
        set((state) => {
          const messagesMap = new Map(state.messages);
          const existing = messagesMap.get(conversationId);

          if (!existing) return state;

          const updated = existing.map((msg) =>
            msg._id === messageId ? { ...msg, ...updates } : msg
          );

          messagesMap.set(conversationId, updated);

          return {
            messages: messagesMap,
          };
        }),

      /**
       * Remove message (soft delete)
       */
      removeMessage: (conversationId, messageId) =>
        set((state) => {
          const messagesMap = new Map(state.messages);
          const existing = messagesMap.get(conversationId);

          if (!existing) return state;

          // Mark as deleted instead of removing (for UI consistency)
          const updated = existing.map((msg) =>
            msg._id === messageId
              ? { ...msg, deletedAt: new Date().toISOString() }
              : msg
          );

          messagesMap.set(conversationId, updated);

          return {
            messages: messagesMap,
          };
        }),

      /**
       * Set loading state for messages
       */
      setMessagesLoading: (conversationId, loading) =>
        set((state) => {
          const loadingMap = new Map(state.loadingMessages);
          loadingMap.set(conversationId, loading);
          return { loadingMessages: loadingMap };
        }),

      /**
       * Set error for messages
       */
      setMessagesError: (conversationId, error) =>
        set((state) => {
          const errorMap = new Map(state.messagesError);
          errorMap.set(conversationId, error);
          return { messagesError: errorMap };
        }),

      // ============================================
      // OPTIMISTIC UPDATES
      // ============================================

      /**
       * Add optimistic message (shown immediately before API confirms)
       */
      addOptimisticMessage: (tempId, message) =>
        set((state) => {
          const optimisticMessages = new Map(state.optimisticMessages);
          optimisticMessages.set(tempId, message);

          const sendingMessages = new Map(state.sendingMessages);
          sendingMessages.set(tempId, true);

          // Also add to messages for immediate UI update
          const messagesMap = new Map(state.messages);
          const existing = messagesMap.get(message.conversation) || [];
          messagesMap.set(message.conversation, [...existing, message]);

          return {
            optimisticMessages,
            sendingMessages,
            messages: messagesMap,
          };
        }),

      /**
       * Confirm optimistic message (replace tempId with real _id)
       */
      confirmOptimisticMessage: (tempId, realMessage) =>
        set((state) => {
          const optimisticMessages = new Map(state.optimisticMessages);
          const optimistic = optimisticMessages.get(tempId);
          
          if (!optimistic) return state;

          optimisticMessages.delete(tempId);

          const sendingMessages = new Map(state.sendingMessages);
          sendingMessages.delete(tempId);

          // Replace optimistic message with real one
          const messagesMap = new Map(state.messages);
          const existing = messagesMap.get(realMessage.conversation) || [];
          
          const updated = existing.map((msg) =>
            msg._id === tempId ? realMessage : msg
          );

          messagesMap.set(realMessage.conversation, updated);

          return {
            optimisticMessages,
            sendingMessages,
            messages: messagesMap,
          };
        }),

      /**
       * Remove optimistic message (on error)
       */
      removeOptimisticMessage: (tempId, conversationId) =>
        set((state) => {
          const optimisticMessages = new Map(state.optimisticMessages);
          optimisticMessages.delete(tempId);

          const sendingMessages = new Map(state.sendingMessages);
          sendingMessages.delete(tempId);

          // Remove from messages
          const messagesMap = new Map(state.messages);
          const existing = messagesMap.get(conversationId) || [];
          
          const updated = existing.filter((msg) => msg._id !== tempId);
          messagesMap.set(conversationId, updated);

          return {
            optimisticMessages,
            sendingMessages,
            messages: messagesMap,
          };
        }),

      // ============================================
      // TYPING INDICATORS
      // ============================================

      /**
       * Add typing user to conversation
       */
      addTypingUser: (conversationId, userId) =>
        set((state) => {
          const typingUsers = new Map(state.typingUsers);
          const users = typingUsers.get(conversationId) || new Set();
          users.add(userId);
          typingUsers.set(conversationId, users);

          return { typingUsers };
        }),

      /**
       * Remove typing user from conversation
       */
      removeTypingUser: (conversationId, userId) =>
        set((state) => {
          const typingUsers = new Map(state.typingUsers);
          const users = typingUsers.get(conversationId);
          
          if (!users) return state;
          
          users.delete(userId);
          
          if (users.size === 0) {
            typingUsers.delete(conversationId);
          } else {
            typingUsers.set(conversationId, users);
          }

          return { typingUsers };
        }),

      // ============================================
      // UI STATE
      // ============================================

      /**
       * Set active conversation
       */
      setActiveConversation: (conversationId) =>
        set({ activeConversationId: conversationId }),

      /**
       * Clear active conversation
       */
      clearActiveConversation: () =>
        set({ activeConversationId: null }),

      // ============================================
      // UNREAD COUNT (synced from backend)
      // ============================================

      /**
       * Update unread count for conversation
       * Called when receiving socket events
       */
      updateUnreadCount: (conversationId, unreadCount) =>
        set((state) => {
          const conversations = new Map(state.conversations);
          const conv = conversations.get(conversationId);

          if (!conv) return state;

          conversations.set(conversationId, {
            ...conv,
            unreadCount,
          });

          return { conversations };
        }),

      /**
       * Reset unread count to 0 (after marking as read)
       */
      resetUnreadCount: (conversationId) =>
        set((state) => {
          const conversations = new Map(state.conversations);
          const conv = conversations.get(conversationId);

          if (!conv) return state;

          conversations.set(conversationId, {
            ...conv,
            unreadCount: 0,
          });

          return { conversations };
        }),

      // ============================================
      // RESET
      // ============================================

      /**
       * Reset all chat state (on logout)
       */
      reset: () =>
        set({
          conversations: new Map(),
          conversationsOrder: [],
          messages: new Map(),
          activeConversationId: null,
          typingUsers: new Map(),
          optimisticMessages: new Map(),
          sendingMessages: new Map(),
          loadingConversations: false,
          loadingMessages: new Map(),
          hasMoreMessages: new Map(),
          conversationsError: null,
          messagesError: new Map(),
        }),
    }),
    {
      name: 'chat-store', // DevTools name
    }
  )
);

export default useChatStore;
// frontend/src/store/chat/resetSlice.js

/**
 * Reset Slice - Reset all chat state
 * 🔥 Updated to clear joinedConversations
 */
export const createResetSlice = (set, get) => ({
  /**
   * Reset all state (on logout)
   */
  resetStore: () => {
    console.log('🧹 [resetSlice] Resetting all state...');
    
    set({
      // User
      currentUser: null,

      // Conversations
      conversations: new Map(),
      conversationsOrder: [],
      activeConversationId: null,
      activeFriend: null,
      loadingConversations: false,
      conversationsError: null,
      hasFetchedConversations: false,

      // Messages
      messages: new Map(),
      loadingMessages: new Map(),
      hasMoreMessages: new Map(),
      messagesError: new Map(),
      optimisticMessages: new Map(),

      // Typing
      typingUsers: new Map(),

      // 🔥 NEW: Clear joined conversations
      joinedConversations: new Set(),
    });

    console.log('✅ [resetSlice] Store reset complete');
  },
});
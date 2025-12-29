// frontend/src/store/chat/resetSlice.js

/**
 * Reset Slice
 * Provides resetStore action to clear all state
 */
export const createResetSlice = (set) => ({
  // ============================================
  // ACTIONS
  // ============================================
  
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
    });
    
    console.log('✅ [resetSlice] Store reset complete');
  },
});
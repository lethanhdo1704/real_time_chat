// frontend/src/store/chat/chatStore.js
import { create } from 'zustand';
import { createUserSlice } from './userSlice';
import { createConversationSlice } from './conversationSlice';
import { createMessageSlice } from './messageSlice';
import { createTypingSlice } from './typingSlice';
import { createResetSlice } from './resetSlice';

/**
 * 🔥 Chat Store - Combined from slices
 * 
 * Architecture:
 * - userSlice: Current user state
 * - conversationSlice: Conversations list & active conversation
 * - messageSlice: Messages for all conversations
 * - typingSlice: Typing indicators
 * - joinedConversations: 🔥 NEW - Store-level lock to prevent double join
 * - resetSlice: Reset all state
 */
const useChatStore = create((set, get) => ({
  ...createUserSlice(set, get),
  ...createConversationSlice(set, get),
  ...createMessageSlice(set, get),
  ...createTypingSlice(set, get),
  
  // ============================================
  // 🔥 JOINED CONVERSATIONS LOCK
  // ============================================
  
  /**
   * Track which conversations have been joined
   * This prevents double join/fetch even if component remounts
   */
  joinedConversations: new Set(),

  /**
   * Mark a conversation as joined
   */
  markConversationJoined: (conversationId) => {
    const state = get();
    const next = new Set(state.joinedConversations);
    next.add(conversationId);
    console.log('🔒 [chatStore] Marked joined:', conversationId);
    set({ joinedConversations: next });
  },

  /**
   * Check if a conversation has been joined
   */
  hasJoinedConversation: (conversationId) => {
    return get().joinedConversations.has(conversationId);
  },

  /**
   * Mark a conversation as left (when cleanup)
   * ⚠️ Only call this when LEAVING conversation, not on every cleanup
   */
  markConversationLeft: (conversationId) => {
    const state = get();
    const next = new Set(state.joinedConversations);
    next.delete(conversationId);
    console.log('🔓 [chatStore] Marked left:', conversationId);
    set({ joinedConversations: next });
  },

  /**
   * Clear all joined conversations (on logout)
   */
  clearJoinedConversations: () => {
    console.log('🧹 [chatStore] Clearing joined conversations');
    set({ joinedConversations: new Set() });
  },

  // ============================================
  // RESET SLICE (includes clearing joined)
  // ============================================
  
  ...createResetSlice(set, get),
}));

// ============================================
// 🔥 EXPOSE TO WINDOW FOR DEBUGGING
// ============================================
if (typeof window !== 'undefined') {
  window.useChatStore = useChatStore;
  console.log('✅ [chatStore] Exposed to window for debugging');
}

export default useChatStore;  
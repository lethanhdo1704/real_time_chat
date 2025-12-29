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
 * - resetSlice: Reset all state
 */
const useChatStore = create((set, get) => ({
  ...createUserSlice(set, get),
  ...createConversationSlice(set, get),
  ...createMessageSlice(set, get),
  ...createTypingSlice(set, get),
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
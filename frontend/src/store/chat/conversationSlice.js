// frontend/src/store/chat/conversationSlice.js
import * as chatApi from '../../services/chatApi';

/**
 * Conversation Slice
 * Manages conversations list, loading, and active conversation
 */
export const createConversationSlice = (set, get) => ({
  // ============================================
  // STATE
  // ============================================
  
  conversations: new Map(),
  conversationsOrder: [],
  activeConversationId: null,
  activeFriend: null,
  loadingConversations: false,
  conversationsError: null,
  hasFetchedConversations: false,

  // ============================================
  // ACTIONS - FETCH
  // ============================================
  
  /**
   * 🔥 Fetch conversations once with store-level lock
   */
  fetchConversationsOnce: async () => {
    const { hasFetchedConversations, loadingConversations } = get();
    
    console.log('🔍 [conversationSlice] fetchConversationsOnce ENTRY:', {
      hasFetchedConversations,
      loadingConversations
    });
    
    // 🔒 Guard: Already fetched
    if (hasFetchedConversations) {
      console.log('⏭️ [conversationSlice] Already fetched, skip');
      return;
    }
    
    // 🔒 Guard: Already loading
    if (loadingConversations) {
      console.log('⏳ [conversationSlice] Already loading, skip');
      return;
    }

    console.log('🚀 [conversationSlice] Fetching conversations...');
    set({ loadingConversations: true, conversationsError: null });

    try {
      console.log('📡 [conversationSlice] Calling API...');
      const data = await chatApi.getUserConversations();
      console.log('📡 [conversationSlice] API returned:', data?.length || 0);

      const conversationsMap = new Map();
      const order = [];

      data.forEach(conv => {
        const id = conv.conversationId || conv._id;
        conversationsMap.set(id, conv);
        order.push(id);
      });

      console.log('💾 [conversationSlice] Setting state with flag = true');
      set({
        conversations: conversationsMap,
        conversationsOrder: order,
        hasFetchedConversations: true, // 🔒 LOCK
        loadingConversations: false,
      });

      console.log('✅ [conversationSlice] Conversations fetched ONCE:', data.length);
    } catch (err) {
      console.error('❌ [conversationSlice] Fetch failed:', err);
      set({ 
        conversationsError: err.message || 'Failed to load conversations',
        loadingConversations: false,
      });
    }
  },

  // ============================================
  // ACTIONS - CRUD
  // ============================================
  
  setConversations: (conversations) => {
    console.log('📋 [conversationSlice] setConversations:', conversations.length);
    
    const conversationsMap = new Map();
    const order = [];
    
    conversations.forEach(conv => {
      const id = conv.conversationId || conv._id;
      conversationsMap.set(id, conv);
      order.push(id);
    });
    
    set({
      conversations: conversationsMap,
      conversationsOrder: order,
    });
  },
  
  addConversation: (conversation) => {
    const id = conversation.conversationId || conversation._id;
    console.log('➕ [conversationSlice] addConversation:', id);
    
    const conversations = new Map(get().conversations);
    conversations.set(id, conversation);
    
    const order = [id, ...get().conversationsOrder.filter(cid => cid !== id)];
    
    set({
      conversations,
      conversationsOrder: order,
    });
  },
  
  updateConversation: (conversationId, updates) => {
    console.log('🔄 [conversationSlice] updateConversation:', conversationId);
    
    const conversations = new Map(get().conversations);
    const existing = conversations.get(conversationId);
    
    if (existing) {
      conversations.set(conversationId, {
        ...existing,
        ...updates,
      });
      
      set({ conversations });
    } else {
      console.warn('⚠️ [conversationSlice] Conversation not found:', conversationId);
    }
  },

  // ============================================
  // ACTIONS - ACTIVE CONVERSATION
  // ============================================
  
  setActiveConversation: (conversationId, options = {}) => {
    console.log('📍 [conversationSlice] setActiveConversation:', conversationId);

    const { clearFriend = false } = options;
    const updates = { activeConversationId: conversationId };

    // Create placeholder if conversation doesn't exist
    if (conversationId && !get().conversations.has(conversationId)) {
      console.log('🧩 [conversationSlice] Creating placeholder conversation');

      const conversations = new Map(get().conversations);
      conversations.set(conversationId, {
        _id: conversationId,
        conversationId,
        type: 'private',
        friend: null,
        members: [],
        unreadCount: 0,
        _placeholder: true,
      });

      updates.conversations = conversations;
    }

    if (clearFriend && conversationId) {
      updates.activeFriend = null;
    }

    set(updates);
  },

  setActiveFriend: (friend) => {
    console.log('👤 [conversationSlice] setActiveFriend:', friend?.nickname || friend?.uid);
    set({ activeFriend: friend });
  },

  // ============================================
  // ACTIONS - UNREAD
  // ============================================
  
  resetUnreadCount: (conversationId) => {
    console.log('✅ [conversationSlice] resetUnreadCount:', conversationId);
    
    const conversations = new Map(get().conversations);
    const existing = conversations.get(conversationId);
    
    if (existing) {
      conversations.set(conversationId, {
        ...existing,
        unreadCount: 0,
      });
      
      set({ conversations });
    }
  },

  // ============================================
  // ACTIONS - LOADING/ERROR
  // ============================================
  
  setConversationsLoading: (loading) => {
    set({ loadingConversations: loading });
  },
  
  setConversationsError: (error) => {
    set({ conversationsError: error });
  },
});
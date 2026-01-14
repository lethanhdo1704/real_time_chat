// frontend/src/store/chat/conversationSlice.js
import * as chatApi from "../../services/chatApi";

/**
 * Conversation Slice - IMPROVED WITH COUNTERS
 * Manages conversations list, loading, active conversation, and counters
 *
 * NEW Features:
 * ✅ Counters support (totalMessages, sharedImages, etc.)
 * ✅ Update counters from socket events
 * ✅ Better conversation ordering (move to top on update)
 * ✅ Handle non-existent conversations gracefully
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

    console.log("🔍 [conversationSlice] fetchConversationsOnce ENTRY:", {
      hasFetchedConversations,
      loadingConversations,
    });

    // 🔒 Guard: Already fetched
    if (hasFetchedConversations) {
      console.log("⏭️ [conversationSlice] Already fetched, skip");
      return;
    }

    // 🔒 Guard: Already loading
    if (loadingConversations) {
      console.log("⏳ [conversationSlice] Already loading, skip");
      return;
    }

    console.log("🚀 [conversationSlice] Fetching conversations...");
    set({ loadingConversations: true, conversationsError: null });

    try {
      console.log("📡 [conversationSlice] Calling API...");
      const data = await chatApi.getUserConversations();
      console.log("📡 [conversationSlice] API returned:", data?.length || 0);

      const conversationsMap = new Map();
      const order = [];

      data.forEach((conv) => {
        const id = conv.conversationId || conv._id;
        conversationsMap.set(id, conv);
        order.push(id);
      });

      console.log("💾 [conversationSlice] Setting state with flag = true");
      set({
        conversations: conversationsMap,
        conversationsOrder: order,
        hasFetchedConversations: true, // 🔒 LOCK
        loadingConversations: false,
      });

      console.log(
        "✅ [conversationSlice] Conversations fetched ONCE:",
        data.length
      );
    } catch (err) {
      console.error("❌ [conversationSlice] Fetch failed:", err);
      set({
        conversationsError: err.message || "Failed to load conversations",
        loadingConversations: false,
      });
    }
  },

  // ============================================
  // ACTIONS - CRUD
  // ============================================

  setConversations: (conversations) => {
    console.log(
      "📋 [conversationSlice] setConversations:",
      conversations.length
    );

    const conversationsMap = new Map();
    const order = [];

    conversations.forEach((conv) => {
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
    console.log("➕ [conversationSlice] addConversation:", id);

    const conversations = new Map(get().conversations);
    const existingOrder = get().conversationsOrder;

    // Add or update conversation
    conversations.set(id, conversation);

    // 🔥 Move to top of order (remove if exists, then add to front)
    const order = [id, ...existingOrder.filter((cid) => cid !== id)];

    set({
      conversations,
      conversationsOrder: order,
    });

    console.log("✅ [conversationSlice] Conversation added/moved to top:", id);
  },

  updateConversation: (conversationId, updates) => {
    console.log(
      "🔄 [conversationSlice] updateConversation:",
      conversationId,
      updates
    );

    const conversations = new Map(get().conversations);
    const existing = conversations.get(conversationId);

    if (existing) {
      // 🔥 Merge updates properly, including counters
      const updated = {
        ...existing,
        ...updates,
        // Preserve nested objects if not being updated
        friend: updates.friend !== undefined ? updates.friend : existing.friend,
        members:
          updates.members !== undefined ? updates.members : existing.members,
        // 🔥 NEW: Merge counters properly
        counters: updates.counters 
          ? { ...existing.counters, ...updates.counters }
          : existing.counters,
      };

      conversations.set(conversationId, updated);

      // 🔥 Move to top if lastMessage was updated
      if (updates.lastMessage || updates.lastMessageAt) {
        const existingOrder = get().conversationsOrder;
        const order = [
          conversationId,
          ...existingOrder.filter((id) => id !== conversationId),
        ];

        set({
          conversations,
          conversationsOrder: order,
        });

        console.log(
          "✅ [conversationSlice] Conversation updated and moved to top:",
          conversationId
        );
      } else {
        set({ conversations });
        console.log(
          "✅ [conversationSlice] Conversation updated (no reorder):",
          conversationId
        );
      }
    } else {
      console.warn(
        "⚠️ [conversationSlice] Conversation not found, creating placeholder:",
        conversationId
      );

      // 🔥 Create placeholder conversation if it doesn't exist
      const placeholder = {
        _id: conversationId,
        conversationId,
        type: "private",
        friend: null,
        members: [],
        unreadCount: 0,
        ...updates,
        _placeholder: true,
      };

      conversations.set(conversationId, placeholder);
      const order = [conversationId, ...get().conversationsOrder];

      set({
        conversations,
        conversationsOrder: order,
      });

      console.log(
        "✅ [conversationSlice] Placeholder conversation created:",
        conversationId
      );
    }
  },

  // ============================================
  // 🔥 NEW: UPDATE COUNTERS FROM SOCKET
  // ============================================

  /**
   * Update conversation counters from socket event
   * Called when message_received event includes updated counters
   * 
   * @param {string} conversationId - Conversation ID
   * @param {Object} counters - New counters from backend
   */
  updateCounters: (conversationId, counters) => {
    console.log("📊 [conversationSlice] updateCounters:", conversationId, counters);

    const conversations = new Map(get().conversations);
    const existing = conversations.get(conversationId);

    if (existing) {
      conversations.set(conversationId, {
        ...existing,
        counters: counters, // 🔥 Replace với counters mới từ backend
      });

      set({ conversations });

      console.log("✅ [conversationSlice] Counters updated:", {
        conversationId,
        totalMessages: counters.totalMessages,
        sharedImages: counters.sharedImages,
      });
    } else {
      console.warn(
        "⚠️ [conversationSlice] Cannot update counters - conversation not found:",
        conversationId
      );
    }
  },

  // ============================================
  // ACTIONS - ACTIVE CONVERSATION
  // ============================================

  setActiveConversation: (conversationId, options = {}) => {
    const state = get();
    const previousConversationId = state.activeConversationId;

    console.log(
      "📍 [conversationSlice] setActiveConversation:",
      conversationId
    );

    const { clearFriend = false } = options;
    const updates = { activeConversationId: conversationId };

    // 🔥 OPTIONAL: Clear previous conversation's joined state
    // This allows re-joining if user navigates back
    if (previousConversationId && previousConversationId !== conversationId) {
      if (state.markConversationLeft) {
        state.markConversationLeft(previousConversationId);
      }
    }

    // Create placeholder if conversation doesn't exist
    if (conversationId && !state.conversations.has(conversationId)) {
      console.log("🧩 [conversationSlice] Creating placeholder conversation");

      const conversations = new Map(state.conversations);
      conversations.set(conversationId, {
        _id: conversationId,
        conversationId,
        type: "private",
        friend: null,
        members: [],
        unreadCount: 0,
        counters: {
          totalMessages: 0,
          sharedImages: 0,
          sharedVideos: 0,
          sharedAudios: 0,
          sharedFiles: 0,
          sharedLinks: 0,
        },
        _placeholder: true,
      });

      const order = [conversationId, ...state.conversationsOrder];

      updates.conversations = conversations;
      updates.conversationsOrder = order;
    }

    if (clearFriend && conversationId) {
      updates.activeFriend = null;
    }

    set(updates);
  },

  setActiveFriend: (friend) => {
    console.log(
      "👤 [conversationSlice] setActiveFriend:",
      friend?.nickname || friend?.uid
    );
    set({ activeFriend: friend });
  },

  // ============================================
  // 🔥 NEW: EXIT CONVERSATION (for mobile back)
  // ============================================

  /**
   * Exit current conversation and clear active state
   * Used when user clicks back button on mobile
   */
  exitConversation: () => {
    const state = get();
    const previousConversationId = state.activeConversationId;

    console.log(
      "🚪 [conversationSlice] exitConversation:",
      previousConversationId
    );

    // Mark conversation as left (allows re-joining later)
    if (previousConversationId && state.markConversationLeft) {
      state.markConversationLeft(previousConversationId);
    }

    // Clear active state
    set({
      activeConversationId: null,
      activeFriend: null,
    });

    console.log("✅ [conversationSlice] Conversation exited, state cleared");
  },

  // ============================================
  // ACTIONS - UNREAD
  // ============================================

  resetUnreadCount: (conversationId) => {
    console.log("✅ [conversationSlice] resetUnreadCount:", conversationId);

    const conversations = new Map(get().conversations);
    const existing = conversations.get(conversationId);

    if (existing) {
      conversations.set(conversationId, {
        ...existing,
        unreadCount: 0,
      });

      set({ conversations });
      console.log("✅ [conversationSlice] Unread count reset to 0");
    } else {
      console.warn(
        "⚠️ [conversationSlice] Cannot reset unread - conversation not found:",
        conversationId
      );
    }
  },

  incrementUnreadCount: (conversationId) => {
    console.log("📈 [conversationSlice] incrementUnreadCount:", conversationId);

    const conversations = new Map(get().conversations);
    const existing = conversations.get(conversationId);

    if (existing) {
      const newUnreadCount = (existing.unreadCount || 0) + 1;

      conversations.set(conversationId, {
        ...existing,
        unreadCount: newUnreadCount,
      });

      set({ conversations });
      console.log(
        "✅ [conversationSlice] Unread count incremented:",
        newUnreadCount
      );
    } else {
      console.warn(
        "⚠️ [conversationSlice] Cannot increment - conversation not found:",
        conversationId
      );
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

  // ============================================
  // 🔥 NEW: RESET (for logout/account switch)
  // ============================================

  resetConversations: () => {
    console.log("🧹 [conversationSlice] Resetting conversations");
    set({
      conversations: new Map(),
      conversationsOrder: [],
      activeConversationId: null,
      activeFriend: null,
      loadingConversations: false,
      conversationsError: null,
      hasFetchedConversations: false,
    });
  },

  // ============================================
  // 🔥 NEW: SET CONVERSATION DETAIL (members, roles, avatars, counters)
  // ============================================

  setConversationDetail: (detail) => {
    console.log(
      "📥 [conversationSlice] setConversationDetail:",
      detail?.conversationId
    );

    const conversations = new Map(get().conversations);

    const conversationId = detail.conversationId || detail._id;
    const existing = conversations.get(conversationId) || {};

    conversations.set(conversationId, {
      ...existing, // giữ unreadCount, lastMessage, sidebar data
      ...detail, // 🔥 merge members, type, friend, counters
      _detailFetched: true,
      _placeholder: false,
    });

    set({ conversations });

    console.log(
      "✅ [conversationSlice] Conversation detail merged:",
      conversationId
    );
  },
});
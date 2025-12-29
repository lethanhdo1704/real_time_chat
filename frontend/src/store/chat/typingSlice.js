// frontend/src/store/chat/typingSlice.js

/**
 * Typing Slice
 * Manages typing indicators for all conversations
 */
export const createTypingSlice = (set, get) => ({
  // ============================================
  // STATE
  // ============================================
  
  typingUsers: new Map(),

  // ============================================
  // ACTIONS
  // ============================================
  
  addTypingUser: (conversationId, user) => {
    console.log(`🟢 [typingSlice] addTypingUser:`, {
      conversationId,
      userId: typeof user === 'string' ? user : (user.uid || user._id)
    });

    const typingMap = new Map(get().typingUsers);
    const usersSet = typingMap.get(conversationId) || new Set();
    
    // Clone Set to ensure React detects change
    const newUsersSet = new Set(usersSet);
    newUsersSet.add(user);
    
    const newTypingMap = new Map(typingMap);
    newTypingMap.set(conversationId, newUsersSet);
    
    console.log(`🟢 [typingSlice] Added user, now ${newUsersSet.size} typing`);
    
    set({ typingUsers: newTypingMap });
  },

  removeTypingUser: (conversationId, userId) => {
    console.log(`🔴 [typingSlice] removeTypingUser:`, {
      conversationId,
      userId
    });

    const typingMap = new Map(get().typingUsers);
    const usersSet = typingMap.get(conversationId);
    
    if (!usersSet) {
      console.log(`🔴 [typingSlice] No users set for conversation`);
      return;
    }
    
    // Clone Set and find user by uid
    const newUsersSet = new Set(usersSet);
    let removed = false;
    
    for (const user of newUsersSet) {
      const userIdToCheck = typeof user === 'string' ? user : (user.uid || user._id);
      
      if (userIdToCheck === userId) {
        newUsersSet.delete(user);
        removed = true;
        console.log(`🔴 [typingSlice] ✅ Removed user`);
        break;
      }
    }
    
    if (!removed) {
      console.log(`🔴 [typingSlice] ❌ User ${userId} not found`);
      return;
    }
    
    const newTypingMap = new Map(typingMap);
    
    if (newUsersSet.size === 0) {
      newTypingMap.delete(conversationId);
      console.log(`🔴 [typingSlice] Deleted empty set`);
    } else {
      newTypingMap.set(conversationId, newUsersSet);
    }
    
    set({ typingUsers: newTypingMap });
  },

  clearTypingUsers: (conversationId) => {
    console.log(`🧹 [typingSlice] clearTypingUsers:`, conversationId);
    
    const newTypingMap = new Map(get().typingUsers);
    newTypingMap.delete(conversationId);
    set({ typingUsers: newTypingMap });
  },
});
// frontend/src/store/chat/userSlice.js

/**
 * User Slice
 * Manages current user state
 */
export const createUserSlice = (set, get) => ({
  // ============================================
  // STATE
  // ============================================
  
  currentUser: null,

  // ============================================
  // ACTIONS
  // ============================================
  
  setCurrentUser: (user) => {
    console.log('👤 [userSlice] Setting currentUser:', user?.uid);
    set({ currentUser: user });
  },
});
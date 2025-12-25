// frontend/src/store/friendStore.js
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useFriendStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ============================================
        // STATE
        // ============================================
        friends: [],
        friendRequests: [],
        sentRequests: [],
        loading: false,
        error: null,
        lastFetchTime: null,
        isFetching: false,

        // ============================================
        // ACTIONS - SET DATA
        // ============================================
        
        setFriendsData: (data) => set({
          friends: data.friends || [],
          friendRequests: data.requests || [],
          sentRequests: data.sentRequests || [],
          loading: false,
          error: null,
          lastFetchTime: Date.now(),
          isFetching: false,
        }),

        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error, isFetching: false }),
        setFetching: (isFetching) => set({ isFetching }),

        // ✅ Check if cache is valid
        isCacheValid: () => {
          const state = get();
          if (!state.lastFetchTime) return false;
          const age = Date.now() - state.lastFetchTime;
          const isValid = age < CACHE_DURATION;
          console.log(`🔍 Cache check: age=${Math.round(age/1000)}s, valid=${isValid}`);
          return isValid;
        },

        // ============================================
        // FRIEND REQUEST ACTIONS
        // ============================================
        
        addFriendRequest: (request) => set((state) => {
          if (state.friendRequests.some(r => r.uid === request.uid)) {
            return state;
          }
          return {
            friendRequests: [...state.friendRequests, request]
          };
        }),

        removeFriendRequest: (uid) => set((state) => ({
          friendRequests: state.friendRequests.filter(r => r.uid !== uid)
        })),

        clearFriendRequests: () => set({ friendRequests: [] }),

        // ============================================
        // SENT REQUEST ACTIONS
        // ============================================
        
        addSentRequest: (request) => set((state) => {
          if (state.sentRequests.some(r => r.uid === request.uid)) {
            return state;
          }
          return {
            sentRequests: [...state.sentRequests, request]
          };
        }),

        removeSentRequest: (uid) => set((state) => ({
          sentRequests: state.sentRequests.filter(r => r.uid !== uid)
        })),

        // ============================================
        // FRIEND ACTIONS
        // ============================================
        
        addFriend: (friend) => set((state) => {
          if (state.friends.some(f => f.uid === friend.uid)) {
            return state;
          }
          return {
            friends: [...state.friends, friend]
          };
        }),

        removeFriend: (uid) => set((state) => ({
          friends: state.friends.filter(f => f.uid !== uid)
        })),

        updateFriend: (uid, updates) => set((state) => ({
          friends: state.friends.map(f => 
            f.uid === uid ? { ...f, ...updates } : f
          )
        })),

        // ============================================
        // COMBINED OPERATIONS
        // ============================================
        
        acceptFriendRequest: (uid, friendData) => set((state) => ({
          friendRequests: state.friendRequests.filter(r => r.uid !== uid),
          friends: state.friends.some(f => f.uid === uid) 
            ? state.friends 
            : [...state.friends, friendData]
        })),

        sendFriendRequest: (request) => set((state) => ({
          sentRequests: state.sentRequests.some(r => r.uid === request.uid)
            ? state.sentRequests
            : [...state.sentRequests, request]
        })),

        // ============================================
        // GETTERS
        // ============================================
        
        getFriendRequestCount: () => get().friendRequests.length,

        isFriend: (uid) => get().friends.some(f => f.uid === uid),

        hasPendingRequest: (uid) => {
          const state = get();
          return state.friendRequests.some(r => r.uid === uid) ||
                 state.sentRequests.some(r => r.uid === uid);
        },

        getFriendshipStatus: (uid) => {
          const state = get();
          
          if (state.friends.some(f => f.uid === uid)) {
            return 'friends';
          }
          if (state.sentRequests.some(r => r.uid === uid)) {
            return 'request_sent';
          }
          if (state.friendRequests.some(r => r.uid === uid)) {
            return 'request_received';
          }
          return 'none';
        },

        // ============================================
        // RESET - ✅ CHUẨN KIẾN TRÚC
        // ============================================
        
        reset: () => set({
          friends: [],
          friendRequests: [],
          sentRequests: [],
          loading: false,
          error: null,
          lastFetchTime: null,
          isFetching: false,
        })
      }),
      {
        name: 'friend-storage',
        partialize: (state) => ({
          friends: state.friends,
          friendRequests: state.friendRequests,
          sentRequests: state.sentRequests,
          lastFetchTime: state.lastFetchTime,
        }),
      }
    ),
    { name: 'FriendStore' }
  )
);

export default useFriendStore;
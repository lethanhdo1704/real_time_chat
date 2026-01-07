// frontend/src/user/store/friendStore.js
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
        unseenCount: 0,

        // ============================================
        // ACTIONS - SET DATA
        // ============================================
        
        setFriendsData: (data) => {
          const unseenCount = (data.requests || []).filter(r => !r.seenAt).length;
          
          // ✅ Map friends with presence fields
          const friendsWithPresence = (data.friends || []).map(friend => ({
            ...friend,
            isOnline: friend.isOnline ?? false,
            lastSeen: friend.lastSeen ?? null,
          }));
          
          set({
            friends: friendsWithPresence,
            friendRequests: data.requests || [],
            sentRequests: data.sentRequests || [],
            loading: false,
            error: null,
            lastFetchTime: Date.now(),
            unseenCount,
          });
        },

        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),

        // ✅ Check if cache is valid
        isCacheValid: () => {
          const state = get();
          if (!state.lastFetchTime) return false;
          const age = Date.now() - state.lastFetchTime;
          return age < CACHE_DURATION;
        },
        
        addFriendRequest: (request) => set((state) => {
          if (state.friendRequests.some(r => r.uid === request.uid)) {
            return state;
          }
          
          const newUnseenCount = !request.seenAt ? state.unseenCount + 1 : state.unseenCount;
          
          return {
            friendRequests: [...state.friendRequests, request],
            unseenCount: newUnseenCount
          };
        }),

        removeFriendRequest: (uid) => set((state) => {
          const removedRequest = state.friendRequests.find(r => r.uid === uid);
          const newUnseenCount = removedRequest && !removedRequest.seenAt 
            ? Math.max(0, state.unseenCount - 1) 
            : state.unseenCount;
          
          return {
            friendRequests: state.friendRequests.filter(r => r.uid !== uid),
            unseenCount: newUnseenCount
          };
        }),

        clearFriendRequests: () => set({ 
          friendRequests: [],
          unseenCount: 0
        }),

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
          
          // ✅ Add friend with presence fields
          const friendWithPresence = {
            ...friend,
            isOnline: friend.isOnline ?? false,
            lastSeen: friend.lastSeen ?? null,
          };
          
          return {
            friends: [...state.friends, friendWithPresence]
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
        // 🆕 PRESENCE ACTIONS
        // ============================================
        
        /**
         * Update friend presence status
         * Called from socket listeners
         */
        updateFriendPresence: (uid, presenceData) => set((state) => {
          const friend = state.friends.find(f => f.uid === uid);
          
          if (!friend) {
            console.warn(`[friendStore] Friend ${uid} not found for presence update`);
            return state;
          }
          
          console.log(`🔄 [friendStore] Updating presence for ${uid}:`, presenceData);
          
          return {
            friends: state.friends.map(f => 
              f.uid === uid 
                ? { ...f, ...presenceData }
                : f
            )
          };
        }),

        /**
         * Set friend online
         * WHY: lastSeen = null when online (they haven't LEFT yet)
         */
        setFriendOnline: (uid) => set((state) => {
          console.log(`🟢 [friendStore] Setting ${uid} ONLINE`);
          
          return {
            friends: state.friends.map(f => 
              f.uid === uid 
                ? { ...f, isOnline: true, lastSeen: null }
                : f
            )
          };
        }),

        /**
         * Set friend offline with lastSeen
         * WHY: lastSeen = when they LEFT (disconnected)
         */
        setFriendOffline: (uid, lastSeen) => set((state) => {
          console.log(`⚪ [friendStore] Setting ${uid} OFFLINE, lastSeen:`, lastSeen);
          
          return {
            friends: state.friends.map(f => 
              f.uid === uid 
                ? { ...f, isOnline: false, lastSeen }
                : f
            )
          };
        }),

        // ============================================
        // COMBINED OPERATIONS
        // ============================================
        
        acceptFriendRequest: (uid, friendData) => set((state) => {
          const acceptedRequest = state.friendRequests.find(r => r.uid === uid);
          const newUnseenCount = acceptedRequest && !acceptedRequest.seenAt
            ? Math.max(0, state.unseenCount - 1)
            : state.unseenCount;
          
          // ✅ Add presence fields when accepting request
          const friendWithPresence = {
            ...friendData,
            isOnline: friendData.isOnline ?? false,
            lastSeen: friendData.lastSeen ?? null,
          };
          
          return {
            friendRequests: state.friendRequests.filter(r => r.uid !== uid),
            friends: state.friends.some(f => f.uid === uid) 
              ? state.friends 
              : [...state.friends, friendWithPresence],
            unseenCount: newUnseenCount
          };
        }),

        sendFriendRequest: (request) => set((state) => ({
          sentRequests: state.sentRequests.some(r => r.uid === request.uid)
            ? state.sentRequests
            : [...state.sentRequests, request]
        })),

        // ============================================
        // SEEN TRACKING ACTIONS
        // ============================================
        
        markRequestAsSeen: (requestId) => set((state) => {
          const request = state.friendRequests.find(r => r._id === requestId);
          
          if (!request || request.seenAt) {
            return state;
          }
          
          return {
            friendRequests: state.friendRequests.map(r =>
              r._id === requestId ? { ...r, seenAt: new Date() } : r
            ),
            unseenCount: Math.max(0, state.unseenCount - 1)
          };
        }),

        markAllRequestsAsSeen: () => set((state) => ({
          friendRequests: state.friendRequests.map(r => ({
            ...r,
            seenAt: r.seenAt || new Date()
          })),
          unseenCount: 0
        })),

        setUnseenCount: (count) => set({ unseenCount: count }),

        // ============================================
        // GETTERS
        // ============================================
        
        getFriendRequestCount: () => get().friendRequests.length,
        getUnseenRequestCount: () => get().unseenCount,
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

        // 🆕 Get friend by uid
        getFriend: (uid) => {
          const state = get();
          return state.friends.find(f => f.uid === uid);
        },

        // 🆕 Get online friends count
        getOnlineFriendsCount: () => {
          const state = get();
          return state.friends.filter(f => f.isOnline === true).length;
        },

        // 🆕 Check if friend is online
        isFriendOnline: (uid) => {
          const state = get();
          const friend = state.friends.find(f => f.uid === uid);
          return friend?.isOnline === true;
        },

        // ============================================
        // RESET
        // ============================================
        
        reset: () => set({
          friends: [],
          friendRequests: [],
          sentRequests: [],
          loading: false,
          error: null,
          lastFetchTime: null,
          unseenCount: 0,
        })
      }),
      {
        name: 'friend-storage',
        partialize: (state) => ({
          friends: state.friends,
          friendRequests: state.friendRequests,
          sentRequests: state.sentRequests,
          lastFetchTime: state.lastFetchTime,
          unseenCount: state.unseenCount,
        }),
      }
    ),
    { name: 'FriendStore' }
  )
);

export default useFriendStore;
// frontend/src/store/friendStore.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import * as friendService from '../services/friendService';

/**
 * Friend Store - Central state management for friends & requests
 * ✅ FIXED: Prevent duplicate API calls & 429 errors
 */

// ✅ Global flag để chặn hoàn toàn concurrent calls
let fetchPromise = null;

const useFriendStore = create(
  devtools(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================
      
      friends: [],
      requests: [],
      sentRequests: [],
      unreadCount: 0,
      
      loading: false,
      error: null,
      lastFetch: null,

      // ============================================
      // FETCH FRIENDS & REQUESTS - ✅ FIXED
      // ============================================

      fetchFriends: async (forceRefresh = false) => {
        const state = get();
        
        // ✅ FIX 1: Reuse existing promise (chặn React Strict Mode duplicate)
        if (fetchPromise && !forceRefresh) {
          console.log('⏭️  Reusing existing fetch promise');
          return fetchPromise;
        }
        
        // ✅ FIX 2: Cache với TTL dài hơn (5 phút thay vì 30s)
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        if (!forceRefresh && state.lastFetch) {
          const timeSinceLastFetch = Date.now() - state.lastFetch;
          if (timeSinceLastFetch < CACHE_TTL) {
            console.log('⏭️  Using cached friend data', {
              age: Math.round(timeSinceLastFetch / 1000) + 's',
              ttl: Math.round(CACHE_TTL / 1000) + 's'
            });
            return;
          }
        }

        // ✅ FIX 3: Check loading state (double protection)
        if (state.loading) {
          console.log('⏭️  Friend fetch already in progress');
          return;
        }

        set({ loading: true, error: null });

        // ✅ FIX 4: Store promise để reuse
        fetchPromise = friendService.getFriendsAndRequests()
          .then((data) => {
            set({
              friends: data.friends || [],
              requests: data.requests || [],
              sentRequests: data.sentRequests || [],
              unreadCount: (data.requests || []).length,
              loading: false,
              error: null,
              lastFetch: Date.now(),
            });

            console.log('✅ Friends loaded:', {
              friends: data.friends?.length || 0,
              requests: data.requests?.length || 0,
              sent: data.sentRequests?.length || 0,
            });

            return data;
          })
          .catch((err) => {
            console.error('❌ Error fetching friends:', err);
            
            const errorMessage = err.response?.status === 429
              ? 'Too many requests. Please wait a moment.'
              : err.message || 'Failed to load friends';
            
            set({
              loading: false,
              error: errorMessage,
            });
            
            throw err;
          })
          .finally(() => {
            // ✅ Reset promise after completion
            fetchPromise = null;
          });

        return fetchPromise;
      },

      // ============================================
      // FRIEND REQUESTS ACTIONS
      // ============================================

      sendRequest: async (friendUid) => {
        try {
          const result = await friendService.sendFriendRequest(friendUid);
          
          set((state) => ({
            sentRequests: [...state.sentRequests, result.request],
          }));

          console.log('✅ Friend request sent');
          return result;
        } catch (err) {
          console.error('❌ Error sending request:', err);
          throw err;
        }
      },

      acceptRequest: async (friendUid) => {
        try {
          const result = await friendService.acceptFriendRequest(friendUid);
          
          set((state) => ({
            requests: state.requests.filter(r => r.uid !== friendUid),
            friends: [...state.friends, result.friend],
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));

          console.log('✅ Friend request accepted');
          
          // Refresh sau 1s để sync
          setTimeout(() => get().fetchFriends(true), 1000);
          
          return result;
        } catch (err) {
          console.error('❌ Error accepting request:', err);
          get().fetchFriends(true);
          throw err;
        }
      },

      rejectRequest: async (friendUid) => {
        try {
          await friendService.rejectFriendRequest(friendUid);
          
          set((state) => ({
            requests: state.requests.filter(r => r.uid !== friendUid),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }));

          console.log('✅ Friend request rejected');
          return true;
        } catch (err) {
          console.error('❌ Error rejecting request:', err);
          get().fetchFriends(true);
          throw err;
        }
      },

      cancelRequest: async (friendUid) => {
        try {
          await friendService.cancelFriendRequest(friendUid);
          
          set((state) => ({
            sentRequests: state.sentRequests.filter(r => r.uid !== friendUid),
          }));

          console.log('✅ Friend request cancelled');
          return true;
        } catch (err) {
          console.error('❌ Error cancelling request:', err);
          get().fetchFriends(true);
          throw err;
        }
      },

      unfriend: async (friendUid) => {
        try {
          await friendService.unfriend(friendUid);
          
          set((state) => ({
            friends: state.friends.filter(f => f.uid !== friendUid),
          }));

          console.log('✅ Unfriended user');
          return true;
        } catch (err) {
          console.error('❌ Error unfriending:', err);
          get().fetchFriends(true);
          throw err;
        }
      },

      // ============================================
      // SOCKET EVENT HANDLERS
      // ============================================

      handleNewRequest: (request) => {
        set((state) => ({
          requests: [request, ...state.requests],
          unreadCount: state.unreadCount + 1,
        }));
        
        console.log('🔔 New friend request received:', request.uid);
      },

      handleRequestAccepted: (friendship) => {
        set((state) => ({
          friends: [friendship, ...state.friends],
          sentRequests: state.sentRequests.filter(
            r => r.uid !== friendship.uid
          ),
        }));
        
        console.log('🎉 Friend request accepted:', friendship.uid);
      },

      handleRequestRejected: (friendUid) => {
        set((state) => ({
          sentRequests: state.sentRequests.filter(r => r.uid !== friendUid),
        }));
        
        console.log('❌ Friend request rejected:', friendUid);
      },

      handleUnfriended: (friendUid) => {
        set((state) => ({
          friends: state.friends.filter(f => f.uid !== friendUid),
        }));
        
        console.log('💔 Unfriended by:', friendUid);
      },

      // ============================================
      // UTILITY
      // ============================================

      markRequestsAsRead: () => {
        set({ unreadCount: 0 });
      },

      getFriend: (friendUid) => {
        return get().friends.find(f => f.uid === friendUid);
      },

      isFriend: (friendUid) => {
        return get().friends.some(f => f.uid === friendUid);
      },

      hasIncomingRequest: (friendUid) => {
        return get().requests.some(r => r.uid === friendUid);
      },

      hasSentRequest: (friendUid) => {
        return get().sentRequests.some(r => r.uid === friendUid);
      },

      reset: () => {
        fetchPromise = null; // ✅ Reset global promise
        
        set({
          friends: [],
          requests: [],
          sentRequests: [],
          unreadCount: 0,
          loading: false,
          error: null,
          lastFetch: null,
        });
        
        console.log('🔄 Friend store reset');
      },
    }),
    {
      name: 'friend-store',
    }
  )
);

export default useFriendStore;
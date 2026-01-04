// frontend/src/hooks/chat/useMessages.js - WITH ALL FIXES

import { useEffect, useCallback, useRef } from 'react';
import useChatStore from '../../store/chat/chatStore';
import chatApi from '../../services/chatApi';

/**
 * 🔥 useMessages Hook - COMPLETE WITH ALL FIXES
 * 
 * RESPONSIBILITIES:
 * ✅ Fetch messages (cursor-based pagination)
 * ✅ Handle message_received (add to chat + update lastMessage)
 * ✅ Handle message_recalled (update UI + update lastMessage)
 * ✅ Handle message_deleted (remove from chat)
 * ✅ Handle message_edited (update content)
 * ✅ Handle message_read_receipt (show avatars)
 * ✅ Join/leave conversation socket rooms
 * ✅ Initialize read receipts from conversation members
 */

const EMPTY_ARRAY = [];

const useMessages = (conversationId) => {
  const hasFetchedRef = useRef(false);
  const messagesEndRef = useRef(null);
  
  // 🔥 CURSOR-BASED: Track oldest message ID
  const oldestMessageIdRef = useRef(null);

  // ============================================
  // STABLE SELECTORS
  // ============================================

  const messages = useChatStore((state) => {
    if (!conversationId) return EMPTY_ARRAY;
    return state.messages.get(conversationId) || EMPTY_ARRAY;
  });

  const loading = useChatStore((state) => {
    if (!conversationId) return false;
    return state.loadingMessages.get(conversationId) || false;
  });

  const hasMore = useChatStore((state) => {
    if (!conversationId) return true;
    return state.hasMoreMessages.get(conversationId) ?? true;
  });

  const error = useChatStore((state) => {
    if (!conversationId) return null;
    return state.messagesError.get(conversationId);
  });

  const hasMessages = messages.length > 0;

  // ============================================
  // 🆕 HELPER: Initialize read receipts from members
  // ============================================
  const initializeReadReceipts = useCallback((members, currentUserUid) => {
    console.log('🔄 [useMessages] Initializing read receipts from members:', {
      conversationId,
      membersCount: members?.length,
      currentUserUid,
    });

    if (!members || members.length === 0) {
      console.warn('⚠️ [useMessages] No members data to initialize receipts');
      return;
    }

    const { updateReadReceipt } = useChatStore.getState();

    // Process each member
    members.forEach((member) => {
      // 🔥 FIX: Handle both structures
      // From detail API: { user: {...}, lastSeenMessage: ... }
      // From sidebar: { uid, nickname, avatar, lastSeenMessage: ... }
      const memberUser = member.user || member;
      const lastSeenMessageId = member.lastSeenMessage;
      const lastSeenAt = member.lastSeenAt;

      console.log('🔍 [useMessages] Checking member:', {
        hasUser: !!member.user,
        hasMemberUid: !!member.uid,
        memberUserUid: memberUser?.uid,
        lastSeenMessageId,
        lastSeenAt,
        currentUserUid,
        isCurrentUser: memberUser?.uid === currentUserUid,
        willSkip: !lastSeenMessageId || !memberUser || memberUser.uid === currentUserUid,
      });

      // Skip if no lastSeenMessage or if it's current user
      if (!lastSeenMessageId || !memberUser || memberUser.uid === currentUserUid) {
        console.log('⏭️ [useMessages] Skipping member:', memberUser?.uid || 'NO_UID');
        return;
      }

      console.log('📖 [useMessages] Processing member receipt:', {
        userUid: memberUser.uid,
        nickname: memberUser.nickname,
        lastSeenMessage: lastSeenMessageId,
        lastSeenAt: lastSeenAt,
      });

      // Update store with this member's read receipt
      updateReadReceipt(
        conversationId,
        memberUser.uid,
        lastSeenMessageId,
        {
          avatar: memberUser.avatar,
          nickname: memberUser.nickname,
          readAt: lastSeenAt,
        }
      );
    });

    console.log('✅ [useMessages] Read receipts initialized from members');
  }, [conversationId]);

  // ============================================
  // FETCH MESSAGES (CURSOR-BASED)
  // ============================================

  const fetchMessages = useCallback(
    async (isInitial = false) => {
      if (!conversationId) return;

      if (!isInitial && !oldestMessageIdRef.current) {
        console.log('⏭️ [useMessages] No cursor available, skipping');
        return;
      }

      try {
        const { setMessagesLoading, setMessagesError, setMessages, prependMessages } = 
          useChatStore.getState();

        setMessagesLoading(conversationId, true);
        setMessagesError(conversationId, null);

        const params = { limit: 50 };
        if (!isInitial && oldestMessageIdRef.current) {
          params.before = oldestMessageIdRef.current;
        }

        console.log('📥 [useMessages] Fetching messages:', {
          conversationId,
          isInitial,
          before: params.before || 'none',
          limit: params.limit,
        });

        const data = await chatApi.getMessages(conversationId, params);

        console.log('📦 [useMessages] API returned:', {
          messagesCount: data.messages.length,
          hasMore: data.hasMore,
        });

        if (data.messages.length === 0) {
          console.log('⏹️ [useMessages] No more messages');
          setMessagesLoading(conversationId, false);
          const { setHasMoreMessages } = useChatStore.getState();
          setHasMoreMessages(conversationId, false);
          return;
        }

        const oldestMessage = data.messages[0];
        oldestMessageIdRef.current = oldestMessage?.messageId || oldestMessage?._id;

        console.log('🔖 [useMessages] Updated cursor:', oldestMessageIdRef.current);

        if (isInitial) {
          setMessages(conversationId, data.messages, data.hasMore);
        } else {
          prependMessages(conversationId, data.messages, data.hasMore);
        }

        hasFetchedRef.current = true;
        
        console.log(`✅ [useMessages] Loaded ${data.messages.length} messages`);
        
        return data;
      } catch (err) {
        console.error('❌ [useMessages] Failed to fetch messages:', err);
        
        const { setMessagesError } = useChatStore.getState();
        setMessagesError(conversationId, err.message || 'Failed to load messages');
      } finally {
        const { setMessagesLoading } = useChatStore.getState();
        setMessagesLoading(conversationId, false);
      }
    },
    [conversationId]
  );

  // ============================================
  // LOAD MORE (CURSOR-BASED)
  // ============================================

  const loadMore = useCallback(() => {
    if (loading || !hasMore) {
      console.log('⏭️ [useMessages] Skip loadMore:', { loading, hasMore });
      return;
    }

    console.log('📄 [useMessages] Loading more messages...');
    fetchMessages(false);
  }, [loading, hasMore, fetchMessages]);

  // ============================================
  // SCROLL TO BOTTOM
  // ============================================

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // ============================================
  // 🔥 MAIN EFFECT - STORE-LEVEL LOCK
  // ============================================

  useEffect(() => {
    if (!conversationId) return;

    const { hasJoinedConversation, markConversationJoined, currentUser } = useChatStore.getState();
    
    if (hasJoinedConversation(conversationId)) {
      console.log('⏭️ [useMessages] Already joined at store level, skip');
      return;
    }

    console.log('🔌 [useMessages] Initializing conversation:', conversationId);

    markConversationJoined(conversationId);

    const getSocketSafe = async () => {
      const { getSocket } = await import('../../services/socketService');
      return getSocket();
    };

    let socket = null;
    let cleanup = null;

    const initialize = async () => {
      socket = await getSocketSafe();

      if (!socket) {
        console.warn('⚠️ [useMessages] Socket not available');
        return;
      }

      // 1. Join room
      console.log('🔌 [useMessages] Joining room:', conversationId);
      socket.emit('join_conversation', { conversationId });

      // 2. Setup listeners
      console.log('🔌 [useMessages] Setting up message listeners');

      // ============================================
      // MESSAGE_RECEIVED - WITH CONVERSATION UPDATE
      // ============================================
      const handleMessageReceived = (data) => {
        console.log('🔥 [useMessages] message_received RAW:', data);
        
        const { message } = data;

        if (!message) {
          console.error('❌ [useMessages] No message in data');
          return;
        }

        const messageConvId = message.conversation || message.conversationId;
        if (!messageConvId || messageConvId !== conversationId) {
          console.warn('⚠️ [useMessages] Message for different conversation');
          return;
        }

        const { currentUser, addMessage, updateConversation, conversations } = useChatStore.getState();

        // Ignore own messages (already added optimistically)
        if (currentUser && message.sender?.uid === currentUser.uid) {
          console.log('⏭️ [useMessages] Ignoring own message:', message.messageId);
          return;
        }

        console.log('✅ [useMessages] New message received:', message.messageId);

        // Add message to messages list
        addMessage(conversationId, message);
        
        // ============================================
        // 🔥 UPDATE CONVERSATION'S lastMessage
        // ============================================
        const conversation = conversations.get(conversationId);
        
        if (conversation) {
          console.log('🔥 [useMessages] Updating conversation lastMessage');
          
          updateConversation(conversationId, {
            lastMessage: {
              messageId: message.messageId || message._id,
              _id: message._id,
              content: message.content,
              type: message.type,
              sender: {
                uid: message.sender?.uid,
                nickname: message.sender?.nickname,
                avatar: message.sender?.avatar,
              },
              createdAt: message.createdAt,
              isRecalled: false,
            },
            lastMessageAt: message.createdAt, // Update timestamp
          });
          
          console.log('✅ [useMessages] Conversation lastMessage updated');
        }
        
        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 100);
      };

      // ============================================
      // 🔥 MESSAGE_RECALLED - WITH CONVERSATION UPDATE
      // ============================================
      const handleMessageRecalled = (data) => {
        console.log('🔥 [useMessages] message_recalled:', data);
        const { messageId, conversationId: dataConvId, recalledBy, recalledAt } = data;
        
        if (!messageId) return;
        if (dataConvId && dataConvId !== conversationId) return;

        console.log('↩️ [useMessages] Message recalled:', messageId);

        // 1. Update message in messages list
        const { updateMessage } = useChatStore.getState();
        updateMessage(conversationId, messageId, {
          isRecalled: true,
          recalledBy,
          recalledAt,
          content: "", // Clear content
        });

        // ============================================
        // 🔥 2. UPDATE CONVERSATION'S lastMessage IF NEEDED
        // ============================================
        const { conversations, updateConversation } = useChatStore.getState();
        const conversation = conversations.get(conversationId);
        
        if (conversation?.lastMessage) {
          const lastMessageId = conversation.lastMessage.messageId || conversation.lastMessage._id;
          
          // Check if recalled message is the last message
          if (lastMessageId === messageId) {
            console.log('🔥 [useMessages] Recalled message IS the lastMessage - updating conversation');
            
            updateConversation(conversationId, {
              lastMessage: {
                ...conversation.lastMessage,
                isRecalled: true,
                content: "", // Clear content for preview
                recalledAt,
                recalledBy,
              },
            });
            
            console.log('✅ [useMessages] Conversation lastMessage updated to recalled state');
          } else {
            console.log('⏭️ [useMessages] Recalled message is NOT lastMessage, no conversation update needed');
          }
        } else {
          console.log('⚠️ [useMessages] No lastMessage in conversation object');
        }
      };

      // ============================================
      // MESSAGE_EDITED
      // ============================================
      const handleMessageEdited = (data) => {
        console.log('🔥 [useMessages] message_edited:', data);
        const { message } = data;
        if (!message) return;

        const messageConvId = 
          data.conversationId || 
          message.conversation || 
          message.conversationId;

        if (!messageConvId || messageConvId !== conversationId) return;

        console.log('✏️ [useMessages] Message edited:', message.messageId);

        const { updateMessage } = useChatStore.getState();
        updateMessage(conversationId, message.messageId, {
          content: message.content,
          editedAt: message.editedAt,
        });
      };

      // ============================================
      // MESSAGE_DELETED
      // ============================================
      const handleMessageDeleted = (data) => {
        console.log('🔥 [useMessages] message_deleted:', data);
        const { messageId, conversationId: dataConvId } = data;
        
        if (!messageId) return;
        if (dataConvId && dataConvId !== conversationId) return;

        console.log('🗑️ [useMessages] Message deleted:', messageId);

        const { removeMessage } = useChatStore.getState();
        removeMessage(conversationId, messageId);
      };

      // ============================================
      // 🆕 MESSAGE_READ_RECEIPT
      // ============================================
      const handleMessageReadReceipt = (data) => {
        console.log('🔥🔥🔥 [useMessages] message_read_receipt RECEIVED:', data);
        
        const { 
          conversationId: receiptConvId, 
          userUid, 
          lastSeenMessageId,
          timestamp,
        } = data;

        // Ignore if not for current conversation
        if (receiptConvId !== conversationId) {
          console.log('⏭️ [useMessages] Receipt for different conversation, ignoring');
          return;
        }

        console.log('✅ [useMessages] Receipt is for current conversation');
        console.log('✅ [useMessages] Receipt is from user:', userUid);

        // Get user info from conversation members
        const { conversations } = useChatStore.getState();
        const conversation = conversations.get(conversationId);
        
        let userInfo = { 
          avatar: null, 
          nickname: userUid,
          readAt: timestamp,
        };

        if (conversation?.members) {
          console.log('🔍 [useMessages] Searching in members:', conversation.members.length);
          console.log('🔍 [useMessages] Looking for userUid:', userUid);
          
          // 🔥 TRY MULTIPLE STRUCTURES
          let member = null;
          
          // Try: member.user.uid (from detail API)
          member = conversation.members.find(m => m.user?.uid === userUid);
          
          // Try: member.uid (from sidebar list)
          if (!member) {
            member = conversation.members.find(m => m.uid === userUid);
          }
          
          if (member) {
            // Get user info from either structure
            const user = member.user || member;
            userInfo = {
              avatar: user.avatar,
              nickname: user.nickname || user.fullName || userUid,
              readAt: timestamp,
            };
            console.log('✅ [useMessages] Found member info:', userInfo);
          } else {
            console.warn('⚠️ [useMessages] Member not found in conversation.members');
            console.log('Available members UIDs:', conversation.members.map(m => 
              m.user?.uid || m.uid || 'NO_UID'
            ));
          }
        } else {
          console.warn('⚠️ [useMessages] No members in conversation object');
        }

        // Update read receipt in store
        const { updateReadReceipt } = useChatStore.getState();
        
        console.log('📖 [useMessages] Calling updateReadReceipt with:', {
          conversationId,
          userUid,
          lastSeenMessageId,
          userInfo,
        });
        
        updateReadReceipt(
          conversationId,
          userUid,
          lastSeenMessageId,
          userInfo
        );

        console.log('✅✅✅ [useMessages] Read receipt updated in store!');
      };

      // ============================================
      // REGISTER ALL LISTENERS
      // ============================================
      socket.on('message_received', handleMessageReceived);
      socket.on('message_recalled', handleMessageRecalled);
      socket.on('message_edited', handleMessageEdited);
      socket.on('message_deleted', handleMessageDeleted);
      socket.on('message_read_receipt', handleMessageReadReceipt);

      console.log('✅ [useMessages] All message listeners registered (including read receipt)');

      // 3. Fetch initial messages
      hasFetchedRef.current = false;
      oldestMessageIdRef.current = null;
      await fetchMessages(true);

      // 4. Initialize read receipts from conversation members
      const { conversations } = useChatStore.getState();
      const conversation = conversations.get(conversationId);
      
      if (conversation?.members && conversation.members.length > 0) {
        console.log('📖 [useMessages] Initializing read receipts from existing members');
        initializeReadReceipts(conversation.members, currentUser?.uid);
      }

      // Cleanup function
      cleanup = () => {
        console.log('🧹 [useMessages] Cleaning up conversation:', conversationId);
        
        if (socket) {
          socket.emit('leave_conversation', { conversationId });
          socket.off('message_received', handleMessageReceived);
          socket.off('message_recalled', handleMessageRecalled);
          socket.off('message_edited', handleMessageEdited);
          socket.off('message_deleted', handleMessageDeleted);
          socket.off('message_read_receipt', handleMessageReadReceipt);
        }
      };
    };

    initialize();

    return () => {
      if (cleanup) cleanup();
    };
  }, [conversationId, fetchMessages, scrollToBottom, initializeReadReceipts]);

  // ============================================
  // 🆕 RE-INITIALIZE READ RECEIPTS WHEN MEMBERS LOAD
  // ============================================
  useEffect(() => {
    if (!conversationId) return;

    const { conversations, currentUser } = useChatStore.getState();
    const conversation = conversations.get(conversationId);

    // Check if we have members now
    if (conversation?.members && conversation.members.length > 0) {
      console.log('🔄 [useMessages] Members detected, re-initializing read receipts');
      initializeReadReceipts(conversation.members, currentUser?.uid);
    }
  }, [conversationId, initializeReadReceipts]);

  // Subscribe to conversation changes to detect when members are loaded
  const conversationMembers = useChatStore((state) => {
    const conv = state.conversations.get(conversationId);
    return conv?.members;
  });

  useEffect(() => {
    if (!conversationId || !conversationMembers || conversationMembers.length === 0) return;

    console.log('🔄 [useMessages] Conversation members changed, re-initializing receipts');
    const { currentUser } = useChatStore.getState();
    initializeReadReceipts(conversationMembers, currentUser?.uid);
  }, [conversationId, conversationMembers, initializeReadReceipts]);

  // ============================================
  // RETURN
  // ============================================

  return {
    messages,
    loading,
    hasMore,
    error,
    hasMessages,
    loadMore,
    scrollToBottom,
    messagesEndRef,
  };
};

export default useMessages;
// frontend/src/hooks/socket/useGlobalSocket.js - FULL FIXED VERSION

import { useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
import { SocketContext } from "../../context/SocketContext";
import useChatStore from "../../store/chat/chatStore";

/**
 * 🔥 GLOBAL SOCKET LISTENER - MESSENGER STYLE (FULL FIXED)
 * 
 * ✅ Keep groups after kick/leave (like Messenger)
 * ✅ Mark with isKicked/isLeft flags
 * ✅ Disable message input
 * ✅ Keep chat history visible
 * ✅ FIXED: Real-time member list updates for kick/leave/role changes
 */
export const useGlobalSocket = ({ 
  onConversationUpdate,
  onConversationCreated 
}) => {
  const { user } = useContext(AuthContext);
  const { socket, isConnected } = useContext(SocketContext);
  const registeredRef = useRef(false);

  // Subscribe to store actions
  const editMessageFromSocket = useChatStore((state) => state.editMessageFromSocket);
  const recallMessageFromSocket = useChatStore((state) => state.recallMessageFromSocket);
  const deleteMessageFromSocket = useChatStore((state) => state.deleteMessageFromSocket);
  const setReactionsFinal = useChatStore((state) => state.setReactionsFinal);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const conversations = useChatStore((state) => state.conversations);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const activeConversationId = useChatStore((state) => state.activeConversationId);

  // ============================================
  // HANDLER: CONVERSATION UPDATE
  // ============================================
  const handleConversationUpdate = useCallback((data) => {
    const { conversationId, lastMessage, lastMessageAt, unreadCount } = data;
    
    if (!conversationId) {
      console.warn('⚠️ [Global] Missing conversationId in conversation_update');
      return;
    }

    console.log('🔔 [Global] Conversation update:', {
      conversationId,
      unreadCount,
      hasLastMessage: !!lastMessage,
    });

    const existingConv = conversations.get(conversationId);

    if (existingConv) {
      const existingLastMessage = existingConv.lastMessage;
      const incomingMessageId = lastMessage?.messageId || lastMessage?._id;
      const existingMessageId = existingLastMessage?.messageId || existingLastMessage?._id;
      
      const shouldPreserveRecalled = 
        existingLastMessage?.isRecalled === true &&
        incomingMessageId === existingMessageId;
      
      if (shouldPreserveRecalled) {
        console.log('⏭️ [Global] Preserving recalled lastMessage');
        updateConversation(conversationId, {
          lastMessageAt,
          unreadCount,
        });
      } else {
        updateConversation(conversationId, {
          lastMessage,
          lastMessageAt,
          unreadCount,
        });
      }
    } else {
      console.log('🆕 [Global] Adding new conversation:', conversationId);
      const { addConversation } = useChatStore.getState();
      addConversation({
        _id: conversationId,
        conversationId,
        lastMessage,
        lastMessageAt,
        unreadCount,
      });
    }

    if (onConversationUpdate) {
      onConversationUpdate(data);
    }
  }, [onConversationUpdate, conversations, updateConversation]);

  // ============================================
  // HANDLER: CONVERSATION CREATED
  // ============================================
  const handleConversationCreated = useCallback((data) => {
    const { conversation } = data;
    
    if (!conversation) {
      console.warn('⚠️ [Global] Missing conversation in conversation_created');
      return;
    }

    console.log('🆕 [Global] Conversation created:', conversation._id);

    const { addConversation } = useChatStore.getState();
    addConversation(conversation);

    if (onConversationCreated) {
      onConversationCreated(data);
    }
  }, [onConversationCreated]);

  // ============================================
  // HANDLER: CONVERSATION JOINED
  // ============================================
  const handleConversationJoined = useCallback((data) => {
    const { conversationId, conversation } = data;
    
    console.log('👥 [Global] Joined conversation:', conversationId);

    if (conversation) {
      const { addConversation } = useChatStore.getState();
      addConversation(conversation);
    }
  }, []);

  // ============================================
  // HANDLER: CONVERSATION LEFT
  // ============================================
  const handleConversationLeft = useCallback((data) => {
    const { conversationId, reason } = data;
    
    console.log('👋 [Global] Left conversation:', conversationId, 'reason:', reason);

    // Note: For groups, this is handled by handleGroupMemberLeft
    // This handler is for system-level conversation removal
  }, []);

  // ============================================
  // HANDLER: MESSAGE EDITED
  // ============================================
  const handleMessageEditedGlobal = useCallback((data) => {
    console.log('✏️ [Global] message_edited:', data);
    
    const { conversationId, message } = data;
    
    if (!conversationId || !message) {
      console.warn('⚠️ [Global] Missing data in message_edited');
      return;
    }

    const editedMessageId = message.messageId || message._id;
    const newContent = message.content;
    const editedAt = message.editedAt;

    console.log('📝 [Global] Updating edited message in store');
    
    if (typeof editMessageFromSocket !== 'function') {
      console.error('❌ [Global] editMessageFromSocket not available');
      return;
    }
    
    try {
      editMessageFromSocket(conversationId, editedMessageId, newContent, editedAt);
      console.log('✅ [Global] Message edited in store');
    } catch (error) {
      console.error('❌ [Global] Error editing message:', error);
      return;
    }
    
    const conversation = conversations.get(conversationId);
    
    if (!conversation?.lastMessage) return;

    const lastMessageId = conversation.lastMessage.messageId || conversation.lastMessage._id;
    
    if (lastMessageId === editedMessageId) {
      console.log('🔥 [Global] Updating sidebar for edited lastMessage');
      
      updateConversation(conversationId, {
        lastMessage: {
          ...conversation.lastMessage,
          content: newContent,
          editedAt: editedAt,
        },
      });
    }
  }, [editMessageFromSocket, updateConversation, conversations]);

  // ============================================
  // HANDLER: MESSAGE RECALLED
  // ============================================
  const handleMessageRecalledGlobal = useCallback((data) => {
    console.log('↩️ [Global] message_recalled:', data);
    
    const { conversationId, messageId, recalledBy, recalledAt } = data;
    
    if (!conversationId || !messageId) {
      console.warn('⚠️ [Global] Missing data in message_recalled');
      return;
    }

    console.log('📝 [Global] Recalling message in store');
    
    if (typeof recallMessageFromSocket !== 'function') {
      console.error('❌ [Global] recallMessageFromSocket not available');
      return;
    }
    
    try {
      recallMessageFromSocket(conversationId, messageId, recalledBy, recalledAt);
      console.log('✅ [Global] Message recalled in store');
    } catch (error) {
      console.error('❌ [Global] Error recalling message:', error);
      return;
    }
    
    const conversation = conversations.get(conversationId);
    
    if (!conversation?.lastMessage) return;

    const lastMessageId = conversation.lastMessage.messageId || conversation.lastMessage._id;
    
    if (lastMessageId === messageId) {
      console.log('🔥 [Global] Updating sidebar for recalled lastMessage');
      
      updateConversation(conversationId, {
        lastMessage: {
          ...conversation.lastMessage,
          isRecalled: true,
          content: "",
          recalledAt,
          recalledBy,
        },
      });
    }
  }, [recallMessageFromSocket, updateConversation, conversations]);

  // ============================================
  // HANDLER: MESSAGE DELETED
  // ============================================
  const handleMessageDeletedGlobal = useCallback((data) => {
    const { conversationId, messageId } = data;
    
    if (!conversationId || !messageId) {
      console.warn('⚠️ [Global] Missing data in message_deleted');
      return;
    }

    console.log('🗑️ [Global] Deleting message from store');
    
    if (typeof deleteMessageFromSocket !== 'function') {
      console.error('❌ [Global] deleteMessageFromSocket not available');
      return;
    }
    
    try {
      deleteMessageFromSocket(conversationId, messageId);
      console.log('✅ [Global] Message deleted from store');
    } catch (error) {
      console.error('❌ [Global] Error deleting message:', error);
    }
  }, [deleteMessageFromSocket]);

  // ============================================
  // HANDLER: REACTION UPDATE
  // ============================================
  const handleReactionUpdateGlobal = useCallback((data) => {
    console.log('🎭 [Global] message:reaction:update:', data);
    
    const { conversationId, messageId, reactions } = data;
    
    if (!conversationId || !messageId || !Array.isArray(reactions)) {
      console.warn('⚠️ [Global] Invalid reaction update data:', data);
      return;
    }

    console.log('📝 [Global] Updating reactions in store:', {
      conversationId,
      messageId,
      reactionsCount: reactions.length,
    });
    
    if (typeof setReactionsFinal !== 'function') {
      console.error('❌ [Global] setReactionsFinal not available');
      return;
    }
    
    try {
      setReactionsFinal(conversationId, messageId, reactions);
      console.log('✅ [Global] Reactions updated in store');
    } catch (error) {
      console.error('❌ [Global] Error updating reactions:', error);
    }
  }, [setReactionsFinal]);

  // ============================================
  // HANDLER: GROUP MEMBER JOINED
  // ============================================
  const handleGroupMemberJoined = useCallback((data) => {
    console.log('👥 [Global] group:member_joined:', data);
    
    const { conversationId, user: newMember, viaLink } = data;
    
    if (!conversationId || !newMember) {
      console.warn('⚠️ [Global] Missing data in group:member_joined');
      return;
    }
    
    console.log(`✅ [Global] ${newMember.nickname} joined ${viaLink ? 'via link' : 'group'}`);
    
    // ✅ Add new member to members list
    const conversation = conversations.get(conversationId);
    
    if (conversation && conversation.members) {
      console.log('🔄 [Global] Adding new member to list');
      
      // Check if member already exists
      const memberExists = conversation.members.some((m) => {
        const memberUid = m.uid || m.user?.uid;
        return memberUid === newMember.uid;
      });
      
      if (!memberExists) {
        const updatedMembers = [
          ...conversation.members,
          {
            uid: newMember.uid,
            nickname: newMember.nickname,
            avatar: newMember.avatar,
            role: 'member',
            joinedAt: new Date().toISOString(),
          }
        ];
        
        updateConversation(conversationId, {
          members: updatedMembers,
        });
        
        console.log('✅ [Global] Member added to list');
      }
    }
  }, [conversations, updateConversation]);

  // ============================================
  // 🔥 HANDLER: GROUP MEMBER LEFT (FIXED)
  // ============================================
  const handleGroupMemberLeft = useCallback((data) => {
    console.log('👋 [Global] group:member_left:', data);
    
    const { conversationId, user: leftMember } = data;
    
    if (!conversationId || !leftMember) {
      console.warn('⚠️ [Global] Missing data in group:member_left');
      return;
    }
    
    // ============================================
    // CASE 1: Current user left
    // ============================================
    if (leftMember.uid === user?.uid) {
      console.log('⚠️ [Global] Current user left group - MESSENGER STYLE');
      
      // 🔥 MESSENGER STYLE: Keep conversation but mark as left
      updateConversation(conversationId, {
        isLeft: true,
        leftAt: new Date().toISOString(),
        canSendMessage: false,
      });
      
      console.log('✅ [Global] Conversation marked as left (kept in sidebar)');
      
      // If this is the active conversation, close it
      if (activeConversationId === conversationId) {
        console.log('🚪 [Global] Closing active conversation (you left)');
        setActiveConversation(null);
      }
      
      return;
    }
    
    // ============================================
    // CASE 2: Someone else left
    // ✅ FIXED: Update members list in real-time
    // ============================================
    console.log(`✅ [Global] ${leftMember.nickname} left group`);
    
    const conversation = conversations.get(conversationId);
    
    if (conversation && conversation.members) {
      console.log('🔄 [Global] Removing left member from list');
      
      // Remove left member from members array
      const updatedMembers = conversation.members.filter((m) => {
        const memberUid = m.uid || m.user?.uid;
        return memberUid !== leftMember.uid;
      });
      
      console.log('✅ [Global] Members updated:', {
        before: conversation.members.length,
        after: updatedMembers.length,
        removedUid: leftMember.uid,
      });
      
      updateConversation(conversationId, {
        members: updatedMembers,
      });
    } else {
      console.log('⏭️ [Global] No members to update (not a group or not loaded)');
    }
  }, [user, conversations, updateConversation, activeConversationId, setActiveConversation]);

  // ============================================
  // 🔥 HANDLER: GROUP MEMBER KICKED (FIXED)
  // ============================================
  const handleGroupMemberKicked = useCallback((data) => {
    console.log('🚫 [Global] group:member_kicked:', data);
    
    const { conversationId, actor, target, kickedAt } = data;
    
    if (!conversationId || !actor || !target) {
      console.warn('⚠️ [Global] Missing data in group:member_kicked');
      return;
    }
    
    // ============================================
    // CASE 1: Current user was kicked
    // ============================================
    if (target.uid === user?.uid) {
      console.log('⚠️ [Global] Current user was kicked - MESSENGER STYLE');
      
      // 🔥 MESSENGER STYLE: Keep conversation but mark as kicked
      updateConversation(conversationId, {
        isKicked: true,
        kickedBy: actor.uid,
        kickedByNickname: actor.nickname,
        kickedAt: kickedAt || new Date().toISOString(),
        canSendMessage: false,
      });
      
      console.log('✅ [Global] Conversation marked as kicked (kept in sidebar)');
      
      // If this is the active conversation, close it
      if (activeConversationId === conversationId) {
        console.log('🚪 [Global] Closing active conversation (you were kicked)');
        setActiveConversation(null);
      }
      
      return;
    }
    
    // ============================================
    // CASE 2: Someone else was kicked
    // ✅ FIXED: Update members list in real-time
    // ============================================
    console.log(`✅ [Global] ${target.nickname} was kicked by ${actor.nickname}`);
    
    const conversation = conversations.get(conversationId);
    
    if (conversation && conversation.members) {
      console.log('🔄 [Global] Removing kicked member from list');
      
      // Remove kicked member from members array
      const updatedMembers = conversation.members.filter((m) => {
        const memberUid = m.uid || m.user?.uid;
        return memberUid !== target.uid;
      });
      
      console.log('✅ [Global] Members updated:', {
        before: conversation.members.length,
        after: updatedMembers.length,
        removedUid: target.uid,
      });
      
      updateConversation(conversationId, {
        members: updatedMembers,
      });
    } else {
      console.log('⏭️ [Global] No members to update (not a group or not loaded)');
    }
  }, [user, conversations, updateConversation, activeConversationId, setActiveConversation]);

  // ============================================
  // HANDLER: GROUP PERMISSION CHANGED
  // ============================================
  const handleGroupPermissionChanged = useCallback((data) => {
    console.log('⚙️ [Global] group:permission_changed:', data);
    
    const { conversationId, newPermission } = data;
    
    if (!conversationId || !newPermission) {
      console.warn('⚠️ [Global] Missing data in group:permission_changed');
      return;
    }
    
    updateConversation(conversationId, {
      messagePermission: newPermission,
    });
    
    console.log(`✅ [Global] Message permission changed to: ${newPermission}`);
  }, [updateConversation]);

  // ============================================
  // HANDLER: GROUP JOIN MODE CHANGED
  // ============================================
  const handleGroupJoinModeChanged = useCallback((data) => {
    console.log('🔗 [Global] group:joinModeChanged:', data);
    
    const { conversationId, newJoinMode } = data;
    
    if (!conversationId || !newJoinMode) {
      console.warn('⚠️ [Global] Missing data in group:joinModeChanged');
      return;
    }
    
    updateConversation(conversationId, {
      joinMode: newJoinMode,
    });
    
    console.log(`✅ [Global] Join mode changed to: ${newJoinMode}`);
  }, [updateConversation]);

  // ============================================
  // 🔥 HANDLER: GROUP ROLE CHANGED (FIXED)
  // ============================================
  const handleGroupRoleChanged = useCallback((data) => {
    console.log('👑 [Global] group:role_changed:', data);
    
    const { conversationId, actor, target, newRole } = data;
    
    if (!conversationId || !target || !newRole) {
      console.warn('⚠️ [Global] Missing data in group:role_changed');
      return;
    }
    
    const conversation = conversations.get(conversationId);
    
    if (!conversation) {
      console.log('⏭️ [Global] Conversation not found');
      return;
    }
    
    // ============================================
    // Update members list for ANY member (including current user)
    // ============================================
    if (conversation.members) {
      console.log('🔄 [Global] Updating role in members list');
      
      const updatedMembers = conversation.members.map((m) => {
        const memberUid = m.uid || m.user?.uid;
        
        if (memberUid === target.uid) {
          console.log(`✅ [Global] Updating ${m.nickname || 'member'} role to ${newRole}`);
          return { ...m, role: newRole };
        }
        
        return m;
      });
      
      // ✅ If current user's role changed, also update currentUserRole
      const updates = {
        members: updatedMembers,
      };
      
      if (target.uid === user?.uid) {
        console.log('⚡ [Global] Current user role changed to:', newRole);
        updates.currentUserRole = newRole;
      }
      
      updateConversation(conversationId, updates);
      
      console.log('✅ [Global] Members list updated with new role');
    } else {
      console.log('⏭️ [Global] No members to update');
    }
  }, [user, conversations, updateConversation]);

  // ============================================
  // REGISTER SOCKET LISTENERS
  // ============================================
  useEffect(() => {
    if (!socket || !isConnected || !user) {
      console.log('⏳ [Global] Waiting for socket/user...');
      return;
    }

    if (registeredRef.current) {
      console.log('⏭️ [Global] Already registered, skip');
      return;
    }

    console.log('🌍 [Global] Registering global listeners for user:', user.uid);
    registeredRef.current = true;

    socket.on('conversation_update', handleConversationUpdate);
    socket.on('conversation_created', handleConversationCreated);
    socket.on('conversation_joined', handleConversationJoined);
    socket.on('conversation_left', handleConversationLeft);
    socket.on('message_edited', handleMessageEditedGlobal);
    socket.on('message_recalled', handleMessageRecalledGlobal);
    socket.on('message_deleted', handleMessageDeletedGlobal);
    socket.on('message:reaction:update', handleReactionUpdateGlobal);
    socket.on('group:member_joined', handleGroupMemberJoined);
    socket.on('group:member_left', handleGroupMemberLeft);
    socket.on('group:member_kicked', handleGroupMemberKicked);
    socket.on('group:permission_changed', handleGroupPermissionChanged);
    socket.on('group:role_changed', handleGroupRoleChanged);
    socket.on('group:joinModeChanged', handleGroupJoinModeChanged);

    console.log('✅ [Global] All global listeners registered');

    return () => {
      console.log('🌍 [Global] Cleaning up global listeners');
      registeredRef.current = false;
      
      socket.off('conversation_update', handleConversationUpdate);
      socket.off('conversation_created', handleConversationCreated);
      socket.off('conversation_joined', handleConversationJoined);
      socket.off('conversation_left', handleConversationLeft);
      socket.off('message_edited', handleMessageEditedGlobal);
      socket.off('message_recalled', handleMessageRecalledGlobal);
      socket.off('message_deleted', handleMessageDeletedGlobal);
      socket.off('message:reaction:update', handleReactionUpdateGlobal);
      socket.off('group:member_joined', handleGroupMemberJoined);
      socket.off('group:member_left', handleGroupMemberLeft);
      socket.off('group:member_kicked', handleGroupMemberKicked);
      socket.off('group:permission_changed', handleGroupPermissionChanged);
      socket.off('group:role_changed', handleGroupRoleChanged);
      socket.off('group:joinModeChanged', handleGroupJoinModeChanged);
    };
  }, [
    socket, 
    isConnected, 
    user?.uid,
    handleConversationUpdate,
    handleConversationCreated,
    handleConversationJoined,
    handleConversationLeft,
    handleMessageEditedGlobal,
    handleMessageRecalledGlobal,
    handleMessageDeletedGlobal,
    handleReactionUpdateGlobal,
    handleGroupMemberJoined,
    handleGroupMemberLeft,
    handleGroupMemberKicked,
    handleGroupPermissionChanged,
    handleGroupRoleChanged,
    handleGroupJoinModeChanged,
  ]);

  useEffect(() => {
    if (!isConnected) {
      registeredRef.current = false;
    }
  }, [isConnected]);

  return null;
};

export default useGlobalSocket;
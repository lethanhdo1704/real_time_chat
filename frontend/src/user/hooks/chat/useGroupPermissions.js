// frontend/src/hooks/chat/useGroupPermissions.js - FIXED

import { useMemo } from 'react';
import useChatStore from '../../store/chat/chatStore';

export const useGroupPermissions = (conversationId, currentUserUid) => {
  const conversations = useChatStore((state) => state.conversations);
  const conversation = conversations.get(conversationId);

  return useMemo(() => {
    // ============================================
    // CASE 1: No conversationId = NEW PRIVATE CHAT
    // ============================================
    if (!conversationId) {
      console.log('✨ [useGroupPermissions] New private chat (no conversationId)');
      
      return {
        isGroup: false,
        isMember: true,
        isOwner: false,
        isAdmin: false,
        canSendMessage: true,
        canInvite: false,
        canKick: false,
        canChangeRole: false,
        canUpdateSettings: false,
        canApproveJoinRequest: false,
        canLeave: false,
        myRole: null,
        memberStatus: 'active',
        kickedBy: null,
        kickedAt: null,
        leftAt: null,
        activeMembersCount: 2,
      };
    }

    // ============================================
    // CASE 2: Has conversationId but no conversation data
    // ============================================
    if (!conversation) {
      console.warn('⚠️ [useGroupPermissions] Conversation not found in store:', conversationId);
      
      return {
        isGroup: false,
        isMember: false,
        isOwner: false,
        isAdmin: false,
        canSendMessage: false,
        canInvite: false,
        canKick: false,
        canChangeRole: false,
        canUpdateSettings: false,
        canApproveJoinRequest: false,
        canLeave: false,
        myRole: null,
        memberStatus: 'conversation_not_found',
        kickedBy: null,
        kickedAt: null,
        leftAt: null,
        activeMembersCount: 0,
      };
    }

    // ============================================
    // CASE 3: Private Chat (existing conversation)
    // ============================================
    const isGroup = conversation.type === 'group';
    
    if (!isGroup) {
      const isBlocked = conversation.blocked === true || 
                       conversation.blockedBy === currentUserUid ||
                       conversation.blockedUser === currentUserUid;

      return {
        isGroup: false,
        isMember: true,
        isOwner: false,
        isAdmin: false,
        canSendMessage: !isBlocked,
        canInvite: false,
        canKick: false,
        canChangeRole: false,
        canUpdateSettings: false,
        canApproveJoinRequest: false,
        canLeave: false,
        myRole: null,
        memberStatus: isBlocked ? 'blocked' : 'active',
        kickedBy: null,
        kickedAt: null,
        leftAt: null,
        activeMembersCount: 2,
      };
    }

    // ============================================
    // CASE 4: Group Chat
    // ============================================
    
    // 🔥 CRITICAL FIX: Check conversation-level flags FIRST
    // These are set by WebSocket when user gets kicked/leaves
    if (conversation.isKicked) {
      console.log('🚫 [useGroupPermissions] User was KICKED (conversation flag)');
      
      return {
        isGroup: true,
        isMember: false,
        isOwner: false,
        isAdmin: false,
        canSendMessage: false,
        canInvite: false,
        canKick: false,
        canChangeRole: false,
        canUpdateSettings: false,
        canApproveJoinRequest: false,
        canLeave: false,
        myRole: null,
        memberStatus: 'kicked',
        kickedBy: conversation.kickedBy || null,
        kickedAt: conversation.kickedAt || null,
        leftAt: null,
        activeMembersCount: (conversation.members || []).filter(m => !m.kickedBy && !m.leftAt).length,
      };
    }

    if (conversation.isLeft) {
      console.log('👋 [useGroupPermissions] User LEFT (conversation flag)');
      
      return {
        isGroup: true,
        isMember: false,
        isOwner: false,
        isAdmin: false,
        canSendMessage: false,
        canInvite: false,
        canKick: false,
        canChangeRole: false,
        canUpdateSettings: false,
        canApproveJoinRequest: false,
        canLeave: false,
        myRole: null,
        memberStatus: 'left',
        kickedBy: null,
        kickedAt: null,
        leftAt: conversation.leftAt || null,
        activeMembersCount: (conversation.members || []).filter(m => !m.kickedBy && !m.leftAt).length,
      };
    }

    // 🔥 THEN check member-level status (for other members kicked/left)
    const members = conversation.members || [];
    const myMember = members.find((m) => {
      const memberUid = m.uid || m.user?.uid;
      return memberUid === currentUserUid;
    });

    if (!myMember) {
      console.warn('⚠️ [useGroupPermissions] Not a member');
      
      return {
        isGroup: true,
        isMember: false,
        isOwner: false,
        isAdmin: false,
        canSendMessage: false,
        canInvite: false,
        canKick: false,
        canChangeRole: false,
        canUpdateSettings: false,
        canApproveJoinRequest: false,
        canLeave: false,
        myRole: null,
        memberStatus: 'not_member',
        kickedBy: null,
        kickedAt: null,
        leftAt: null,
        activeMembersCount: members.filter(m => !m.kickedBy && !m.leftAt).length,
      };
    }

    // Check member-level kicked/left status (backup check)
    const wasKicked = !!myMember.kickedBy;
    const hasLeft = !!myMember.leftAt;

    if (wasKicked || hasLeft) {
      console.log('🚫 [useGroupPermissions] Kicked/Left (member flag)');
      
      return {
        isGroup: true,
        isMember: false,
        isOwner: false,
        isAdmin: false,
        canSendMessage: false,
        canInvite: false,
        canKick: false,
        canChangeRole: false,
        canUpdateSettings: false,
        canApproveJoinRequest: false,
        canLeave: false,
        myRole: null,
        memberStatus: wasKicked ? 'kicked' : 'left',
        kickedBy: wasKicked ? myMember.kickedBy : null,
        kickedAt: wasKicked ? myMember.kickedAt : null,
        leftAt: myMember.leftAt || null,
        activeMembersCount: members.filter(m => !m.kickedBy && !m.leftAt).length,
      };
    }

    // Active member - compute permissions
    const myRole = myMember.role;
    const isOwner = myRole === 'owner';
    const isAdmin = myRole === 'admin' || isOwner;

    const messagePermission = conversation.messagePermission || 'all';
    const canSendMessage = 
      !messagePermission || 
      messagePermission === 'all' || 
      (messagePermission === 'admins_only' && (myRole === 'owner' || myRole === 'admin'));

    const activeMembersCount = members.filter(
      m => !m.kickedBy && !m.leftAt
    ).length;

    const canLeave = isOwner 
      ? activeMembersCount === 1 
      : true;

    return {
      isGroup: true,
      isMember: true,
      isOwner,
      isAdmin,
      canSendMessage,
      canInvite: true,
      canKick: isAdmin,
      canChangeRole: isOwner,
      canUpdateSettings: isOwner,
      canApproveJoinRequest: isAdmin,
      canLeave,
      myRole,
      memberStatus: 'active',
      kickedBy: null,
      kickedAt: null,
      leftAt: null,
      activeMembersCount,
    };
  }, [conversation, conversationId, currentUserUid]);
};

export default useGroupPermissions;
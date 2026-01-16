// frontend/src/hooks/chat/useGroupActions.js
import { useState, useCallback } from 'react';
import groupService from '../../services/groupService';
import useChatStore from '../../store/chat/chatStore';

/**
 * Hook to handle group actions with loading/error states
 * Provides all group management operations
 * 
 * @returns {Object} Action functions and states
 */
export const useGroupActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateConversation = useChatStore((state) => state.updateConversation);
  const removeConversation = useChatStore((state) => state.removeConversation);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);

  // ============================================
  // CREATE GROUP
  // ============================================
  const createGroup = useCallback(async (groupData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📝 [useGroupActions] Creating group:', groupData);
      const result = await groupService.createGroup(groupData);
      
      console.log('✅ [useGroupActions] Group created:', result);
      
      // Add to store
      const { addConversation } = useChatStore.getState();
      addConversation(result.conversation);
      
      return result;
    } catch (err) {
      console.error('❌ [useGroupActions] Create group failed:', err);
      setError(err.message || 'Failed to create group');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // INVITE USERS
  // ============================================
  const inviteUsers = useCallback(async (conversationId, userUids) => {
    setLoading(true);
    setError(null);

    try {
      console.log('📨 [useGroupActions] Inviting users:', { conversationId, userUids });
      const result = await groupService.inviteUsers(conversationId, userUids);
      
      console.log('✅ [useGroupActions] Invite sent:', result);
      return result;
    } catch (err) {
      console.error('❌ [useGroupActions] Invite failed:', err);
      setError(err.message || 'Failed to invite users');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // KICK MEMBER
  // ============================================
  const kickMember = useCallback(async (conversationId, memberUid) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚫 [useGroupActions] Kicking member:', { conversationId, memberUid });
      const result = await groupService.kickMember(conversationId, memberUid);
      
      console.log('✅ [useGroupActions] Member kicked:', result);
      
      // Update members in store
      const conversations = useChatStore.getState().conversations;
      const conversation = conversations.get(conversationId);
      
      if (conversation) {
        const updatedMembers = (conversation.members || []).filter(
          (m) => m.user?.uid !== memberUid
        );
        
        updateConversation(conversationId, { members: updatedMembers });
      }
      
      return result;
    } catch (err) {
      console.error('❌ [useGroupActions] Kick failed:', err);
      setError(err.message || 'Failed to kick member');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateConversation]);

  // ============================================
  // LEAVE GROUP
  // ============================================
  const leaveGroup = useCallback(async (conversationId) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚪 [useGroupActions] Leaving group:', conversationId);
      const result = await groupService.leaveGroup(conversationId);
      
      console.log('✅ [useGroupActions] Left group:', result);
      
      // Remove from store and clear active
      removeConversation(conversationId);
      
      const activeConversationId = useChatStore.getState().activeConversationId;
      if (activeConversationId === conversationId) {
        setActiveConversation(null);
      }
      
      return result;
    } catch (err) {
      console.error('❌ [useGroupActions] Leave failed:', err);
      setError(err.message || 'Failed to leave group');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [removeConversation, setActiveConversation]);

  // ============================================
  // CHANGE MEMBER ROLE
  // ============================================
  const changeMemberRole = useCallback(async (conversationId, memberUid, newRole) => {
    setLoading(true);
    setError(null);

    try {
      console.log('👑 [useGroupActions] Changing role:', { conversationId, memberUid, newRole });
      const result = await groupService.changeMemberRole(conversationId, memberUid, newRole);
      
      console.log('✅ [useGroupActions] Role changed:', result);
      
      // Update member role in store
      const conversations = useChatStore.getState().conversations;
      const conversation = conversations.get(conversationId);
      
      if (conversation) {
        const updatedMembers = (conversation.members || []).map((m) =>
          m.user?.uid === memberUid ? { ...m, role: newRole } : m
        );
        
        updateConversation(conversationId, { members: updatedMembers });
      }
      
      return result;
    } catch (err) {
      console.error('❌ [useGroupActions] Change role failed:', err);
      setError(err.message || 'Failed to change role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateConversation]);

  // ============================================
  // TRANSFER OWNERSHIP
  // ============================================
  const transferOwnership = useCallback(async (conversationId, newOwnerUid) => {
    setLoading(true);
    setError(null);

    try {
      console.log('👑 [useGroupActions] Transferring ownership:', { conversationId, newOwnerUid });
      const result = await groupService.transferOwnership(conversationId, newOwnerUid);
      
      console.log('✅ [useGroupActions] Ownership transferred:', result);
      
      // Refresh group info to get updated roles
      const groupInfo = await groupService.getGroupInfo(conversationId);
      updateConversation(conversationId, { members: groupInfo.members });
      
      return result;
    } catch (err) {
      console.error('❌ [useGroupActions] Transfer failed:', err);
      setError(err.message || 'Failed to transfer ownership');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateConversation]);

  // ============================================
  // UPDATE GROUP SETTINGS
  // ============================================
  const updateGroupSettings = useCallback(async (conversationId, updates) => {
    setLoading(true);
    setError(null);

    try {
      console.log('⚙️ [useGroupActions] Updating settings:', { conversationId, updates });
      const result = await groupService.updateGroupInfo(conversationId, updates);
      
      console.log('✅ [useGroupActions] Settings updated:', result);
      
      // Update conversation in store
      updateConversation(conversationId, updates);
      
      return result;
    } catch (err) {
      console.error('❌ [useGroupActions] Update failed:', err);
      setError(err.message || 'Failed to update settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateConversation]);

  // ============================================
  // RETURN
  // ============================================
  return {
    loading,
    error,
    createGroup,
    inviteUsers,
    kickMember,
    leaveGroup,
    changeMemberRole,
    transferOwnership,
    updateGroupSettings,
  };
};

export default useGroupActions;
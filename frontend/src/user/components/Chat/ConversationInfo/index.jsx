// frontend/src/components/Chat/ConversationInfo/index.jsx - UPDATED

import React, { useState, useContext } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../../context/AuthContext';
import useChatStore from '../../../store/chat/chatStore';
import useConversationInfo from '../../../hooks/chat/useConversationInfo';
import useGroupPermissions from '../../../hooks/chat/useGroupPermissions';
import useGroupActions from '../../../hooks/chat/useGroupActions';

import ProfileSection from './ProfileSection';
import GroupSettingsSection from './GroupSettingsSection';
import MembersSection from './MembersSection';
import SharedContentSection from './SharedContentSection';
import SettingsSection from './SettingsSection';
import DangerZoneSection from './DangerZoneSection';
import GroupModals from './GroupModals';

/**
 * ConversationInfo Component - UPDATED WITH NEW BACKEND
 * 
 * Backend now returns:
 * - members: Array of { uid, nickname, avatar, role, joinedAt }
 * - totalMembers: number
 * - currentUserRole: 'owner' | 'admin' | 'member'
 * - Counters: totalMessages, sharedImages, etc.
 */
export default function ConversationInfo({ onClose }) {
  const { t, i18n } = useTranslation('conversation');
  const { user } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('media');
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  // Group modals
  const [showKickModal, setShowKickModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // Redux state
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const conversation = conversations.get(activeConversationId);

  // 🔥 Fetch group info from API (includes members list)
  const { info, loading: infoLoading } = useConversationInfo(activeConversationId);

  // 🔥 Group permissions
  const {
    isGroup,
    isMember,
    isOwner,
    isAdmin,
    canKick,
    canChangeRole,
    canUpdateSettings,
    canLeave,
    myRole,
  } = useGroupPermissions(activeConversationId, user?.uid);

  // 🔥 Group actions
  const {
    loading: actionLoading,
    error: actionError,
    kickMember,
    leaveGroup,
    changeMemberRole,
    updateGroupSettings,
  } = useGroupActions();

  // Guard
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500">{t('notFound')}</p>
      </div>
    );
  }

  // ============================================
  // 🔥 COMPUTED VALUES (Updated)
  // ============================================
  
  const displayName = conversation.name || conversation.friend?.nickname || t('conversation');
  
  // 🔥 Get members from API response (info.members) or fallback to Redux
  const members = info?.members || conversation.members || [];
  
  const profileAvatar = isGroup ? conversation.avatar : conversation.friend?.avatar;
  const profileAvatarUpdatedAt = isGroup ? conversation.avatarUpdatedAt : conversation.friend?.avatarUpdatedAt;
  
  // 🔥 Counters from API response
  const counters = {
    totalMessages: info?.totalMessages || conversation.totalMessages || 0,
    sharedImages: info?.sharedImages || conversation.sharedImages || 0,
    sharedVideos: info?.sharedVideos || conversation.sharedVideos || 0,
    sharedAudios: info?.sharedAudios || conversation.sharedAudios || 0,
    sharedFiles: info?.sharedFiles || conversation.sharedFiles || 0,
    sharedLinks: info?.sharedLinks || conversation.sharedLinks || 0,
  };
  
  const messagePermission = conversation.messagePermission || 'all';
  const onlyAdminCanChat = messagePermission === 'admins_only';

  // ============================================
  // HANDLERS
  // ============================================

  const handleSaveGroupName = async () => {
    if (!groupName.trim() || groupName.trim() === displayName) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateGroupSettings(activeConversationId, { name: groupName.trim() });
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update group name:', err);
    }
  };

  const handleKickMember = (member) => {
    setSelectedMember(member);
    setShowKickModal(true);
  };

  const handleChangeRole = (member) => {
    setSelectedMember(member);
    setShowRoleModal(true);
  };

  const handleLeaveGroup = () => {
    setShowLeaveModal(true);
  };

  const handleToggleAdminOnly = async () => {
    const newPermission = onlyAdminCanChat ? 'all' : 'admins_only';
    try {
      await updateGroupSettings(activeConversationId, { messagePermission: newPermission });
    } catch (err) {
      console.error('Failed to update message permission:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-900">{t('title')}</h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Profile Section */}
        <ProfileSection
          isGroup={isGroup}
          displayName={displayName}
          profileAvatar={profileAvatar}
          profileAvatarUpdatedAt={profileAvatarUpdatedAt}
          members={members}
          counters={counters}
          infoLoading={infoLoading}
          canUpdateSettings={canUpdateSettings}
          isEditingName={isEditingName}
          setIsEditingName={setIsEditingName}
          groupName={groupName}
          setGroupName={setGroupName}
          handleSaveGroupName={handleSaveGroupName}
          actionLoading={actionLoading}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isPinned={isPinned}
          setIsPinned={setIsPinned}
          t={t}
        />

        {/* Group Settings */}
        {isGroup && canUpdateSettings && (
          <GroupSettingsSection
            onlyAdminCanChat={onlyAdminCanChat}
            handleToggleAdminOnly={handleToggleAdminOnly}
            actionLoading={actionLoading}
            t={t}
          />
        )}

        {/* Members */}
        {isGroup && members.length > 0 && (
          <MembersSection
            members={members}
            currentUserId={user?.uid}
            canKick={canKick}
            canChangeRole={canChangeRole}
            canUpdateSettings={canUpdateSettings}
            handleKickMember={handleKickMember}
            handleChangeRole={handleChangeRole}
            setShowInviteModal={setShowInviteModal}
            t={t}
          />
        )}

        {/* Shared Content */}
        <SharedContentSection
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeConversationId={activeConversationId}
          counters={counters}
          infoLoading={infoLoading}
          t={t}
        />

        {/* Settings */}
        <SettingsSection isMuted={isMuted} t={t} />

        {/* Danger Zone */}
        {isGroup && canLeave && (
          <DangerZoneSection handleLeaveGroup={handleLeaveGroup} t={t} />
        )}
      </div>

      {/* Modals */}
      <GroupModals
        showKickModal={showKickModal}
        setShowKickModal={setShowKickModal}
        showLeaveModal={showLeaveModal}
        setShowLeaveModal={setShowLeaveModal}
        showRoleModal={showRoleModal}
        setShowRoleModal={setShowRoleModal}
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        isOwner={isOwner}
        members={members}
        actionLoading={actionLoading}
        actionError={actionError}
        kickMember={kickMember}
        leaveGroup={leaveGroup}
        changeMemberRole={changeMemberRole}
        activeConversationId={activeConversationId}
        onClose={onClose}
        t={t}
      />
    </div>
  );
}
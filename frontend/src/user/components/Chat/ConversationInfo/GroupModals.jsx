// frontend/src/components/Chat/ConversationInfo/GroupModals.jsx - WITH OWNER TRANSFER

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, LogOut, Shield, Users, Crown, ArrowRight } from 'lucide-react';
import AvatarImage from '../../common/AvatarImage';

/**
 * KickModal - Confirm kicking a member
 */
function KickModal({ 
  show, 
  setShow, 
  selectedMember, 
  setSelectedMember, 
  actionLoading, 
  actionError, 
  onConfirm, 
}) {
  const { t } = useTranslation('conversation');

  if (!show || !selectedMember) return null;

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('conversationInfo.modals.kickMember.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedMember.nickname}
            </p>
          </div>
        </div>

        <p className="text-gray-700 mb-6">
          {t('conversationInfo.modals.kickMember.message')}
        </p>

        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShow(false);
              setSelectedMember(null);
            }}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {t('conversationInfo.modals.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('conversationInfo.modals.kickMember.kicking')}</span>
              </>
            ) : (
              t('conversationInfo.modals.kickMember.kick')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * LeaveModal - Confirm leaving group (for regular members/admins)
 */
function LeaveModal({ 
  show, 
  setShow, 
  actionLoading, 
  actionError, 
  onConfirm, 
}) {
  const { t } = useTranslation('conversation');

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <LogOut className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('conversationInfo.modals.leaveGroup.title')}
          </h3>
        </div>

        <p className="text-gray-700 mb-6">
          {t('conversationInfo.modals.leaveGroup.message')}
        </p>

        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShow(false)}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {t('conversationInfo.modals.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={actionLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('conversationInfo.modals.leaveGroup.leaving')}</span>
              </>
            ) : (
              t('conversationInfo.modals.leaveGroup.leave')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * OwnerLeaveModal - Owner must transfer ownership before leaving
 */
function OwnerLeaveModal({
  show,
  setShow,
  members,
  currentUserId,
  actionLoading,
  actionError,
  onConfirm,
}) {
  const { t } = useTranslation('conversation');
  const [selectedNewOwner, setSelectedNewOwner] = useState(null);
  
  // Filter out current owner from member list
  const eligibleMembers = members.filter(m => m.uid !== currentUserId);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('conversationInfo.modals.ownerLeave.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('conversationInfo.modals.ownerLeave.subtitle')}
            </p>
          </div>
        </div>

        {eligibleMembers.length === 0 ? (
          // No other members - can delete group
          <>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-medium mb-2">
                {t('conversationInfo.modals.ownerLeave.noMembers.title')}
              </p>
              <p className="text-sm text-red-700">
                {t('conversationInfo.modals.ownerLeave.noMembers.message')}
              </p>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShow(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {t('conversationInfo.modals.cancel')}
              </button>
              <button
                onClick={() => onConfirm(null)} // null = delete group
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('conversationInfo.modals.ownerLeave.deleting')}</span>
                  </>
                ) : (
                  t('conversationInfo.modals.ownerLeave.deleteGroup')
                )}
              </button>
            </div>
          </>
        ) : (
          // Has members - must transfer ownership
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800">
                {t('conversationInfo.modals.ownerLeave.selectNewOwner')}
              </p>
            </div>

            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {eligibleMembers.map((member) => (
                <button
                  key={member.uid}
                  onClick={() => setSelectedNewOwner(member)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedNewOwner?.uid === member.uid
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AvatarImage
                      avatar={member.avatar}
                      nickname={member.nickname}
                      avatarUpdatedAt={member.avatarUpdatedAt}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {member.nickname}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        {member.role === 'admin' && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Shield className="w-3 h-3" />
                            {t('conversationInfo.modals.changeRole.admin')}
                          </span>
                        )}
                        {member.role === 'member' && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {t('conversationInfo.modals.changeRole.member')}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedNewOwner?.uid === member.uid && (
                      <div className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                        <ArrowRight className="w-4 h-4" />
                        <Crown className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShow(false);
                  setSelectedNewOwner(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {t('conversationInfo.modals.cancel')}
              </button>
              <button
                onClick={() => onConfirm(selectedNewOwner)}
                disabled={actionLoading || !selectedNewOwner}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('conversationInfo.modals.ownerLeave.transferring')}</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>{t('conversationInfo.modals.ownerLeave.transferAndLeave')}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * RoleModal - Change member role
 */
function RoleModal({ 
  show, 
  setShow, 
  selectedMember, 
  setSelectedMember, 
  actionLoading, 
  actionError, 
  onConfirm, 
}) {
  const { t } = useTranslation('conversation');

  if (!show || !selectedMember) return null;

  const currentRole = selectedMember.role || 'member';

  return (
    <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('conversationInfo.modals.changeRole.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedMember.nickname}
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <button
            onClick={() => onConfirm('admin')}
            disabled={actionLoading || currentRole === 'admin'}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              currentRole === 'admin'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            } disabled:opacity-50`}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {t('conversationInfo.modals.changeRole.admin')}
                </p>
                <p className="text-xs text-gray-600">
                  {t('conversationInfo.modals.changeRole.adminDesc')}
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onConfirm('member')}
            disabled={actionLoading || currentRole === 'member'}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              currentRole === 'member'
                ? 'border-gray-400 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } disabled:opacity-50`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {t('conversationInfo.modals.changeRole.member')}
                </p>
                <p className="text-xs text-gray-600">
                  {t('conversationInfo.modals.changeRole.memberDesc')}
                </p>
              </div>
            </div>
          </button>
        </div>

        {actionError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {actionError}
          </div>
        )}

        <button
          onClick={() => {
            setShow(false);
            setSelectedMember(null);
          }}
          disabled={actionLoading}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {t('conversationInfo.modals.cancel')}
        </button>
      </div>
    </div>
  );
}

/**
 * GroupModals - Container for all group-related modals
 */
export default function GroupModals({
  showKickModal,
  setShowKickModal,
  showLeaveModal,
  setShowLeaveModal,
  showRoleModal,
  setShowRoleModal,
  selectedMember,
  setSelectedMember,
  isOwner,
  members,
  currentUserId,
  actionLoading,
  actionError,
  kickMember,
  leaveGroup,
  transferOwnershipAndLeave,
  changeMemberRole,
  activeConversationId,
  onClose,
}) {
  const handleConfirmKick = async () => {
    if (!selectedMember) return;
    try {
      await kickMember(activeConversationId, selectedMember.uid);
      setShowKickModal(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Failed to kick member:', err);
    }
  };

  const handleConfirmLeave = async () => {
    try {
      await leaveGroup(activeConversationId);
      setShowLeaveModal(false);
      onClose();
    } catch (err) {
      console.error('Failed to leave group:', err);
    }
  };

  const handleConfirmOwnerLeave = async (newOwner) => {
    try {
      if (newOwner) {
        // Transfer ownership and leave
        await transferOwnershipAndLeave(activeConversationId, newOwner.uid);
      } else {
        // No members left - delete group
        await leaveGroup(activeConversationId); // Backend should handle group deletion
      }
      setShowLeaveModal(false);
      onClose();
    } catch (err) {
      console.error('Failed to transfer ownership and leave:', err);
    }
  };

  const handleConfirmChangeRole = async (newRole) => {
    if (!selectedMember) return;
    try {
      await changeMemberRole(activeConversationId, selectedMember.uid, newRole);
      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Failed to change role:', err);
    }
  };

  return (
    <>
      <KickModal
        show={showKickModal}
        setShow={setShowKickModal}
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        actionLoading={actionLoading}
        actionError={actionError}
        onConfirm={handleConfirmKick}
      />
      
      {/* Show different modal based on owner status */}
      {isOwner ? (
        <OwnerLeaveModal
          show={showLeaveModal}
          setShow={setShowLeaveModal}
          members={members}
          currentUserId={currentUserId}
          actionLoading={actionLoading}
          actionError={actionError}
          onConfirm={handleConfirmOwnerLeave}
        />
      ) : (
        <LeaveModal
          show={showLeaveModal}
          setShow={setShowLeaveModal}
          actionLoading={actionLoading}
          actionError={actionError}
          onConfirm={handleConfirmLeave}
        />
      )}

      <RoleModal
        show={showRoleModal}
        setShow={setShowRoleModal}
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        actionLoading={actionLoading}
        actionError={actionError}
        onConfirm={handleConfirmChangeRole}
      />
    </>
  );
}
// frontend/src/components/Chat/ConversationInfo/MembersSection.jsx - UPDATED

import React from 'react';
import { Users, Crown, Shield, UserMinus } from 'lucide-react';
import AvatarImage from '../../common/AvatarImage';
import InfoSection from './InfoSection';
import { useTranslation } from 'react-i18next';

/**
 * MemberItem Component
 * 
 * Backend member format:
 * {
 *   uid: string,           // ✅ Firebase UID (not MongoDB _id)
 *   nickname: string,
 *   avatar: string,
 *   role: 'owner' | 'admin' | 'member',
 *   joinedAt: Date
 * }
 */
function MemberItem({ 
  member, 
  currentUserId, 
  canKick, 
  canChangeRole, 
  handleKickMember, 
  handleChangeRole,
}) {
  // 🔥 Backend returns uid directly, not user.uid
  const isMe = member.uid === currentUserId;
  const memberRole = member.role || 'member';
  const { t } = useTranslation('conversation');

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <AvatarImage
          avatar={member.avatar}
          nickname={member.nickname || 'Unknown'}
          avatarUpdatedAt={member.avatarUpdatedAt}
          size="sm"
          showOnlineStatus={true}
          isOnline={member.isOnline || false}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {member.nickname || 'Unknown'}
            {isMe && <span className="text-xs text-gray-500 ml-2">({t('you')})</span>}
          </p>
          <div className="flex items-center gap-2">
            {memberRole === 'owner' && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Crown className="w-3 h-3" />
                {t('owner')}
              </span>
            )}
            {memberRole === 'admin' && (
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <Shield className="w-3 h-3" />
                {t('admin')}
              </span>
            )}
            {memberRole === 'member' && (
              <span className="text-xs text-gray-500">{t('member')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Member Actions (Admin/Owner only) */}
      {!isMe && (canKick || canChangeRole) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {canKick && memberRole === 'member' && (
            <button
              onClick={() => handleKickMember(member)}
              className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
              title={t('kickMember')}
            >
              <UserMinus className="w-4 h-4" />
            </button>
          )}
          {canChangeRole && memberRole !== 'owner' && (
            <button
              onClick={() => handleChangeRole(member)}
              className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
              title={t('changeRole')}
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * MembersSection Component
 * 
 * Displays sorted member list:
 * 1. Owner
 * 2. Admins (sorted by joinedAt)
 * 3. Members (sorted by joinedAt)
 */
export default function MembersSection({
  members,
  currentUserId,
  canKick,
  canChangeRole,
  canUpdateSettings,
  handleKickMember,
  handleChangeRole,
  setShowInviteModal,
  t,
}) {
  return (
    <InfoSection>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          {t('membersTitle', { count: members.length })}
        </h3>
        {canUpdateSettings && (
          <button 
            onClick={() => setShowInviteModal(true)}
            className="text-blue-500 text-sm font-medium hover:text-blue-600 cursor-pointer"
          >
            {t('add')}
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {members.map((member) => (
          <MemberItem 
            key={member.uid}  // 🔥 Use uid, not user.uid
            member={member}
            currentUserId={currentUserId}
            canKick={canKick}
            canChangeRole={canChangeRole}
            handleKickMember={handleKickMember}
            handleChangeRole={handleChangeRole}
            t={t}
          />
        ))}
      </div>
    </InfoSection>
  );
}
// frontend/src/components/Chat/ConversationInfo/ProfileSection.jsx

import React from 'react';
import { Camera, Users, Pencil, Check, Bell, VolumeX, Pin, Search } from 'lucide-react';
import AvatarImage from '../../common/AvatarImage';
import InfoSection from './InfoSection';

export default function ProfileSection({
  isGroup,
  displayName,
  profileAvatar,
  profileAvatarUpdatedAt,
  members,
  counters,
  infoLoading,
  canUpdateSettings,
  isEditingName,
  setIsEditingName,
  groupName,
  setGroupName,
  handleSaveGroupName,
  actionLoading,
  isMuted,
  setIsMuted,
  isPinned,
  setIsPinned,
  t,
}) {
  return (
    <InfoSection>
      <div className="flex flex-col items-center py-6 px-4">
        <div className="relative group">
          <AvatarImage
            avatar={profileAvatar}
            nickname={displayName}
            avatarUpdatedAt={profileAvatarUpdatedAt}
            size="2xl"
            className="shadow-lg"
          />
          {isGroup && canUpdateSettings && (
            <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="mt-4 w-full max-w-xs">
          {isEditingName && canUpdateSettings ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                placeholder={t('enterGroupName')}
              />
              <button
                onClick={handleSaveGroupName}
                disabled={actionLoading}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 group">
              <h3 className="text-xl font-bold text-gray-900">{displayName}</h3>
              {isGroup && canUpdateSettings && (
                <button
                  onClick={() => {
                    setGroupName(displayName);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all cursor-pointer"
                >
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
          {isGroup && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{t('membersCount', { count: members.length })}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>📊</span>
            <span>
              {infoLoading ? '...' : t('messagesCount', { count: counters.totalMessages })}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              isMuted
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title={isMuted ? t('unmute') : t('mute')}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              isPinned
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={isPinned ? t('unpin') : t('pin')}
          >
            <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
          </button>
          <button 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors cursor-pointer"
            title={t('search')}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>
    </InfoSection>
  );
}
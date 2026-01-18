// frontend/src/components/Chat/ConversationInfo/GroupSettingsSection.jsx - FIXED
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, Lock, Link2, UserCheck } from 'lucide-react';
import InfoSection from './InfoSection';
import { updateGroupInfo } from '../../../services/groupService';
import InviteLinkModal from './InviteLinkModal';

export default function GroupSettingsSection({
  conversationId,
  joinMode,
  onlyAdminCanChat,
  handleToggleAdminOnly,
  actionLoading,
  onJoinModeUpdate,
  isOwner,
}) {
  const { t } = useTranslation('conversation');
  
  const [isUpdatingJoinMode, setIsUpdatingJoinMode] = useState(false);
  const [joinModeError, setJoinModeError] = useState(null);
  const [optimisticJoinMode, setOptimisticJoinMode] = useState(null);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  
  const updateTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastConfirmedModeRef = useRef(null);

  useEffect(() => {
    if (optimisticJoinMode === null && joinMode !== lastConfirmedModeRef.current) {
      lastConfirmedModeRef.current = joinMode;
    }
  }, [joinMode, optimisticJoinMode]);

  const currentJoinMode = optimisticJoinMode !== null 
    ? optimisticJoinMode 
    : (lastConfirmedModeRef.current || joinMode);

  const handleJoinModeToggle = useCallback(async (newMode) => {
    if (newMode === currentJoinMode) return;

    setOptimisticJoinMode(newMode);
    setJoinModeError(null);

    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    updateTimeoutRef.current = setTimeout(async () => {
      setIsUpdatingJoinMode(true);
      abortControllerRef.current = new AbortController();

      try {
        await updateGroupInfo(conversationId, { joinMode: newMode });
        
        if (onJoinModeUpdate) {
          onJoinModeUpdate(newMode);
        }

        lastConfirmedModeRef.current = newMode;
        setOptimisticJoinMode(null);
      } catch (err) {
        if (err.name === 'AbortError') return;

        setOptimisticJoinMode(null);
        setJoinModeError(
          err.response?.data?.message || 
          t('conversationInfo.groupSettings.joinMode.updateFailed')
        );
        
        setTimeout(() => setJoinModeError(null), 3000);
      } finally {
        setIsUpdatingJoinMode(false);
        abortControllerRef.current = null;
      }
    }, 300);
  }, [currentJoinMode, conversationId, onJoinModeUpdate, t]);

  if (joinMode === null || joinMode === undefined) {
    return (
      <InfoSection>
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-500" />
            {t('conversationInfo.groupSettings.title')}
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
            <div className="flex gap-2">
              <div className="flex-1 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 h-16 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </InfoSection>
    );
  }

  return (
    <>
      <InfoSection>
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-500" />
            {t('conversationInfo.groupSettings.title')}
          </h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Join Mode Setting */}
          <div>
            <div className="mb-2">
              <p className="text-sm font-medium text-gray-900">
                {t('conversationInfo.groupSettings.joinMode.title')}
              </p>
              <p className="text-xs text-gray-500">
                {t('conversationInfo.groupSettings.joinMode.description')}
              </p>
            </div>

            <div className="flex gap-2">
              {/* Approval Mode Button */}
              <button
                onClick={() => handleJoinModeToggle('approval')}
                disabled={actionLoading}
                className={`
                  flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg
                  border-2 transition-all duration-150 ease-out text-sm
                  ${currentJoinMode === 'approval'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-[1.02]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${actionLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer active:scale-[0.98]'
                  }
                `}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">
                    {t('conversationInfo.groupSettings.joinMode.approval.label')}
                  </div>
                  <div className="text-xs opacity-75">
                    {t('conversationInfo.groupSettings.joinMode.approval.short')}
                  </div>
                </div>
              </button>

              {/* Link Mode Button */}
              <button
                onClick={() => handleJoinModeToggle('link')}
                disabled={actionLoading}
                className={`
                  flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg
                  border-2 transition-all duration-150 ease-out text-sm
                  ${currentJoinMode === 'link'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm scale-[1.02]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }
                  ${actionLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer active:scale-[0.98]'
                  }
                `}
              >
                <Link2 className="w-4 h-4 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">
                    {t('conversationInfo.groupSettings.joinMode.link.label')}
                  </div>
                  <div className="text-xs opacity-75">
                    {t('conversationInfo.groupSettings.joinMode.link.short')}
                  </div>
                </div>
              </button>
            </div>

            {/* Loading State */}
            {isUpdatingJoinMode && (
              <div className="flex items-center gap-2 text-xs text-blue-600 mt-2 animate-fade-in">
                <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="font-medium">{t('conversationInfo.groupSettings.joinMode.updating')}</span>
              </div>
            )}

            {/* Error Message */}
            {joinModeError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {joinModeError}
              </div>
            )}

            {/* Info Box */}
            <div className="mt-2 p-2.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 transition-all duration-200">
              {currentJoinMode === 'approval'
                ? t('conversationInfo.groupSettings.joinMode.approval.description')
                : t('conversationInfo.groupSettings.joinMode.link.description')
              }
            </div>

            {/* ✅ FIXED: Show "Manage Invite Links" for BOTH modes (if owner) */}
            {isOwner && (
              <button
                onClick={() => setShowInviteLinkModal(true)}
                className={`
                  mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 
                  text-white rounded-lg transition-colors font-medium
                  ${currentJoinMode === 'link' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  }
                `}
              >
                <Link2 className="w-4 h-4" />
                <span>{t('conversationInfo.groupSettings.manageLinks')}</span>
              </button>
            )}
          </div>

          {/* Message Permission Setting */}
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleToggleAdminOnly}
              disabled={actionLoading}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {t('conversationInfo.groupSettings.onlyAdminsCanSend')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t('conversationInfo.groupSettings.onlyAdminsCanSendDesc')}
                  </p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full transition-colors ${
                onlyAdminCanChat ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                  onlyAdminCanChat ? 'translate-x-6' : 'translate-x-0.5'
                } mt-0.5`}></div>
              </div>
            </button>
          </div>
        </div>
      </InfoSection>

      {/* Invite Link Modal */}
      <InviteLinkModal
        show={showInviteLinkModal}
        onClose={() => setShowInviteLinkModal(false)}
        conversationId={conversationId}
        joinMode={currentJoinMode}
        isOwner={isOwner}
      />
    </>
  );
}
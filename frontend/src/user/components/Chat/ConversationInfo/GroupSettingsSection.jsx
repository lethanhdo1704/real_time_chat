// frontend/src/components/Chat/ConversationInfo/GroupSettingsSection.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, Lock } from 'lucide-react';
import InfoSection from './InfoSection';

export default function GroupSettingsSection({
  onlyAdminCanChat,
  handleToggleAdminOnly,
  actionLoading,
}) {
  const { t } = useTranslation('conversation');

  return (
    <InfoSection>
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-500" />
          {t('conversationInfo.groupSettings.title')}
        </h3>
      </div>
      <div className="p-4">
        <button
          onClick={handleToggleAdminOnly}
          disabled={actionLoading}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">
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
    </InfoSection>
  );
}
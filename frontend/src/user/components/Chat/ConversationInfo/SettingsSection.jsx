// frontend/src/components/Chat/ConversationInfo/SettingsSection.jsx
import React from 'react';
import { Bell, Lock, Settings, Archive, ChevronRight } from 'lucide-react';
import InfoSection from './InfoSection';

function InfoItem({ icon: Icon, label, value, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-gray-500 text-sm">{value}</span>}
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </button>
  );
}

export default function SettingsSection({ isMuted, t }) {
  return (
    <InfoSection>
      <InfoItem 
        icon={Bell} 
        label={t('settings.notifications')} 
        value={isMuted ? t('muted') : t('enabled')} 
      />
      <InfoItem icon={Lock} label={t('settings.privacy')} />
      <InfoItem icon={Settings} label={t('settings.chatSettings')} />
      <InfoItem icon={Archive} label={t('settings.archive')} />
    </InfoSection>
  );
}
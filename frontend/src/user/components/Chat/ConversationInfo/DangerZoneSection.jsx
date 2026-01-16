// frontend/src/components/Chat/ConversationInfo/DangerZoneSection.jsx
import React from 'react';
import { LogOut, ChevronRight } from 'lucide-react';
import InfoSection from './InfoSection';

export default function DangerZoneSection({ handleLeaveGroup, t }) {
  return (
    <InfoSection>
      <button
        onClick={handleLeaveGroup}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 transition-colors cursor-pointer text-red-600"
      >
        <div className="flex items-center gap-3">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('actions.leaveGroup')}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>
    </InfoSection>
  );
}
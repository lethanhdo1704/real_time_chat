// frontend/src/user/components/call/IncomingCallModal.jsx

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AvatarImage from '../common/AvatarImage';
import useCallStore from '../../store/call/callStore';
import callSocketService from '../../services/socket/call.socket';
import { CALL_STATE, CALL_TYPE } from '../../utils/call/callConstants';
import { Phone, PhoneOff, MessageSquare, Clock } from 'lucide-react';

/**
 * 🎯 INCOMING CALL MODAL - MODERN DESIGN
 * 
 * Features:
 * - Beautiful gradient background with blur
 * - Pulsing avatar with animated rings
 * - Large, accessible buttons
 * - Quick actions (message, remind later)
 * - Smooth animations
 * - i18n support
 */
export default function IncomingCallModal() {
  const { t } = useTranslation("call");
  const [ringAnimation, setRingAnimation] = useState(false);

  // Call state
  const callState = useCallStore((state) => state.callState);
  const callType = useCallStore((state) => state.callType);
  const callId = useCallStore((state) => state.callId);
  const peerInfo = useCallStore((state) => state.peerInfo);

  // Show modal only when incoming ringing
  const isVisible = callState === CALL_STATE.INCOMING_RINGING;
  const isVideo = callType === CALL_TYPE.VIDEO;

  // ============================================
  // RINGING ANIMATION
  // ============================================
  useEffect(() => {
    if (isVisible) {
      setRingAnimation(true);
      const timer = setInterval(() => {
        setRingAnimation((prev) => !prev);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isVisible]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleAccept = () => {
    if (!callId) return;
    console.log('[IncomingCall] Accepting call:', callId);
    callSocketService.acceptCall(callId);
  };

  const handleReject = () => {
    if (!callId) return;
    console.log('[IncomingCall] Rejecting call:', callId);
    callSocketService.rejectCall(callId);
  };

  // ============================================
  // RENDER
  // ============================================
  if (!isVisible || !peerInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-indigo-600 via-purple-600 to-pink-500 backdrop-blur-sm animate-fadeIn">
      {/* Overlay blur */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      <div className="relative z-10 text-center px-8 py-12 max-w-md w-full">
        
        {/* Avatar with Animated Rings */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Pulsing rings */}
            <div className="absolute inset-0 -m-6 rounded-full border-4 border-white/30 animate-ping"></div>
            <div className="absolute inset-0 -m-10 rounded-full border-4 border-white/20 animate-ping" style={{ animationDelay: '0.3s' }}></div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 -m-8 rounded-full bg-white/20 blur-3xl"></div>
            
            {/* Avatar */}
            <div className="relative">
              <AvatarImage
                avatar={peerInfo.avatar}
                nickname={peerInfo.username}
                avatarUpdatedAt={peerInfo.avatarUpdatedAt}
                size="2xl"
                showOnlineStatus={true}
                isOnline={true}
              />
            </div>
          </div>
        </div>

        {/* Caller Name */}
        <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
          {peerInfo.username}
        </h2>

        {/* Call Type */}
        <p className="text-white/90 text-xl mb-2">
          {isVideo ? t('incomingVideoCall') : t('incomingVoiceCall')}
        </p>

        {/* Phone number (optional) */}
        {peerInfo.phone && (
          <p className="text-white/70 text-sm mb-8">
            {peerInfo.phone}
          </p>
        )}

        {/* Main Action Buttons */}
        <div className="flex justify-center gap-8 mt-12 mb-8">
          
          {/* Decline Button */}
          <button
            onClick={handleReject}
            className="group flex flex-col items-center gap-3"
            aria-label={t('decline')}
          >
            <div className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95">
              <PhoneOff className="w-10 h-10 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">
              {t('decline')}
            </span>
          </button>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            className="group flex flex-col items-center gap-3"
            aria-label={t('accept')}
          >
            <div className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 animate-bounce">
              <Phone className="w-10 h-10 text-white" />
            </div>
            <span className="text-white font-semibold text-lg">
              {t('accept')}
            </span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-8 mt-8">
          <button className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors group">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white/30 transition-all">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">
              {t('sendMessage')}
            </span>
          </button>

          <button className="flex flex-col items-center gap-2 text-white/80 hover:text-white transition-colors group">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white/30 transition-all">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">
              {t('remindLater')}
            </span>
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
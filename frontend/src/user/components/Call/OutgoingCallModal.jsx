// frontend/src/user/components/call/OutgoingCallModal.jsx

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AvatarImage from '../common/AvatarImage';
import useCallStore from '../../store/call/callStore';
import callSocketService from '../../services/socket/call.socket';
import { CALL_STATE, CALL_TYPE } from '../../utils/call/callConstants';
import { Video, Phone, PhoneOff } from 'lucide-react';

/**
 * 🎯 OUTGOING CALL MODAL - MODERN DESIGN
 * 
 * Features:
 * - Beautiful gradient background
 * - Animated dots for "calling..."
 * - Large avatar with pulsing rings
 * - Cancel button
 * - Call type indicator
 * - i18n support
 */
export default function OutgoingCallModal() {
  const { t } = useTranslation("call");
  const [dots, setDots] = useState('');

  // Call state
  const callState = useCallStore((state) => state.callState);
  const callType = useCallStore((state) => state.callType);
  const callId = useCallStore((state) => state.callId);
  const peerInfo = useCallStore((state) => state.peerInfo);

  // Show modal only when outgoing ringing
  const isVisible = callState === CALL_STATE.OUTGOING_RINGING;
  const isVideo = callType === CALL_TYPE.VIDEO;

  // ============================================
  // ANIMATED DOTS
  // ============================================
  useEffect(() => {
    if (isVisible) {
      const timer = setInterval(() => {
        setDots((prev) => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
      return () => clearInterval(timer);
    }
  }, [isVisible]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleCancel = () => {
    if (!callId) {
      useCallStore.getState().resetCall();
      return;
    }
    console.log('[OutgoingCall] Canceling call:', callId);
    callSocketService.endCall(callId);
  };

  // ============================================
  // RENDER
  // ============================================
  if (!isVisible || !peerInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-br from-blue-900/95 via-indigo-900/95 to-purple-900/95 backdrop-blur-sm animate-fadeIn">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="relative z-10 text-center px-8 py-12 max-w-md w-full">
        
        {/* Avatar with Pulsing Rings */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Animated rings - continuous pulse */}
            <div className="absolute inset-0 -m-6 rounded-full border-4 border-white/30 animate-ping"></div>
            <div className="absolute inset-0 -m-10 rounded-full border-4 border-white/20 animate-ping" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute inset-0 -m-14 rounded-full border-4 border-white/10 animate-ping" style={{ animationDelay: '0.6s' }}></div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 -m-8 rounded-full bg-blue-400/30 blur-3xl animate-pulse"></div>
            
            {/* Avatar */}
            <div className="relative">
              <AvatarImage
                avatar={peerInfo.avatar}
                nickname={peerInfo.username}
                avatarUpdatedAt={peerInfo.avatarUpdatedAt}
                size="2xl"
                showOnlineStatus={false}
              />
            </div>
          </div>
        </div>

        {/* Callee Name */}
        <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
          {peerInfo.username}
        </h2>

        {/* Phone number (optional) */}
        {peerInfo.phone && (
          <p className="text-white/80 text-lg mb-3">
            {peerInfo.phone}
          </p>
        )}

        {/* Status Text with Icon */}
        <div className="flex items-center justify-center gap-3 mb-2">
          {isVideo ? (
            <>
              <Video className="w-6 h-6 text-white/90" />
              <p className="text-white/90 text-xl font-medium">
                {t('videoCalling')}{dots}
              </p>
            </>
          ) : (
            <>
              <Phone className="w-6 h-6 text-white/90" />
              <p className="text-white/90 text-xl font-medium">
                {t('calling')}{dots}
              </p>
            </>
          )}
        </div>

        <p className="text-white/70 text-base mb-16">
          {t('waitingForAnswer')}
        </p>

        {/* Waveform Animation */}
        <div className="flex items-center justify-center gap-1.5 mb-16">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-white/70 rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 32 + 16}px`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="flex flex-col items-center gap-3 mx-auto group"
          aria-label={t('cancel')}
        >
          <div className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95">
            <PhoneOff className="w-10 h-10 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">
            {t('cancel')}
          </span>
        </button>
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
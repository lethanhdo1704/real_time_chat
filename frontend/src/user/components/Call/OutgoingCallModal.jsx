// frontend/src/user/components/call/OutgoingCallModal.jsx

import { useEffect, useState } from 'react';
import AvatarImage from '../common/AvatarImage';
import useCallStore from '../../store/call/callStore';
import callSocketService from '../../services/socket/call.socket';
import { CALL_STATE, CALL_TYPE } from '../../utils/call/callConstants';

/**
 * 🎯 OUTGOING CALL MODAL
 * 
 * Show when: callState === OUTGOING_RINGING
 * 
 * Features:
 * - Callee info (avatar, name)
 * - Call type indicator (voice/video)
 * - Ringing animation & sound
 * - Cancel button
 */
export default function OutgoingCallModal() {
  const [dots, setDots] = useState('');

  // Call state
  const callState = useCallStore((state) => state.callState);
  const callType = useCallStore((state) => state.callType);
  const callId = useCallStore((state) => state.callId);
  const peerInfo = useCallStore((state) => state.peerInfo);

  // Show modal only when outgoing ringing
  const isVisible = callState === CALL_STATE.OUTGOING_RINGING;

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
      // Nếu chưa có callId (chưa nhận call:initiated) → reset local
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

  const isVideo = callType === CALL_TYPE.VIDEO;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900/90 to-purple-900/90 backdrop-blur-sm animate-fadeIn">
      <div className="text-center px-8 py-12 max-w-sm w-full">
        
        {/* Avatar with Pulsing Ring */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Animated rings */}
            <div className="absolute inset-0 -m-6 rounded-full border-4 border-white/30 animate-ping"></div>
            <div className="absolute inset-0 -m-10 rounded-full border-4 border-white/20 animate-ping" style={{ animationDelay: '0.3s' }}></div>
            
            {/* Avatar */}
            <div className="relative ring-4 ring-white/50 rounded-full">
              <AvatarImage
                avatar={peerInfo.avatar}
                nickname={peerInfo.username}
                size="2xl"
                showOnlineStatus={false}
              />
            </div>
          </div>
        </div>

        {/* Callee Name */}
        <h2 className="text-3xl font-bold text-white mb-3">
          {peerInfo.username}
        </h2>

        {/* Status Text */}
        <p className="text-white/80 text-lg mb-2 flex items-center justify-center gap-2">
          {isVideo ? (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Video calling{dots}</span>
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Calling{dots}</span>
            </>
          )}
        </p>

        <p className="text-white/60 text-sm mb-12">
          Waiting for answer...
        </p>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="flex flex-col items-center gap-3 mx-auto group"
          aria-label="Cancel call"
        >
          <div className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="text-white font-medium text-lg">Cancel</span>
        </button>
      </div>
    </div>
  );
}
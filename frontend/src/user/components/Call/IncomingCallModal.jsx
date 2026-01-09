// frontend/src/user/components/call/IncomingCallModal.jsx

import { useEffect, useState } from 'react';
import AvatarImage from '../common/AvatarImage';
import useCallStore from '../../store/call/callStore';
import callSocketService from '../../services/socket/call.socket';
import { CALL_STATE, CALL_TYPE } from '../../utils/call/callConstants';

/**
 * 🎯 INCOMING CALL MODAL
 * 
 * Show when: callState === INCOMING_RINGING
 * 
 * Features:
 * - Caller info (avatar, name)
 * - Call type indicator (voice/video)
 * - Ringing animation
 * - Accept / Reject buttons
 * - Auto dismiss on timeout
 */
export default function IncomingCallModal() {
  const [ringAnimation, setRingAnimation] = useState(false);

  // Call state
  const callState = useCallStore((state) => state.callState);
  const callType = useCallStore((state) => state.callType);
  const callId = useCallStore((state) => state.callId);
  const peerInfo = useCallStore((state) => state.peerInfo);

  // Show modal only when incoming ringing
  const isVisible = callState === CALL_STATE.INCOMING_RINGING;

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

  const isVideo = callType === CALL_TYPE.VIDEO;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-slideUp">
        
        {/* Avatar with Ring Animation */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Pulsing rings */}
            {ringAnimation && (
              <>
                <div className="absolute inset-0 -m-4 rounded-full border-4 border-blue-400 animate-ping opacity-75"></div>
                <div className="absolute inset-0 -m-8 rounded-full border-4 border-blue-300 animate-ping opacity-50" style={{ animationDelay: '0.2s' }}></div>
              </>
            )}
            
            {/* Avatar */}
            <div className="relative">
              <AvatarImage
                avatar={peerInfo.avatar}
                nickname={peerInfo.username}
                size="2xl"
                showOnlineStatus={false}
              />
            </div>
          </div>
        </div>

        {/* Caller Name */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {peerInfo.username}
        </h2>

        {/* Call Type */}
        <p className="text-gray-500 text-center mb-8 flex items-center justify-center gap-2">
          {isVideo ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Incoming video call...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Incoming voice call...</span>
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {/* Reject Button */}
          <button
            onClick={handleReject}
            className="flex flex-col items-center gap-2 group"
            aria-label="Reject call"
          >
            <div className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 font-medium">Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            className="flex flex-col items-center gap-2 group"
            aria-label="Accept call"
          >
            <div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform animate-pulse">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-gray-600 font-medium">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
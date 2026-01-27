// frontend/src/user/components/call/CallControls.jsx

import { useTranslation } from 'react-i18next';
import useCallStore from '../../store/call/callStore';
import WebRTCManager from '../../webrtc/peerConnection';
import { CALL_TYPE } from '../../utils/call/callConstants';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Volume2, Monitor } from 'lucide-react';

/**
 * 🎯 CALL CONTROLS - MODERN DESIGN
 * 
 * Features:
 * - Large, accessible buttons with tooltips
 * - Smooth transitions and hover effects
 * - Visual feedback for active states
 * - Responsive design (mobile/desktop)
 * - i18n support
 */
export default function CallControls({ onEndCall }) {
  const { t } = useTranslation("call");
  
  // Store state
  const callType = useCallStore((state) => state.callType);
  const isMuted = useCallStore((state) => state.isMuted);
  const isVideoOff = useCallStore((state) => state.isVideoOff);
  const isSpeakerOn = useCallStore((state) => state.isSpeakerOn);

  // Store actions
  const toggleMute = useCallStore((state) => state.toggleMute);
  const toggleVideo = useCallStore((state) => state.toggleVideo);
  const toggleSpeaker = useCallStore((state) => state.toggleSpeaker);

  // WebRTC manager
  const webrtc = WebRTCManager.getInstance();

  const isVideoCall = callType === CALL_TYPE.VIDEO;

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    toggleMute();
    webrtc.toggleMute(!newMuted);
    console.log('[CallControls] Audio:', newMuted ? 'muted' : 'unmuted');
  };

  const handleToggleVideo = () => {
    const newVideoOff = !isVideoOff;
    toggleVideo();
    webrtc.toggleVideo(!newVideoOff);
    console.log('[CallControls] Video:', newVideoOff ? 'off' : 'on');
  };

  const handleToggleSpeaker = () => {
    toggleSpeaker();
    console.log('[CallControls] Speaker:', !isSpeakerOn ? 'on' : 'off');
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="relative py-8 px-4">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 md:gap-6">
        
        {/* Mute/Unmute Button */}
        <button
          onClick={handleToggleMute}
          className="group relative"
          title={isMuted ? t('unmute') : t('mute')}
        >
          <div className={`
            w-14 h-14 md:w-16 md:h-16 rounded-full 
            flex items-center justify-center 
            transition-all duration-300
            hover:scale-110 active:scale-95
            shadow-xl
            ${isMuted 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-white/20 hover:bg-white/30'
            }
          `}>
            {isMuted ? (
              <MicOff className="w-6 h-6 md:w-7 md:h-7 text-white" />
            ) : (
              <Mic className="w-6 h-6 md:w-7 md:h-7 text-white" />
            )}
          </div>
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-white/80 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {isMuted ? t('unmute') : t('mute')}
          </span>
        </button>

        {/* Video Toggle (only for video calls) */}
        {isVideoCall && (
          <button
            onClick={handleToggleVideo}
            className="group relative"
            title={isVideoOff ? t('turnOnCamera') : t('turnOffCamera')}
          >
            <div className={`
              w-14 h-14 md:w-16 md:h-16 rounded-full 
              flex items-center justify-center 
              transition-all duration-300
              hover:scale-110 active:scale-95
              shadow-xl
              ${isVideoOff 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/20 hover:bg-white/30'
              }
            `}>
              {isVideoOff ? (
                <VideoOff className="w-6 h-6 md:w-7 md:h-7 text-white" />
              ) : (
                <Video className="w-6 h-6 md:w-7 md:h-7 text-white" />
              )}
            </div>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-white/80 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {isVideoOff ? t('turnOnCamera') : t('turnOffCamera')}
            </span>
          </button>
        )}

        {/* End Call Button (always visible, always red) */}
        <button
          onClick={onEndCall}
          className="group relative"
          title={t('endCall')}
        >
          <div className="
            w-16 h-16 md:w-20 md:h-20 rounded-full 
            bg-red-500 hover:bg-red-600
            flex items-center justify-center 
            shadow-2xl
            transition-all duration-300
            hover:scale-110 active:scale-95
          ">
            <PhoneOff className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-white/80 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {t('endCall')}
          </span>
        </button>

        {/* Speaker Toggle (mobile only) */}
        <button
          onClick={handleToggleSpeaker}
          className="group relative md:hidden"
          title={isSpeakerOn ? t('speakerOn') : t('speakerOff')}
        >
          <div className={`
            w-14 h-14 rounded-full 
            flex items-center justify-center 
            transition-all duration-300
            hover:scale-110 active:scale-95
            shadow-xl
            ${isSpeakerOn 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-white/20 hover:bg-white/30'
            }
          `}>
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-white/80 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {isSpeakerOn ? t('speakerOn') : t('speakerOff')}
          </span>
        </button>

        {/* Screen Share (desktop only) */}
        {!isVideoCall && (
          <button
            className="group relative hidden md:block"
            title={t('shareScreen')}
          >
            <div className="
              w-14 h-14 md:w-16 md:h-16 rounded-full 
              bg-white/20 hover:bg-white/30
              flex items-center justify-center 
              transition-all duration-300
              hover:scale-110 active:scale-95
              shadow-xl
            ">
              <Monitor className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-white/80 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {t('shareScreen')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
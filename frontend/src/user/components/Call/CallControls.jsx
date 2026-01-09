// frontend/src/user/components/call/CallControls.jsx

import useCallStore from '../../store/call/callStore';
import WebRTCManager from '../../webrtc/peerConnection';
import { CALL_TYPE } from '../../utils/call/callConstants';

/**
 * 🎯 CALL CONTROLS
 * 
 * Buttons:
 * - Mute/Unmute (toggle audio track)
 * - Video on/off (toggle video track)
 * - Speaker (mobile only)
 * - End call (always red)
 * 
 * Props:
 * - onEndCall: callback khi bấm end
 */
export default function CallControls({ onEndCall }) {
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

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleToggleMute = () => {
    const newMuted = !isMuted;
    toggleMute();
    webrtc.toggleMute(!newMuted); // enabled = !muted
    console.log('[CallControls] Audio:', newMuted ? 'muted' : 'unmuted');
  };

  const handleToggleVideo = () => {
    const newVideoOff = !isVideoOff;
    toggleVideo();
    webrtc.toggleVideo(!newVideoOff); // enabled = !videoOff
    console.log('[CallControls] Video:', newVideoOff ? 'off' : 'on');
  };

  const handleToggleSpeaker = () => {
    toggleSpeaker();
    // TODO: Implement speaker toggle for mobile
    console.log('[CallControls] Speaker:', !isSpeakerOn ? 'on' : 'off');
  };

  const isVideoCall = callType === CALL_TYPE.VIDEO;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="flex items-center justify-center gap-4 py-6 px-4">
      
      {/* Mute/Unmute Button */}
      <button
        onClick={handleToggleMute}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
          isMuted
            ? 'bg-gray-700 hover:bg-gray-600'
            : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
        }`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Video Toggle (only for video calls) */}
      {isVideoCall && (
        <button
          onClick={handleToggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isVideoOff
              ? 'bg-gray-700 hover:bg-gray-600'
              : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
          }`}
          title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoOff ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}

      {/* End Call Button (always visible, always red) */}
      <button
        onClick={onEndCall}
        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-xl transition-all hover:scale-110"
        title="End call"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
        </svg>
      </button>

      {/* Speaker Toggle (mobile only - optional) */}
      <button
        onClick={handleToggleSpeaker}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg md:hidden ${
          isSpeakerOn
            ? 'bg-blue-500 hover:bg-blue-600'
            : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
        }`}
        title={isSpeakerOn ? 'Speaker on' : 'Speaker off'}
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      </button>
    </div>
  );
}
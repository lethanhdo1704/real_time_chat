// frontend/src/user/components/call/CallScreen.jsx

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AvatarImage from '../common/AvatarImage';
import CallControls from './CallControls';
import useCallStore from '../../store/call/callStore';
import { CALL_STATE, CALL_TYPE } from '../../utils/call/callConstants';

export default function CallScreen({ onEndCall }) {
  const { t } = useTranslation("call");
  
  // Refs for media elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Call state from store
  const callState = useCallStore(state => state.callState);
  const callType = useCallStore(state => state.callType);
  const peerInfo = useCallStore(state => state.peerInfo);
  const localStream = useCallStore(state => state.localStream);
  const remoteStream = useCallStore(state => state.remoteStream);
  const isVideoOff = useCallStore(state => state.isVideoOff);
  const callStartTime = useCallStore(state => state.callStartTime);

  // Local state
  const [duration, setDuration] = useState(0);

  // Visibility logic
  const isVisible = [CALL_STATE.CONNECTING, CALL_STATE.IN_CALL].includes(callState);
  const isVideoCall = callType === CALL_TYPE.VIDEO;
  const isConnecting = callState === CALL_STATE.CONNECTING;

  // ============================================
  // MEDIA ATTACHMENT EFFECTS
  // ============================================
  // Remote audio for voice calls
  useEffect(() => {
    if (!remoteStream || !remoteAudioRef.current || isVideoCall) return;

    const audioEl = remoteAudioRef.current;
    audioEl.srcObject = remoteStream;
    audioEl.autoplay = true;
    audioEl.playsInline = true;
    audioEl.muted = false;

    const playAudio = async () => {
      try {
        await audioEl.play();
      } catch (err) {
        console.error('[CallScreen] Audio play failed:', err);
      }
    };

    playAudio();
    
    const audioTrack = remoteStream.getAudioTracks()[0];
    audioTrack?.addEventListener('unmute', playAudio);

    return () => {
      audioTrack?.removeEventListener('unmute', playAudio);
    };
  }, [remoteStream, isVideoCall]);

  // Local video attachment
  useEffect(() => {
    if (localStream && localVideoRef.current && isVideoCall) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoCall]);

  // Remote video attachment
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current && isVideoCall) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideoCall]);

  // ============================================
  // CALL DURATION
  // ============================================
  useEffect(() => {
    if (callState !== CALL_STATE.IN_CALL || !callStartTime) return;

    const timer = setInterval(() => {
      setDuration(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [callState, callStartTime]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // VOICE CALL UI
  // ============================================
  if (!isVisible || !peerInfo) return null;

  if (!isVideoCall) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* Hidden audio element */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          muted={false}
          className="hidden"
        />

        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-black/40">
          <div className="flex items-center justify-between">
            <p className="text-white/90 font-medium">
              {isConnecting ? t('connecting') : t('voiceCall')}
            </p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
              <span className="text-white/80 text-sm">
                {isConnecting ? t('connecting') : t('connected')}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          {/* Avatar */}
          <div className="relative mb-6">
            <div className="absolute inset-0 -m-6 rounded-full bg-white/10 animate-pulse"></div>
            <AvatarImage
              avatar={peerInfo.avatar}
              nickname={peerInfo.username}
              avatarUpdatedAt={peerInfo.avatarUpdatedAt}
              size="3xl"
              showOnlineStatus={false}
              className="ring-4 ring-white/20"
            />
          </div>

          {/* Name and Duration */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {peerInfo.username}
          </h2>
          <div className="text-xl md:text-2xl text-white/90 mb-8 font-mono">
            {isConnecting ? (
              <span className="animate-pulse">{t('connecting')}</span>
            ) : (
              formatDuration(duration)
            )}
          </div>

          {/* Audio Waveform */}
          {!isConnecting && (
            <div className="flex items-end gap-1.5 h-16 mb-8">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-purple-300 to-pink-300 rounded-full"
                  style={{
                    height: `${Math.random() * 50 + 20}px`,
                    animation: `pulse 1s ${i * 0.12}s infinite alternate`
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-black/60 py-4">
          <CallControls onEndCall={onEndCall} />
        </div>

        {/* Waveform animation keyframes */}
        <style jsx>{`
          @keyframes pulse {
            0% { opacity: 0.6; transform: scaleY(0.8); }
            100% { opacity: 1; transform: scaleY(1); }
          }
          .wave-bar {
            animation-name: pulse;
          }
        `}</style>
      </div>
    );
  }

  // ============================================
  // VIDEO CALL UI
  // ============================================
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Remote Video */}
      <div className="absolute inset-0">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center p-8">
              <AvatarImage
                avatar={peerInfo.avatar}
                nickname={peerInfo.username}
                avatarUpdatedAt={peerInfo.avatarUpdatedAt}
                size="3xl"
                showOnlineStatus={false}
              />
              <p className="text-white text-2xl font-semibold mt-6">
                {peerInfo.username}
              </p>
              <p className="text-gray-400 mt-2">
                {isConnecting ? t('connecting') : t('waitingForVideo')}
              </p>
            </div>
          </div>
        )}

        {/* Top Info Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-black/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">
                {peerInfo.username}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm">
                <span className="text-purple-300 font-mono">
                  {isConnecting ? t('connecting') : formatDuration(duration)}
                </span>
                {!isConnecting && (
                  <>
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">{t('connected')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Local Video PiP */}
        {(localStream && !isVideoOff) && (
          <div className="absolute bottom-24 right-4 md:bottom-28 md:right-6 z-20 w-24 h-32 md:w-36 md:h-48 rounded-xl overflow-hidden border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )}

        {/* Camera Off Indicator */}
        {(localStream && isVideoOff) && (
          <div className="absolute bottom-24 right-4 md:bottom-28 md:right-6 z-20 w-24 h-32 md:w-36 md:h-48 rounded-xl bg-black/70 border-2 border-white/20 flex flex-col items-center justify-center p-2">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-center text-gray-300">
              {t('cameraOff')}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/80 py-4">
        <CallControls onEndCall={onEndCall} />
      </div>
    </div>
  );
}
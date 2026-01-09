// frontend/src/user/components/call/CallScreen.jsx

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AvatarImage from '../common/AvatarImage';
import CallControls from './CallControls';
import useCallStore from '../../store/call/callStore';
import { CALL_STATE, CALL_TYPE } from '../../utils/call/callConstants';

/**
 * 🎯 CALL SCREEN - MODERN DESIGN
 * 
 * Features:
 * - Voice call: Elegant gradient background with audio waveform
 * - Video call: Fullscreen remote video + corner PiP for local
 * - Beautiful overlays with glassmorphism
 * - Call duration timer
 * - Connection status
 * - i18n support
 */
export default function CallScreen({ onEndCall }) {
  const { t } = useTranslation("call");
  
  // Refs for audio/video elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Call state
  const callState = useCallStore((state) => state.callState);
  const callType = useCallStore((state) => state.callType);
  const peerInfo = useCallStore((state) => state.peerInfo);
  const localStream = useCallStore((state) => state.localStream);
  const remoteStream = useCallStore((state) => state.remoteStream);
  const isVideoOff = useCallStore((state) => state.isVideoOff);
  const callStartTime = useCallStore((state) => state.callStartTime);

  // Local state
  const [duration, setDuration] = useState(0);

  // Show screen only when connecting or in call
  const isVisible = [CALL_STATE.CONNECTING, CALL_STATE.IN_CALL].includes(callState);
  const isVideoCall = callType === CALL_TYPE.VIDEO;
  const isConnecting = callState === CALL_STATE.CONNECTING;

  // ============================================
  // ATTACH REMOTE AUDIO (VOICE CALL)
  // ============================================
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current && !isVideoCall) {
      console.log('[CallScreen] 🔊 Attaching remote audio stream');
      
      const audioEl = remoteAudioRef.current;
      audioEl.srcObject = remoteStream;
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      audioEl.muted = false;
      audioEl.volume = 1.0;
      
      const playAudio = async () => {
        try {
          await audioEl.play();
          console.log('[CallScreen] ✅ Audio playing');
        } catch (err) {
          console.error('[CallScreen] ❌ Audio play error:', err);
        }
      };
      
      playAudio();
      
      const audioTrack = remoteStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.onunmute = () => playAudio();
      }
    }
  }, [remoteStream, isVideoCall]);

  // ============================================
  // ATTACH LOCAL VIDEO
  // ============================================
  useEffect(() => {
    if (localStream && localVideoRef.current && isVideoCall) {
      console.log('[CallScreen] 📹 Attaching local video');
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoCall]);

  // ============================================
  // ATTACH REMOTE VIDEO
  // ============================================
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current && isVideoCall) {
      console.log('[CallScreen] 📹 Attaching remote video');
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, isVideoCall]);

  // ============================================
  // CALL DURATION TIMER
  // ============================================
  useEffect(() => {
    if (callState === CALL_STATE.IN_CALL && callStartTime) {
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        setDuration(elapsed);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [callState, callStartTime]);

  // ============================================
  // FORMAT DURATION
  // ============================================
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // RENDER
  // ============================================
  if (!isVisible || !peerInfo) return null;

  // ============================================
  // VOICE CALL UI
  // ============================================
  if (!isVideoCall) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900">
        
        {/* Hidden audio element */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          muted={false}
          className="hidden"
        />

        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-linear-to-b from-black/40 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-white/90 text-base font-medium">
              {isConnecting ? t('connecting') : t('voiceCall')}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/80 text-sm">
                {isConnecting ? t('connecting') : 'Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
          </div>

          {/* Avatar with animated glow */}
          <div className="relative mb-8 z-10">
            <div className="absolute inset-0 -m-8 rounded-full bg-white/20 blur-3xl animate-pulse"></div>
            <div className="relative">
              <AvatarImage
                avatar={peerInfo.avatar}
                nickname={peerInfo.username}
                avatarUpdatedAt={peerInfo.avatarUpdatedAt}
                size="3xl"
                showOnlineStatus={false}
                className="ring-8 ring-white/30"
              />
            </div>
          </div>

          {/* Name */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 z-10 drop-shadow-lg">
            {peerInfo.username}
          </h2>

          {/* Duration / Status */}
          <div className="text-2xl md:text-3xl text-white/90 mb-12 z-10 font-mono">
            {isConnecting ? (
              <span className="animate-pulse">{t('connecting')}</span>
            ) : (
              <span>{formatDuration(duration)}</span>
            )}
          </div>

          {/* Audio Waveform Animation */}
          {!isConnecting && (
            <div className="flex items-end gap-2 mb-8 z-10 h-20">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-linear-to-t from-purple-400 to-pink-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 60 + 20}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          )}

          {/* Debug button for mobile */}
          {!isConnecting && remoteStream && (
            <button
              onClick={() => {
                const audio = remoteAudioRef.current;
                if (audio) {
                  audio.play()
                    .then(() => console.log('✅ Manual play'))
                    .catch(err => console.error('❌ Play failed:', err));
                }
              }}
              className="mb-4 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium backdrop-blur-md transition-all z-10"
            >
              {t('tapIfNoSound')}
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="bg-linear-to-t from-black/60 to-transparent backdrop-blur-md">
          <CallControls onEndCall={onEndCall} />
        </div>
      </div>
    );
  }

  // ============================================
  // VIDEO CALL UI
  // ============================================
  return (
    <div className="fixed inset-0 z-50 bg-black">
      
      {/* Remote Video (Fullscreen) */}
      <div className="absolute inset-0">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Fallback: Avatar while connecting */
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-800 to-gray-900">
            <div className="text-center">
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
              <p className="text-white/60 mt-2 animate-pulse">
                {isConnecting ? t('connecting') : t('waitingForVideo')}
              </p>
            </div>
          </div>
        )}

        {/* Top Overlay: Name + Duration */}
        <div className="absolute top-0 left-0 right-0 z-20 p-6 bg-linear-to-b from-black/60 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-xl mb-1 drop-shadow-lg">
                {peerInfo.username}
              </h3>
              <div className="flex items-center gap-3">
                <p className="text-white/90 text-base font-mono">
                  {isConnecting ? t('connecting') : formatDuration(duration)}
                </p>
                {!isConnecting && (
                  <>
                    <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-white/80 text-sm">Connected</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Local Video (Picture-in-Picture) */}
        {localStream && !isVideoOff && (
          <div className="absolute bottom-28 right-4 md:bottom-32 md:right-6 z-20 w-28 h-36 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 backdrop-blur-sm">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          </div>
        )}

        {/* Local Video OFF - Show Avatar */}
        {localStream && isVideoOff && (
          <div className="absolute bottom-28 right-4 md:bottom-32 md:right-6 z-20 w-28 h-36 md:w-40 md:h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center px-2">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-2 rounded-full bg-gray-700 flex items-center justify-center">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
              </div>
              <p className="text-white/70 text-xs font-medium">
                {t('cameraOff')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-linear-to-t from-black/80 to-transparent backdrop-blur-xl">
        <CallControls onEndCall={onEndCall} />
      </div>

      {/* CSS for mirror effect */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
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
  // VOICE CALL UI - Modern Design
  // ============================================
  if (!isVisible || !peerInfo) return null;

  if (!isVideoCall) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          muted={false}
          className="hidden"
        />

        {/* Call Timer - Top Left */}
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center gap-2 bg-black/30 rounded-full px-4 py-2.5">
            <div className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div>
            <span className="text-white font-mono font-semibold text-sm">
              {isConnecting ? t('connecting') : formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Connection Quality Indicator - Top Right */}
        {!isConnecting && (
          <div className="absolute top-6 right-6 z-10">
            <div className="flex items-center gap-2 bg-black/30 rounded-full px-4 py-2.5">
              <div className="flex items-end gap-0.5 h-4">
                <div className="w-1 h-2 bg-green-400 rounded-full"></div>
                <div className="w-1 h-3 bg-green-400 rounded-full"></div>
                <div className="w-1 h-4 bg-green-400 rounded-full"></div>
              </div>
              <span className="text-white text-xs font-medium">HD</span>
            </div>
          </div>
        )}

        {/* Main Content - Centered */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-4 pb-8">
          {/* Avatar with Glow Effect */}
          <div className="relative mb-8">
            <div className={`absolute inset-0 rounded-full blur-2xl ${isConnecting ? 'bg-yellow-400/30' : 'bg-green-400/30'} animate-pulse`}></div>
            <AvatarImage
              avatar={peerInfo.avatar}
              nickname={peerInfo.username}
              avatarUpdatedAt={peerInfo.avatarUpdatedAt}
              size="4xl"
              showOnlineStatus={false}
              className={`relative ring-4 ${isConnecting ? 'ring-yellow-400/50' : 'ring-green-400/50'} shadow-2xl`}
            />
          </div>

          {/* Name */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
            {peerInfo.username}
          </h2>

          {/* Status */}
          <div className="text-lg md:text-xl text-white/70 mb-12">
            {isConnecting ? (
              <span className="animate-pulse text-yellow-300">{t('connecting')}</span>
            ) : (
              <span className="text-white/60">Voice Call</span>
            )}
          </div>

          {/* Audio Waveform Animation */}
          {!isConnecting && (
            <div className="flex items-end gap-1.5 h-16 px-2">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-linear-to-t from-purple-400 via-pink-400 to-purple-300 rounded-full"
                  style={{
                    height: `${Math.random() * 50 + 20}px`,
                    animation: `waveform ${0.8 + Math.random() * 0.5}s ${i * 0.05}s infinite alternate ease-in-out`,
                    opacity: 0.6 + Math.random() * 0.4
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="relative py-8 px-6">
          <CallControls onEndCall={onEndCall} />
        </div>

        {/* Custom Animations */}
        <style jsx global>{`
          @keyframes waveform {
            0% {
              transform: scaleY(0.5);
              opacity: 0.4;
            }
            100% {
              transform: scaleY(1);
              opacity: 1;
            }
          }
          .delay-1000 {
            animation-delay: 1s;
          }
        `}</style>
      </div>
    );
  }

  // ============================================
  // VIDEO CALL UI - Modern Design
  // ============================================
  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Remote Video - Full Screen */}
      <div className="absolute inset-0">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-900 via-gray-800 to-black">
            <div className="text-center p-8">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
                <AvatarImage
                  avatar={peerInfo.avatar}
                  nickname={peerInfo.username}
                  avatarUpdatedAt={peerInfo.avatarUpdatedAt}
                  size="4xl"
                  showOnlineStatus={false}
                  className="relative ring-4 ring-purple-500/30"
                />
              </div>
              <p className="text-white text-3xl font-bold mb-3">
                {peerInfo.username}
              </p>
              <p className="text-gray-400 text-lg">
                {isConnecting ? t('connecting') : t('waitingForVideo')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call Timer & Quality - Top */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between">
        {/* Timer */}
        <div className="flex items-center gap-2 bg-black/40 rounded-2xl px-5 py-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div>
          <span className="text-white font-mono font-bold text-base">
            {isConnecting ? t('connecting') : formatDuration(duration)}
          </span>
        </div>

        {/* Connection Quality */}
        {!isConnecting && (
          <div className="flex items-center gap-2 bg-black/40 rounded-2xl px-5 py-3">
            <div className="flex items-end gap-0.5 h-5">
              <div className="w-1 h-2.5 bg-green-400 rounded-full"></div>
              <div className="w-1 h-3.5 bg-green-400 rounded-full"></div>
              <div className="w-1 h-5 bg-green-400 rounded-full"></div>
            </div>
            <span className="text-white text-sm font-semibold">HD</span>
          </div>
        )}
      </div>

      {/* Local Video PiP - Modern Style */}
      {(localStream && !isVideoOff) && (
        <div className="absolute bottom-28 right-6 z-20 md:w-64 md:h-48 w-40 h-32 rounded-2xl overflow-hidden shadow-2xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          {/* PiP Label */}
          <div className="absolute bottom-3 left-3 right-3 bg-black/60 rounded-full px-3 py-1.5 flex items-center justify-center border border-white/20">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-white text-xs font-semibold tracking-wide">{t('you')}</span>
          </div>
        </div>
      )}

      {/* Camera Off Indicator - Modern Style */}
      {(localStream && isVideoOff) && (
        <div className="absolute bottom-28 right-6 z-20 md:w-64 md:h-48 w-40 h-32 rounded-2xl bg-linear-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-gray-800/80 flex items-center justify-center mb-3">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-300">
            {t('cameraOff')}
          </p>
        </div>
      )}

      {/* Controls - Bottom Center */}
      <div className="absolute bottom-0 left-0 right-0 z-30 py-8 px-4 md:px-8 bg-linear-to-t from-black/80 via-black/40 to-transparent">
        <div className="max-w-5xl mx-auto">
          <CallControls onEndCall={onEndCall} />
        </div>
      </div>
    </div>
  );
}
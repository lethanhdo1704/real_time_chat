// frontend/src/user/components/call/CallScreen.jsx

import { useEffect, useRef, useState } from 'react';
import AvatarImage from '../common/AvatarImage';
import CallControls from './CallControls';
import useCallStore from '../../store/call/callStore';
import { CALL_STATE, CALL_TYPE } from '../../utils/call/callConstants';

/**
 * 🎯 CALL SCREEN
 * 
 * Show when: callState === CONNECTING | IN_CALL
 * 
 * Layout:
 * - Voice call: Large avatar + audio waveform + duration + controls
 * - Video call: Remote video (fullscreen) + Local video (corner) + controls
 * 
 * Features:
 * - Auto-attach media streams to video elements
 * - Call duration timer
 * - Connection status indicator
 */
export default function CallScreen({ onEndCall }) {
  // ✅ Refs for audio/video elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null); // ✅ ADD: For voice call audio

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
  // ✅ ATTACH REMOTE AUDIO (VOICE CALL)
  // ============================================
  useEffect(() => {
    if (remoteStream && remoteAudioRef.current && !isVideoCall) {
      console.log('[CallScreen] 🔊 Attaching remote audio stream');
      console.log('[CallScreen] 🔊 Stream info:', {
        id: remoteStream.id,
        audioTracks: remoteStream.getAudioTracks().length,
        videoTracks: remoteStream.getVideoTracks().length,
        active: remoteStream.active
      });
      
      const audioTrack = remoteStream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('[CallScreen] 🔊 Audio track:', {
          id: audioTrack.id,
          enabled: audioTrack.enabled,
          muted: audioTrack.muted,
          readyState: audioTrack.readyState
        });
      }
      
      remoteAudioRef.current.srcObject = remoteStream;
      
      // ✅ CRITICAL: Force play
      remoteAudioRef.current.play()
        .then(() => {
          console.log('[CallScreen] ✅ Audio playing successfully');
          console.log('[CallScreen] 🔊 Audio element:', {
            volume: remoteAudioRef.current.volume,
            muted: remoteAudioRef.current.muted,
            paused: remoteAudioRef.current.paused
          });
        })
        .catch(err => {
          console.error('[CallScreen] ❌ Audio play error:', err);
        });
    } else {
      console.log('[CallScreen] 🔊 Audio attach conditions:', {
        hasRemoteStream: !!remoteStream,
        hasAudioRef: !!remoteAudioRef.current,
        isVoiceCall: !isVideoCall
      });
    }
  }, [remoteStream, isVideoCall]);

  // ============================================
  // ATTACH LOCAL STREAM TO VIDEO ELEMENT
  // ============================================
  useEffect(() => {
    if (localStream && localVideoRef.current && isVideoCall) {
      console.log('[CallScreen] Attaching local stream to video element');
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoCall]);

  // ============================================
  // ATTACH REMOTE STREAM TO VIDEO ELEMENT
  // ============================================
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current && isVideoCall) {
      console.log('[CallScreen] Attaching remote stream to video element');
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
      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 animate-fadeIn">
        
        {/* ✅ HIDDEN AUDIO ELEMENT - CRITICAL FOR VOICE CALL */}
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          className="hidden"
        />

        {/* Status Bar */}
        <div className="py-4 px-6 text-center">
          <p className="text-white/80 text-sm">
            {isConnecting ? 'Connecting...' : 'Voice Call'}
          </p>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          
          {/* Avatar with Glow */}
          <div className="relative mb-8">
            <div className="absolute inset-0 -m-8 rounded-full bg-white/20 blur-3xl animate-pulse"></div>
            <div className="relative ring-8 ring-white/30 rounded-full">
              <AvatarImage
                avatar={peerInfo.avatar}
                nickname={peerInfo.username}
                size="3xl"
                showOnlineStatus={false}
              />
            </div>
          </div>

          {/* Name */}
          <h2 className="text-4xl font-bold text-white mb-3">
            {peerInfo.username}
          </h2>

          {/* Duration / Status */}
          <div className="text-2xl text-white/80 mb-12">
            {isConnecting ? (
              <span className="animate-pulse">Connecting...</span>
            ) : (
              <span className="font-mono">{formatDuration(duration)}</span>
            )}
          </div>

          {/* Audio Waveform Animation (optional) */}
          {!isConnecting && (
            <div className="flex items-center gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-white/60 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 40 + 20}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <CallControls onEndCall={onEndCall} />
      </div>
    );
  }

  // ============================================
  // VIDEO CALL UI
  // ============================================
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black animate-fadeIn">
      
      {/* Remote Video (Fullscreen) */}
      <div className="flex-1 relative">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* Fallback: Avatar while connecting */
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center">
              <AvatarImage
                avatar={peerInfo.avatar}
                nickname={peerInfo.username}
                size="3xl"
                showOnlineStatus={false}
              />
              <p className="text-white text-xl font-semibold mt-6">
                {peerInfo.username}
              </p>
              <p className="text-white/60 mt-2 animate-pulse">
                {isConnecting ? 'Connecting...' : 'Waiting for video...'}
              </p>
            </div>
          </div>
        )}

        {/* Top Overlay: Name + Duration */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg">
                {peerInfo.username}
              </h3>
              <p className="text-white/80 text-sm">
                {isConnecting ? 'Connecting...' : formatDuration(duration)}
              </p>
            </div>
          </div>
        </div>

        {/* Local Video (Picture-in-Picture) */}
        {localStream && !isVideoOff && (
          <div className="absolute bottom-24 right-4 w-32 h-40 rounded-xl overflow-hidden shadow-2xl border-2 border-white/30">
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
          <div className="absolute bottom-24 right-4 w-32 h-40 rounded-xl overflow-hidden shadow-2xl border-2 border-white/30 bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-white/60 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
              <p className="text-white/60 text-xs">Camera Off</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-t from-black/80 to-transparent">
        <CallControls onEndCall={onEndCall} />
      </div>

      {/* CSS for mirror effect on local video */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
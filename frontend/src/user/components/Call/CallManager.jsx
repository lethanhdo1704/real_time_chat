// frontend/src/user/components/call/CallManager.jsx

import { useEffect, memo } from 'react';
import useCall from '../../hooks/call/useCall';
import useCallStore from '../../store/call/callStore';
import IncomingCallModal from './IncomingCallModal';
import OutgoingCallModal from './OutgoingCallModal';
import CallScreen from './CallScreen';
import { CALL_STATE } from '../../utils/call/callConstants';

// ✅ DEBUG: Verify imports (only runs once)
console.log('[CallManager] CALL_STATE constants:', CALL_STATE);
console.log('[CallManager] Components loaded:', {
  IncomingCallModal: typeof IncomingCallModal,
  OutgoingCallModal: typeof OutgoingCallModal,
  CallScreen: typeof CallScreen
});

/**
 * 🎯 CALL MANAGER - OPTIMIZED VERSION
 * 
 * ✅ Wrapped in React.memo to prevent unnecessary re-renders
 * ✅ Only subscribes to render-critical state (callState, error)
 * ✅ Socket connection handled internally in useCall hook
 * 
 * Orchestrates all call UI components:
 * - IncomingCallModal (INCOMING_RINGING)
 * - OutgoingCallModal (OUTGOING_RINGING)
 * - CallScreen (CONNECTING, IN_CALL)
 * 
 * ⚠️ PHẢI mount ở App level hoặc Home level
 * ⚠️ Socket PHẢI đã connected trước khi mount
 */
const CallManager = () => {
  // ============================================
  // ✅ OPTIMIZED: Only subscribe render state
  // ============================================
  
  // Mount useCall hook (handles all socket events internally)
  // ⚠️ We don't need socket/isConnected in component
  const { handleEndCall } = useCall();

  // ✅ Only subscribe to data needed for rendering
  const callState = useCallStore((state) => state.callState);
  const error = useCallStore((state) => state.error);
  
  // ✅ DEBUG: Log state changes (reduced frequency)
  console.log('[CallManager] 🎬 Render:', { callState, error });

  // ============================================
  // ✅ ERROR TOAST - MOVED BEFORE ANY RETURNS
  // ============================================
  useEffect(() => {
    if (error) {
      console.error('[CallManager] Call error:', error);
      
      // TODO: Show toast notification
      // toast.error(error);
      
      // Auto dismiss error after 3s
      const timer = setTimeout(() => {
        useCallStore.getState().resetCall();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  // ============================================
  // ✅ EARLY RETURN - Idle state
  // ============================================
  
  if (callState === CALL_STATE.IDLE) {
    // No UI to show when idle
    return null;
  }

  // ============================================
  // RENDER CALL UI BASED ON STATE
  // ============================================
  
  // ✅ DEBUG: Log conditions
  console.log('[CallManager] 🔍 Render checks:', {
    isIncoming: callState === CALL_STATE.INCOMING_RINGING,
    isOutgoing: callState === CALL_STATE.OUTGOING_RINGING,
    isConnecting: callState === CALL_STATE.CONNECTING,
    isInCall: callState === CALL_STATE.IN_CALL,
    isError: callState === CALL_STATE.ERROR
  });
  
  return (
    <>
      {/* Incoming Call Modal */}
      {callState === CALL_STATE.INCOMING_RINGING && (
        <>
          {console.log('[CallManager] ✅ Rendering IncomingCallModal')}
          <IncomingCallModal />
        </>
      )}

      {/* Outgoing Call Modal */}
      {callState === CALL_STATE.OUTGOING_RINGING && (
        <>
          {console.log('[CallManager] ✅ Rendering OutgoingCallModal')}
          <OutgoingCallModal />
        </>
      )}

      {/* Call Screen (Connecting or In Call) */}
      {(callState === CALL_STATE.CONNECTING || callState === CALL_STATE.IN_CALL) && (
        <CallScreen onEndCall={handleEndCall} />
      )}

      {/* Error State (optional overlay) */}
      {callState === CALL_STATE.ERROR && error && (
        <div className="fixed bottom-4 right-4 z-50 animate-slideUp">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Call Failed</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================
// ✅ EXPORT WITH MEMO - Prevent unnecessary re-renders
// ============================================
export default memo(CallManager);
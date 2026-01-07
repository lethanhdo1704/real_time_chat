// backend/socket/call.socket.js
import CallService from '../services/call.service.js';
import Call from '../models/Call.js';

const CALL_TIMEOUT = 30000; // 30 seconds

export default function setupCallSocket(io) {
  const callTimeouts = new Map();
  const userActiveCalls = new Map();

  io.on('connection', (socket) => {
    if (!socket.userId) {
      console.error('⚠️ Socket missing userId');
      return;
    }

    const userId = socket.userId;
    console.log(`📞 Call handler ready for user: ${userId}`);

    // ==================== KHỞI TẠO CUỘC GỌI ====================
    socket.on('call:start', async (data) => {
      try {
        const { calleeId, type } = data;

        console.log(`📞 Call initiated: ${userId} -> ${calleeId} (${type})`);

        const { call, calleeOnline } = await CallService.initiateCall(
          userId,
          calleeId,
          type
        );

        if (!calleeOnline) {
          socket.emit('call:failed', {
            callId: call._id,
            reason: 'offline',
            message: 'User is offline'
          });
          return;
        }

        userActiveCalls.set(userId, call._id.toString());
        userActiveCalls.set(calleeId, call._id.toString());

        socket.emit('call:initiated', {
          callId: call._id,
          call
        });

        io.to(calleeId).emit('call:incoming', {
          callId: call._id,
          caller: call.caller,
          type: call.type
        });

        // Timeout cho missed call
        const timeoutId = setTimeout(async () => {
          try {
            await CallService.markAsMissed(call._id);
            
            userActiveCalls.delete(userId);
            userActiveCalls.delete(calleeId);
            callTimeouts.delete(call._id.toString());
            
            socket.emit('call:missed', { callId: call._id });
            io.to(calleeId).emit('call:missed', { callId: call._id });
            
            console.log(`⏱️ Call timeout: ${call._id}`);
          } catch (error) {
            console.error('Error marking call as missed:', error);
          }
        }, CALL_TIMEOUT);

        callTimeouts.set(call._id.toString(), timeoutId);

      } catch (error) {
        console.error('call:start error:', error);
        socket.emit('call:error', { 
          message: error.message || 'Failed to initiate call' 
        });
      }
    });

    // ==================== CHẤP NHẬN CUỘC GỌI ====================
    socket.on('call:accept', async (data) => {
      try {
        const { callId } = data;

        console.log(`✅ Call accepted: ${callId} by ${userId}`);

        const call = await CallService.acceptCall(callId, userId);

        // Clear timeout
        const timeoutId = callTimeouts.get(callId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          callTimeouts.delete(callId);
        }

        socket.emit('call:accepted', { callId, call });
        io.to(call.caller._id.toString()).emit('call:accepted', { callId, call });

      } catch (error) {
        console.error('call:accept error:', error);
        socket.emit('call:error', { 
          message: error.message || 'Failed to accept call' 
        });
      }
    });

    // ==================== TỪ CHỐI CUỘC GỌI ====================
    socket.on('call:reject', async (data) => {
      try {
        const { callId } = data;

        console.log(`❌ Call rejected: ${callId} by ${userId}`);

        const call = await CallService.rejectCall(callId, userId);

        // Clear timeout
        const timeoutId = callTimeouts.get(callId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          callTimeouts.delete(callId);
        }

        userActiveCalls.delete(call.caller.toString());
        userActiveCalls.delete(call.callee.toString());

        io.to(call.caller.toString()).emit('call:rejected', { callId });

      } catch (error) {
        console.error('call:reject error:', error);
        socket.emit('call:error', { 
          message: error.message || 'Failed to reject call' 
        });
      }
    });

    // ==================== KẾT THÚC CUỘC GỌI ====================
    socket.on('call:end', async (data) => {
      try {
        const { callId } = data;

        console.log(`🔚 Call ended: ${callId} by ${userId}`);

        const call = await CallService.endCall(callId, userId);

        // Clear timeout
        const timeoutId = callTimeouts.get(callId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          callTimeouts.delete(callId);
        }

        userActiveCalls.delete(call.caller.toString());
        userActiveCalls.delete(call.callee.toString());

        const otherUserId = call.caller.toString() === userId 
          ? call.callee.toString() 
          : call.caller.toString();

        socket.emit('call:ended', { callId, duration: call.duration });
        io.to(otherUserId).emit('call:ended', { callId, duration: call.duration });

      } catch (error) {
        console.error('call:end error:', error);
        socket.emit('call:error', { 
          message: error.message || 'Failed to end call' 
        });
      }
    });

    // ==================== WEBRTC SIGNALING ====================
    socket.on('call:offer', (data) => {
      const { callId, to, offer } = data;
      console.log(`📡 Relaying offer for call ${callId}`);
      io.to(to).emit('call:offer', { callId, from: userId, offer });
    });

    socket.on('call:answer', (data) => {
      const { callId, to, answer } = data;
      console.log(`📡 Relaying answer for call ${callId}`);
      io.to(to).emit('call:answer', { callId, from: userId, answer });
    });

    socket.on('call:ice', (data) => {
      const { callId, to, candidate } = data;
      io.to(to).emit('call:ice', { callId, from: userId, candidate });
    });

    // ==================== DISCONNECT HANDLER ====================
    socket.on('disconnect', async () => {
      try {
        const activeCallId = userActiveCalls.get(userId);
        
        if (activeCallId) {
          const call = await Call.findById(activeCallId);
          
          if (call && (call.status === 'ringing' || call.status === 'accepted')) {
            console.log(`⚠️ User ${userId} disconnected during active call ${activeCallId}`);
            
            const endedCall = await CallService.endCall(activeCallId, userId);
            
            // Clear timeout
            const timeoutId = callTimeouts.get(activeCallId);
            if (timeoutId) {
              clearTimeout(timeoutId);
              callTimeouts.delete(activeCallId);
            }

            userActiveCalls.delete(call.caller.toString());
            userActiveCalls.delete(call.callee.toString());
            
            const otherUserId = call.caller.toString() === userId 
              ? call.callee.toString() 
              : call.caller.toString();
            
            io.to(otherUserId).emit('call:ended', { 
              callId: activeCallId, 
              duration: endedCall.duration,
              reason: 'disconnect'
            });
          }
        }
      } catch (error) {
        console.error('Error handling disconnect during call:', error);
      }
    });
  });

  console.log('✅ Call socket handlers registered');
}
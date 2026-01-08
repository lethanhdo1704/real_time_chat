// backend/socket/call.socket.js
import CallService from '../services/call.service.js';
import Call from '../models/Call.js';
import User from '../models/User.js';

const CALL_TIMEOUT = 30000; // 30 seconds

export default function setupCallSocket(io) {
  const callTimeouts = new Map();
  const userActiveCalls = new Map(); // uid → callId

  io.on('connection', (socket) => {
    // ============================================
    // ✅ VALIDATION: Socket PHẢI có uid
    // ============================================
    if (!socket.uid) {
      console.error('⚠️ Socket missing uid');
      return;
    }

    const uid = socket.uid;         // ✅ PUBLIC UID (realtime)
    const userId = socket.userId;   // ✅ MONGO _ID (database)
    
    console.log(`📞 Call handler ready for user: ${uid}`);

    // ==================== KHỞI TẠO CUỘC GỌI ====================
    socket.on('call:start', async (data) => {
      try {
        const { calleeUid, type } = data;

        if (!calleeUid || !type) {
          socket.emit('call:error', { message: 'calleeUid and type are required' });
          return;
        }

        console.log(`📞 Call initiated: ${uid} -> ${calleeUid} (${type})`);

        // ============================================
        // 🔄 MAP: calleeUid → calleeId (MongoDB _id)
        // ============================================
        const callee = await User.findOne({ uid: calleeUid }).select('_id isOnline');
        
        if (!callee) {
          socket.emit('call:error', { message: 'User not found' });
          return;
        }

        // ============================================
        // 📞 INITIATE CALL (service dùng _id)
        // ============================================
        const { call, calleeOnline } = await CallService.initiateCall(
          userId,           // ✅ caller _id
          callee._id,       // ✅ callee _id
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

        // ============================================
        // 💾 TRACK ACTIVE CALLS (dùng UID)
        // ============================================
        userActiveCalls.set(uid, call._id.toString());
        userActiveCalls.set(calleeUid, call._id.toString());

        // ============================================
        // 📤 EMIT TO CALLER
        // ============================================
        socket.emit('call:initiated', {
          callId: call._id,
          call
        });

        // ============================================
        // 📤 EMIT TO CALLEE (dùng UID room)
        // ============================================
        io.to(calleeUid).emit('call:incoming', {
          callId: call._id,
          callerUid: uid,
          caller: call.caller,
          type: call.type
        });

        // ============================================
        // ⏱️ TIMEOUT CHO MISSED CALL
        // ============================================
        const timeoutId = setTimeout(async () => {
          try {
            await CallService.markAsMissed(call._id);
            
            userActiveCalls.delete(uid);
            userActiveCalls.delete(calleeUid);
            callTimeouts.delete(call._id.toString());
            
            socket.emit('call:missed', { callId: call._id });
            io.to(calleeUid).emit('call:missed', { callId: call._id });
            
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

        if (!callId) {
          socket.emit('call:error', { message: 'callId is required' });
          return;
        }

        console.log(`✅ Call accepted: ${callId} by ${uid}`);

        // ============================================
        // 📞 ACCEPT CALL (service dùng _id)
        // ============================================
        const call = await CallService.acceptCall(callId, userId);

        // Clear timeout
        const timeoutId = callTimeouts.get(callId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          callTimeouts.delete(callId);
        }

        // ============================================
        // 🔄 MAP: caller _id → callerUid
        // ============================================
        const caller = await User.findById(call.caller._id).select('uid');

        socket.emit('call:accepted', { callId, call });
        
        // ✅ EMIT TO CALLER (dùng UID room)
        io.to(caller.uid).emit('call:accepted', { callId, call });

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

        if (!callId) {
          socket.emit('call:error', { message: 'callId is required' });
          return;
        }

        console.log(`❌ Call rejected: ${callId} by ${uid}`);

        // ============================================
        // 📞 REJECT CALL (service dùng _id)
        // ============================================
        const call = await CallService.rejectCall(callId, userId);

        // Clear timeout
        const timeoutId = callTimeouts.get(callId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          callTimeouts.delete(callId);
        }

        // ============================================
        // 🔄 MAP: caller _id → callerUid
        // ============================================
        const caller = await User.findById(call.caller).select('uid');
        const callee = await User.findById(call.callee).select('uid');

        userActiveCalls.delete(caller.uid);
        userActiveCalls.delete(callee.uid);

        // ✅ EMIT TO CALLER (dùng UID room)
        io.to(caller.uid).emit('call:rejected', { callId });

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

        if (!callId) {
          socket.emit('call:error', { message: 'callId is required' });
          return;
        }

        console.log(`🔚 Call ended: ${callId} by ${uid}`);

        // ============================================
        // 📞 END CALL (service dùng _id)
        // ============================================
        const call = await CallService.endCall(callId, userId);

        // Clear timeout
        const timeoutId = callTimeouts.get(callId);
        if (timeoutId) {
          clearTimeout(timeoutId);
          callTimeouts.delete(callId);
        }

        // ============================================
        // 🔄 MAP: _id → uid
        // ============================================
        const [caller, callee] = await Promise.all([
          User.findById(call.caller).select('uid'),
          User.findById(call.callee).select('uid')
        ]);

        userActiveCalls.delete(caller.uid);
        userActiveCalls.delete(callee.uid);

        const otherUserUid = caller.uid === uid ? callee.uid : caller.uid;

        socket.emit('call:ended', { callId, duration: call.duration });
        
        // ✅ EMIT TO OTHER USER (dùng UID room)
        io.to(otherUserUid).emit('call:ended', { callId, duration: call.duration });

      } catch (error) {
        console.error('call:end error:', error);
        socket.emit('call:error', { 
          message: error.message || 'Failed to end call' 
        });
      }
    });

    // ==================== WEBRTC SIGNALING (✅ 100% UID) ====================
    
    /**
     * 🎯 WebRTC Offer
     * Frontend: { toUid, offer }
     * Backend:  relay đến room(toUid)
     */
    socket.on('call:offer', (data) => {
      const { toUid, offer } = data;
      
      if (!toUid || !offer) {
        socket.emit('call:error', { message: 'toUid and offer are required' });
        return;
      }
      
      console.log(`📡 Relaying offer: ${uid} -> ${toUid}`);
      
      // ✅ GỬI ĐẾN ROOM UID
      io.to(toUid).emit('call:offer', {
        fromUid: uid,
        offer
      });
    });

    /**
     * 🎯 WebRTC Answer
     * Frontend: { toUid, answer }
     * Backend:  relay đến room(toUid)
     */
    socket.on('call:answer', (data) => {
      const { toUid, answer } = data;
      
      if (!toUid || !answer) {
        socket.emit('call:error', { message: 'toUid and answer are required' });
        return;
      }
      
      console.log(`📡 Relaying answer: ${uid} -> ${toUid}`);
      
      // ✅ GỬI ĐẾN ROOM UID
      io.to(toUid).emit('call:answer', {
        fromUid: uid,
        answer
      });
    });

    /**
     * 🎯 ICE Candidate
     * Frontend: { toUid, candidate }
     * Backend:  relay đến room(toUid)
     */
    socket.on('call:ice', (data) => {
      const { toUid, candidate } = data;
      
      if (!toUid) {
        return; // ICE có thể fail silent
      }
      
      // ✅ GỬI ĐẾN ROOM UID
      io.to(toUid).emit('call:ice', {
        fromUid: uid,
        candidate
      });
    });

    // ==================== DISCONNECT HANDLER ====================
    socket.on('disconnect', async () => {
      try {
        const activeCallId = userActiveCalls.get(uid);
        
        if (activeCallId) {
          const call = await Call.findById(activeCallId);
          
          if (call && (call.status === 'ringing' || call.status === 'accepted')) {
            console.log(`⚠️ User ${uid} disconnected during active call ${activeCallId}`);
            
            const endedCall = await CallService.endCall(activeCallId, userId);
            
            // Clear timeout
            const timeoutId = callTimeouts.get(activeCallId);
            if (timeoutId) {
              clearTimeout(timeoutId);
              callTimeouts.delete(activeCallId);
            }

            // ============================================
            // 🔄 MAP: _id → uid
            // ============================================
            const [caller, callee] = await Promise.all([
              User.findById(call.caller).select('uid'),
              User.findById(call.callee).select('uid')
            ]);

            userActiveCalls.delete(caller.uid);
            userActiveCalls.delete(callee.uid);
            
            const otherUserUid = caller.uid === uid ? callee.uid : caller.uid;
            
            // ✅ EMIT TO OTHER USER (dùng UID room)
            io.to(otherUserUid).emit('call:ended', { 
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

  console.log('✅ Call socket handlers registered (UID-based realtime)');
}
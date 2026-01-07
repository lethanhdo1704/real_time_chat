// backend/services/call.service.js
import Call from '../models/Call.js';
import User from '../models/User.js';

class CallService {
  async initiateCall(callerId, calleeId, type) {
    const [caller, callee] = await Promise.all([
      User.findById(callerId).select('username avatar isOnline'),
      User.findById(calleeId).select('username avatar isOnline')
    ]);

    if (!caller || !callee) {
      throw new Error('User not found');
    }

    if (callerId === calleeId) {
      throw new Error('Cannot call yourself');
    }

    if (!callee.isOnline) {
      const call = await Call.create({
        caller: callerId,
        callee: calleeId,
        type,
        status: 'missed',
        endReason: 'offline',
        endedAt: new Date()
      });
      return { call, calleeOnline: false };
    }

    const ongoingCall = await Call.findOne({
      $or: [
        { caller: callerId, status: { $in: ['ringing', 'accepted'] } },
        { callee: callerId, status: { $in: ['ringing', 'accepted'] } },
        { caller: calleeId, status: { $in: ['ringing', 'accepted'] } },
        { callee: calleeId, status: { $in: ['ringing', 'accepted'] } }
      ]
    });

    if (ongoingCall) {
      throw new Error('User is busy');
    }

    const call = await Call.create({
      caller: callerId,
      callee: calleeId,
      type,
      status: 'ringing'
    });

    return {
      call: await call.populate([
        { path: 'caller', select: 'username avatar' },
        { path: 'callee', select: 'username avatar' }
      ]),
      calleeOnline: true
    };
  }

  async acceptCall(callId, userId) {
    const call = await Call.findById(callId);

    if (!call) {
      throw new Error('Call not found');
    }

    if (call.callee.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    if (call.status !== 'ringing') {
      throw new Error('Call is not ringing');
    }

    call.status = 'accepted';
    call.acceptedAt = new Date();
    await call.save();

    return await call.populate([
      { path: 'caller', select: 'username avatar' },
      { path: 'callee', select: 'username avatar' }
    ]);
  }

  async rejectCall(callId, userId) {
    const call = await Call.findById(callId);

    if (!call) {
      throw new Error('Call not found');
    }

    if (call.callee.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    if (call.status !== 'ringing') {
      throw new Error('Call is not ringing');
    }

    call.status = 'rejected';
    call.endReason = 'reject';
    call.endedAt = new Date();
    await call.save();

    return call;
  }

  async endCall(callId, userId) {
    const call = await Call.findById(callId);

    if (!call) {
      throw new Error('Call not found');
    }

    if (call.caller.toString() !== userId && call.callee.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    if (call.status === 'ended' || call.status === 'rejected' || call.status === 'missed') {
      throw new Error('Call already ended');
    }

    call.status = 'ended';
    call.endReason = 'hangup';
    call.endedAt = new Date();

    if (call.acceptedAt) {
      call.duration = Math.floor((call.endedAt - call.acceptedAt) / 1000);
    }

    await call.save();
    return call;
  }

  async markAsMissed(callId) {
    const call = await Call.findById(callId);

    if (!call) {
      throw new Error('Call not found');
    }

    if (call.status !== 'ringing') {
      return call;
    }

    call.status = 'missed';
    call.endReason = 'timeout';
    call.endedAt = new Date();
    await call.save();

    return call;
  }

  async getCallHistory(userId, limit = 50, skip = 0) {
    const calls = await Call.find({
      $or: [
        { caller: userId },
        { callee: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('caller', 'username avatar')
      .populate('callee', 'username avatar')
      .lean();

    return calls.map(call => {
      const isOutgoing = call.caller._id.toString() === userId;
      const otherUser = isOutgoing ? call.callee : call.caller;

      return {
        _id: call._id,
        type: call.type,
        status: call.status,
        direction: isOutgoing ? 'outgoing' : 'incoming',
        with: otherUser,
        duration: call.duration,
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        endReason: call.endReason
      };
    });
  }
}

export default new CallService();
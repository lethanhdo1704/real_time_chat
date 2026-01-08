// backend/controller/call.controller.js
import CallService from '../services/call.service.js';

export const getCallHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const calls = await CallService.getCallHistory(userId, limit, skip);

    res.json({
      success: true,
      data: calls,
      pagination: {
        limit,
        skip,
        hasMore: calls.length === limit
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCallDetails = async (req, res, next) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const call = await Call.findById(callId)
      .populate('caller', 'username avatar')
      .populate('callee', 'username avatar');

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Verify user is participant
    if (call.caller._id.toString() !== userId && call.callee._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    res.json({
      success: true,
      data: call
    });
  } catch (error) {
    next(error);
  }
};
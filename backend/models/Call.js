// backend/models/Call.js
import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  callee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  type: {
    type: String,
    enum: ['voice', 'video'],
    required: true
  },

  status: {
    type: String,
    enum: ['ringing', 'accepted', 'rejected', 'ended', 'missed'],
    default: 'ringing',
    index: true
  },

  startedAt: {
    type: Date,
    default: Date.now
  },

  acceptedAt: Date,
  endedAt: Date,

  duration: {
    type: Number, // seconds
    default: 0
  },

  endReason: {
    type: String,
    enum: ['hangup', 'reject', 'missed', 'timeout', 'error', 'busy', 'offline'] // ✅ Added 'offline'
  }
}, {
  timestamps: true
});

// Compound index for call history queries
callSchema.index({ caller: 1, createdAt: -1 });
callSchema.index({ callee: 1, createdAt: -1 });

// Virtual for participants (both caller and callee)
callSchema.virtual('participants').get(function() {
  return [this.caller, this.callee];
});

export default mongoose.model('Call', callSchema);
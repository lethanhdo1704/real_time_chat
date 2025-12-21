// ===== models/ConversationMember.js =====
import mongoose from "mongoose";

const { Schema } = mongoose;
const conversationMemberSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  role: {
    type: String,
    enum: ['owner', 'admin', 'member'],
    default: 'member'
  },
  
  lastSeenMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastSeenAt: {
    type: Date,
    default: null
  },
  
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

conversationMemberSchema.index({ conversation: 1, user: 1 }, { unique: true });
conversationMemberSchema.index({ user: 1, leftAt: 1 });
conversationMemberSchema.index({ conversation: 1, leftAt: 1 });

conversationMemberSchema.statics.isActiveMember = async function(conversationId, userId) {
  const member = await this.findOne({
    conversation: conversationId,
    user: userId,
    leftAt: null
  });
  return !!member;
};

conversationMemberSchema.statics.getActiveMembers = async function(conversationId) {
  return this.find({
    conversation: conversationId,
    leftAt: null
  }).populate('user', 'uid nickname avatar');
};

export default mongoose.model('ConversationMember', conversationMemberSchema);
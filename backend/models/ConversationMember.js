// backend/models/ConversationMember.js
import mongoose from "mongoose";

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
  
  // 🔥 CORE: Unread tracking
  unreadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Track last seen message
  lastSeenMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastSeenAt: {
    type: Date,
    default: null
  },
  
  // Membership lifecycle
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

// Indexes
conversationMemberSchema.index({ conversation: 1, user: 1 }, { unique: true });
conversationMemberSchema.index({ user: 1, leftAt: 1 }); // For user's conversations
conversationMemberSchema.index({ conversation: 1, leftAt: 1 }); // For active members

// Check if user is active member
conversationMemberSchema.statics.isActiveMember = async function(conversationId, userId) {
  const member = await this.findOne({
    conversation: conversationId,
    user: userId,
    leftAt: null
  });
  return !!member;
};

// Get all active members
conversationMemberSchema.statics.getActiveMembers = async function(conversationId) {
  return this.find({
    conversation: conversationId,
    leftAt: null
  }).populate('user', 'uid nickname avatar');
};

// 🔥 Increment unread for members (except sender)
conversationMemberSchema.statics.incrementUnreadExcept = async function(conversationId, senderId) {
  return this.updateMany(
    {
      conversation: conversationId,
      user: { $ne: senderId },
      leftAt: null
    },
    {
      $inc: { unreadCount: 1 }
    }
  );
};

// 🔥 Mark as read (reset unread to 0)
conversationMemberSchema.statics.markAsRead = async function(conversationId, userId, lastMessageId) {
  return this.findOneAndUpdate(
    {
      conversation: conversationId,
      user: userId,
      leftAt: null
    },
    {
      unreadCount: 0,
      lastSeenMessage: lastMessageId,
      lastSeenAt: new Date()
    },
    { new: true }
  );
};

export default mongoose.model('ConversationMember', conversationMemberSchema);
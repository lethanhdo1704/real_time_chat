// backend/models/ConversationMember.js - FIXED VERSION
// 🔧 FIX: Prevent "Cannot overwrite model" error in ES modules

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
  
  // Membership lifecycle (SOFT DELETE SUPPORT)
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date,
    default: null,
  },
  
  // 🔥 KICK TRACKING
  kickedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  kickedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true
});

// ==================== 🔥 OPTIMIZED INDEXES ====================

// 🎯 INDEX 1: CRITICAL - Prevent duplicates & ultra-fast lookup
conversationMemberSchema.index({ conversation: 1, user: 1 }, { unique: true });

// 🎯 INDEX 2: Query active members by conversation
conversationMemberSchema.index({ conversation: 1, leftAt: 1 });

// 🎯 INDEX 3: Query user's active conversations
conversationMemberSchema.index({ user: 1, leftAt: 1 });

// 🎯 INDEX 4: Optimize null checks on leftAt
conversationMemberSchema.index({ leftAt: 1 });

// 🎯 INDEX 5: Query kicked members with details
conversationMemberSchema.index({ conversation: 1, kickedBy: 1, kickedAt: 1 });

// ==================== STATIC METHODS ====================

conversationMemberSchema.statics.isActiveMember = async function(conversationId, userId) {
  const member = await this.findOne({
    conversation: conversationId,
    user: userId,
    leftAt: null
  }).lean();
  
  return !!member;
};

conversationMemberSchema.statics.wasKicked = async function(conversationId, userId) {
  const member = await this.findOne({
    conversation: conversationId,
    user: userId,
    leftAt: { $ne: null },
    kickedBy: { $ne: null },
    kickedAt: { $ne: null }
  }).lean();
  
  return !!member;
};

conversationMemberSchema.statics.getKickInfo = async function(conversationId, userId) {
  const member = await this.findOne({
    conversation: conversationId,
    user: userId,
    kickedBy: { $ne: null }
  })
  .populate('kickedBy', 'uid nickname avatar')
  .select('kickedBy kickedAt leftAt')
  .lean();

  if (!member || !member.kickedBy) {
    return null;
  }

  return {
    kickedBy: member.kickedBy,
    kickedAt: member.kickedAt,
    leftAt: member.leftAt
  };
};

conversationMemberSchema.statics.getActiveMembers = async function(conversationId) {
  return this.find({
    conversation: conversationId,
    leftAt: null
  })
  .populate('user', 'uid nickname avatar')
  .lean();
};

conversationMemberSchema.statics.countActiveMembers = async function(conversationId) {
  return this.countDocuments({
    conversation: conversationId,
    leftAt: null
  });
};

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

conversationMemberSchema.statics.rejoinMember = async function(
  conversationId, 
  userId, 
  newRole = 'member',
  allowKickedRejoin = false
) {
  const member = await this.findOne({
    conversation: conversationId,
    user: userId
  });

  if (member) {
    if (member.kickedBy && !allowKickedRejoin) {
      const error = new Error('USER_WAS_KICKED');
      error.kickedBy = member.kickedBy;
      error.kickedAt = member.kickedAt;
      throw error;
    }

    member.leftAt = null;
    member.role = newRole;
    member.joinedAt = new Date();
    member.unreadCount = 0;
    member.kickedBy = null;
    member.kickedAt = null;
    await member.save();
    return member;
  } else {
    return this.create({
      conversation: conversationId,
      user: userId,
      role: newRole,
      joinedAt: new Date()
    });
  }
};

conversationMemberSchema.statics.softDeleteMember = async function(
  conversationId, 
  userId, 
  kickedBy = null
) {
  const now = new Date();
  
  return this.findOneAndUpdate(
    {
      conversation: conversationId,
      user: userId,
      leftAt: null
    },
    {
      leftAt: now,
      kickedBy: kickedBy,
      kickedAt: kickedBy ? now : null
    },
    { new: true }
  );
};

conversationMemberSchema.statics.clearKickStatus = async function(conversationId, userId) {
  return this.findOneAndUpdate(
    {
      conversation: conversationId,
      user: userId,
      kickedBy: { $ne: null }
    },
    {
      kickedBy: null,
      kickedAt: null
    },
    { new: true }
  );
};

conversationMemberSchema.statics.getKickedMembers = async function(conversationId, limit = 50) {
  return this.find({
    conversation: conversationId,
    kickedBy: { $ne: null }
  })
  .populate('user', 'uid nickname avatar')
  .populate('kickedBy', 'uid nickname avatar')
  .select('user kickedBy kickedAt leftAt')
  .sort({ kickedAt: -1 })
  .limit(limit)
  .lean();
};

// ==================== INSTANCE METHODS ====================

conversationMemberSchema.methods.isActive = function() {
  return this.leftAt === null;
};

conversationMemberSchema.methods.wasKicked = function() {
  return this.kickedBy !== null && this.kickedAt !== null;
};

conversationMemberSchema.methods.hasRole = function(...roles) {
  return roles.includes(this.role);
};

conversationMemberSchema.methods.getKickInfo = function() {
  if (!this.wasKicked()) {
    return null;
  }

  return {
    kickedBy: this.kickedBy,
    kickedAt: this.kickedAt,
    durationSinceKick: this.kickedAt ? Date.now() - this.kickedAt.getTime() : null
  };
};

// ==================== 🔧 FIX: Prevent model overwrite error ====================
// This is the critical fix for ES modules with hot reload

let ConversationMember;

try {
  // Try to get existing model
  ConversationMember = mongoose.model('ConversationMember');
} catch (error) {
  // Model doesn't exist yet, create it
  ConversationMember = mongoose.model('ConversationMember', conversationMemberSchema);
}

export default ConversationMember;
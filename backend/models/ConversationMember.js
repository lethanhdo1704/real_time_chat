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
  
  // Membership lifecycle (SOFT DELETE SUPPORT)
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date,
    default: null,
    // 🔥 null = active member, Date = left/kicked
  },
  
  // 🔥 KICK TRACKING
  kickedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    // 🔥 null = voluntarily left, ObjectId = was kicked by someone
  },
  kickedAt: {
    type: Date,
    default: null,
    // 🔥 NEW: Timestamp when user was kicked (null if not kicked)
  }
}, {
  timestamps: true
});

// ==================== INDEXES ====================
// 🔥 PRIMARY: Prevent duplicate memberships
conversationMemberSchema.index({ conversation: 1, user: 1 }, { unique: true });

// 🔥 PERFORMANCE: Query active members by conversation
conversationMemberSchema.index({ conversation: 1, leftAt: 1 });

// 🔥 PERFORMANCE: Query user's active conversations
conversationMemberSchema.index({ user: 1, leftAt: 1 });

// 🔥 PERFORMANCE: Optimize leftAt queries (null checks)
conversationMemberSchema.index({ leftAt: 1 });

// 🔥 NEW: Query kicked members with timestamp
conversationMemberSchema.index({ conversation: 1, kickedBy: 1, kickedAt: 1 });

// ==================== STATIC METHODS ====================

/**
 * Check if user is active member (leftAt = null)
 */
conversationMemberSchema.statics.isActiveMember = async function(conversationId, userId) {
  const member = await this.findOne({
    conversation: conversationId,
    user: userId,
    leftAt: null
  });
  return !!member;
};

/**
 * 🔥 UPDATED: Check if user was kicked (not just left)
 */
conversationMemberSchema.statics.wasKicked = async function(conversationId, userId) {
  const member = await this.findOne({
    conversation: conversationId,
    user: userId,
    leftAt: { $ne: null },
    kickedBy: { $ne: null },
    kickedAt: { $ne: null }  // ✅ Triple check for safety
  });
  return !!member;
};

/**
 * 🔥 NEW: Get kick info (who kicked, when)
 */
conversationMemberSchema.statics.getKickInfo = async function(conversationId, userId) {
  const member = await this.findOne({
    conversation: conversationId,
    user: userId,
    kickedBy: { $ne: null }
  })
  .populate('kickedBy', 'uid nickname avatar')
  .select('kickedBy kickedAt leftAt');

  if (!member || !member.kickedBy) {
    return null;
  }

  return {
    kickedBy: member.kickedBy,
    kickedAt: member.kickedAt,
    leftAt: member.leftAt
  };
};

/**
 * Get all active members of a conversation
 */
conversationMemberSchema.statics.getActiveMembers = async function(conversationId) {
  return this.find({
    conversation: conversationId,
    leftAt: null
  }).populate('user', 'uid nickname avatar');
};

/**
 * Count active members
 */
conversationMemberSchema.statics.countActiveMembers = async function(conversationId) {
  return this.countDocuments({
    conversation: conversationId,
    leftAt: null
  });
};

/**
 * 🔥 Increment unread for all members except sender
 * Used when new message arrives
 */
conversationMemberSchema.statics.incrementUnreadExcept = async function(conversationId, senderId) {
  return this.updateMany(
    {
      conversation: conversationId,
      user: { $ne: senderId },
      leftAt: null  // ✅ Only active members
    },
    {
      $inc: { unreadCount: 1 }
    }
  );
};

/**
 * 🔥 Mark conversation as read for user
 * Reset unread count and update last seen
 */
conversationMemberSchema.statics.markAsRead = async function(conversationId, userId, lastMessageId) {
  return this.findOneAndUpdate(
    {
      conversation: conversationId,
      user: userId,
      leftAt: null  // ✅ Only if still active member
    },
    {
      unreadCount: 0,
      lastSeenMessage: lastMessageId,
      lastSeenAt: new Date()
    },
    { new: true }
  );
};

/**
 * 🔥 UPDATED: Rejoin member (with kick check)
 * Used when kicked/left user rejoins
 * 
 * @param {ObjectId} conversationId
 * @param {ObjectId} userId
 * @param {String} newRole
 * @param {Boolean} allowKickedRejoin - Allow kicked users to rejoin (default: false)
 * @throws {Error} 'USER_WAS_KICKED' if user was kicked and allowKickedRejoin is false
 */
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
    // 🔥 CRITICAL: Check if user was kicked
    if (member.kickedBy && !allowKickedRejoin) {
      const error = new Error('USER_WAS_KICKED');
      error.kickedBy = member.kickedBy;
      error.kickedAt = member.kickedAt;
      throw error;
    }

    // Rejoin existing member
    member.leftAt = null;
    member.role = newRole;
    member.joinedAt = new Date();
    member.unreadCount = 0;
    member.kickedBy = null;      // ✅ Clear kick status
    member.kickedAt = null;      // ✅ Clear kick timestamp
    await member.save();
    return member;
  } else {
    // Create new member
    return this.create({
      conversation: conversationId,
      user: userId,
      role: newRole,
      joinedAt: new Date()
    });
  }
};

/**
 * 🔥 UPDATED: Soft delete member (set leftAt)
 * Used for kick/leave
 * 
 * @param {ObjectId} conversationId
 * @param {ObjectId} userId
 * @param {ObjectId} kickedBy - If provided, user was kicked (not voluntarily left)
 */
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
      kickedBy: kickedBy,               // 🔥 Track who kicked (null if voluntary leave)
      kickedAt: kickedBy ? now : null   // 🔥 Set timestamp only if kicked
    },
    { new: true }
  );
};

/**
 * 🔥 UPDATED: Clear kick status (allow kicked user to rejoin)
 * Used by admins to unban kicked users
 */
conversationMemberSchema.statics.clearKickStatus = async function(conversationId, userId) {
  return this.findOneAndUpdate(
    {
      conversation: conversationId,
      user: userId,
      kickedBy: { $ne: null }
    },
    {
      kickedBy: null,
      kickedAt: null  // ✅ Also clear timestamp
    },
    { new: true }
  );
};

/**
 * 🔥 NEW: Get all kicked members (for admin view)
 */
conversationMemberSchema.statics.getKickedMembers = async function(conversationId, limit = 50) {
  return this.find({
    conversation: conversationId,
    kickedBy: { $ne: null }
  })
  .populate('user', 'uid nickname avatar')
  .populate('kickedBy', 'uid nickname avatar')
  .select('user kickedBy kickedAt leftAt')
  .sort({ kickedAt: -1 })
  .limit(limit);
};

// ==================== INSTANCE METHODS ====================

/**
 * Check if this member is active
 */
conversationMemberSchema.methods.isActive = function() {
  return this.leftAt === null;
};

/**
 * 🔥 UPDATED: Check if this member was kicked
 */
conversationMemberSchema.methods.wasKicked = function() {
  return this.kickedBy !== null && this.kickedAt !== null;
};

/**
 * Check if this member has specific role
 */
conversationMemberSchema.methods.hasRole = function(...roles) {
  return roles.includes(this.role);
};

/**
 * 🔥 NEW: Get formatted kick info
 */
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

export default mongoose.model('ConversationMember', conversationMemberSchema);
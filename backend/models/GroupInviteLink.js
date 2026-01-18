// backend/models/GroupInviteLink.js - SIMPLE: DELETE OLD LINKS
import mongoose from "mongoose";
import { nanoid } from "nanoid";

const { Schema } = mongoose;

const groupInviteLinkSchema = new Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
    index: true,
  },
  
  code: {
    type: String,
    unique: true,
    default: () => nanoid(10),
    index: true,
  },
  
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  creatorRole: {
    type: String,
    enum: ["owner", "admin", "member"],
    required: true,
  },
  
  expiresAt: {
    type: Date,
    default: null,
  },
  
  maxUses: {
    type: Number,
    default: null,
  },
  
  usedCount: {
    type: Number,
    default: 0,
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ========================================
// INDEXES
// ========================================

groupInviteLinkSchema.index({ conversation: 1, isActive: 1 });
groupInviteLinkSchema.index({ code: 1, isActive: 1 });

// 🛡️ ONE ACTIVE LINK PER USER PER GROUP
groupInviteLinkSchema.index(
  { conversation: 1, createdBy: 1, isActive: 1 },
  { 
    unique: true,
    partialFilterExpression: { isActive: true },
    name: 'one_active_link_per_user_per_group'
  }
);

// ========================================
// STATIC METHODS
// ========================================

groupInviteLinkSchema.statics.validateLink = async function(code) {
  const link = await this.findOne({
    code,
    isActive: true,
  }).populate("conversation", "name avatar type");
  
  if (!link) {
    throw new Error("LINK_NOT_FOUND");
  }
  
  if (link.expiresAt && link.expiresAt < new Date()) {
    throw new Error("LINK_EXPIRED");
  }
  
  if (link.maxUses && link.usedCount >= link.maxUses) {
    throw new Error("LINK_MAX_USES_REACHED");
  }
  
  return link;
};

groupInviteLinkSchema.statics.incrementUseCount = async function(linkId) {
  return this.findByIdAndUpdate(
    linkId,
    { $inc: { usedCount: 1 } },
    { new: true }
  );
};

groupInviteLinkSchema.statics.getUserActiveLink = async function(conversationId, userId) {
  return this.findOne({
    conversation: conversationId,
    createdBy: userId,
    isActive: true,
  });
};

/**
 * 🔥 XÓA link cũ thay vì deactivate
 * Đơn giản, hiệu quả, không spam database
 */
groupInviteLinkSchema.statics.createLink = async function(data) {
  // Xóa tất cả link cũ của user này trong group này
  await this.deleteMany({
    conversation: data.conversation,
    createdBy: data.createdBy,
  });
  
  // Tạo link mới
  const link = await this.create(data);
  
  return link.populate('createdBy', 'uid nickname avatar');
};

export default mongoose.model("GroupInviteLink", groupInviteLinkSchema);
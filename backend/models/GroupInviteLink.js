// backend/models/GroupInviteLink.js
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
  
  // Role của người tạo link (quyết định auto-join hay không)
  creatorRole: {
    type: String,
    enum: ["owner", "admin", "member"],
    required: true,
  },
  
  expiresAt: {
    type: Date,
    default: null, // null = không bao giờ hết hạn
  },
  
  maxUses: {
    type: Number,
    default: null, // null = không giới hạn
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

// Indexes
groupInviteLinkSchema.index({ conversation: 1, isActive: 1 });
groupInviteLinkSchema.index({ code: 1, isActive: 1 });

// Static method: Check if link is valid
groupInviteLinkSchema.statics.validateLink = async function(code) {
  const link = await this.findOne({
    code,
    isActive: true,
  }).populate("conversation", "name avatar type");
  
  if (!link) {
    throw new Error("LINK_NOT_FOUND");
  }
  
  // Check expiry
  if (link.expiresAt && link.expiresAt < new Date()) {
    throw new Error("LINK_EXPIRED");
  }
  
  // Check max uses
  if (link.maxUses && link.usedCount >= link.maxUses) {
    throw new Error("LINK_MAX_USES_REACHED");
  }
  
  return link;
};

// Static method: Increment use count
groupInviteLinkSchema.statics.incrementUseCount = async function(linkId) {
  return this.findByIdAndUpdate(
    linkId,
    { $inc: { usedCount: 1 } },
    { new: true }
  );
};

export default mongoose.model("GroupInviteLink", groupInviteLinkSchema);
// backend/models/Conversation.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
      index: true,
    },

    // ===== Group only =====
    name: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // ===== Private chat only =====
    friendshipId: {
      type: Schema.Types.ObjectId,
      ref: "Friend",
      unique: true,
      sparse: true,
    },

    // ===== Group settings =====
    joinMode: {
      type: String,
      enum: ["approval", "link"],
      default: "approval",
    },

    messagePermission: {
      type: String,
      enum: ["all", "admins_only"],
      default: "all",
    },

    // ===== Status (system-level) =====
    status: {
      type: String,
      enum: ["active", "banned", "deleted"],
      default: "active",
      index: true,
    },

    banStartAt: {
      type: Date,
      default: null,
    },

    banEndAt: {
      type: Date,
      default: null, // ban tạm
    },

    bannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // system admin
      default: null,
    },

    // ===== Last message =====
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },

    lastMessageAt: {
      type: Date,
      index: true,
    },

    // ===== Statistics (optional nhưng rất mạnh) =====
    totalMessages: { type: Number, default: 0 },
    sharedImages: { type: Number, default: 0 },
    sharedVideos: { type: Number, default: 0 },
    sharedAudios: { type: Number, default: 0 },
    sharedFiles: { type: Number, default: 0 },
    sharedLinks: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// ===== Indexes =====
conversationSchema.index({ type: 1, status: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model("Conversation", conversationSchema);

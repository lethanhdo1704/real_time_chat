// backend/models/Conversation.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["private", "group"],
      required: true,
    },

    // Group only
    name: String,
    avatar: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Private chat
    friendshipId: {
      type: Schema.Types.ObjectId,
      ref: "Friend",
      unique: true,
      sparse: true,
    },

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: Date,

    // 🔥 Counters for Conversation Info
    totalMessages: { type: Number, default: 0 },
    sharedImages: { type: Number, default: 0 },
    sharedVideos: { type: Number, default: 0 },
    sharedAudios: { type: Number, default: 0 },
    sharedFiles: { type: Number, default: 0 },
    sharedLinks: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for performance
conversationSchema.index({ type: 1 });
conversationSchema.index({ lastMessageAt: -1 }); // sidebar sorting

export default mongoose.model("Conversation", conversationSchema);

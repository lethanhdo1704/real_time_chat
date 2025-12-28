// backend/models/Message.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 CRITICAL: Client-generated ID for optimistic UI
    clientMessageId: {
      type: String,
      default: null,
    },

    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },

    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    attachments: [
      {
        url: String,
        name: String,
        size: Number,
        type: String,
      },
    ],

    // Soft delete
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Edit tracking
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        // Add messageId virtual for frontend
        ret.messageId = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================
// INDEXES
// ============================================

// Main query: Get messages by conversation (pagination)
messageSchema.index({ conversation: 1, _id: -1 });

// Filter deleted messages
messageSchema.index({ conversation: 1, deletedAt: 1 });

// User activity
messageSchema.index({ sender: 1, createdAt: -1 });

// 🔥 Client message ID lookup (for optimistic UI confirmation)
messageSchema.index({ clientMessageId: 1 }, { sparse: true });

// Alternative: If using createdAt for pagination
messageSchema.index({ conversation: 1, createdAt: -1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

messageSchema.virtual("messageId").get(function () {
  return this._id;
});

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get conversation messages with pagination
 */
messageSchema.statics.getConversationMessages = async function (
  conversationId,
  before = null,
  limit = 50
) {
  const query = {
    conversation: conversationId,
    deletedAt: null,
  };

  if (before && mongoose.Types.ObjectId.isValid(before)) {
    query._id = { $lt: new mongoose.Types.ObjectId(before) };
  }

  return this.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .populate("sender", "uid nickname avatar")
    .populate({
      path: "replyTo",
      select: "content sender createdAt",
      populate: {
        path: "sender",
        select: "uid nickname avatar",
      },
    })
    .lean();
};

/**
 * Find message by clientMessageId
 */
messageSchema.statics.findByClientId = async function (clientMessageId) {
  return this.findOne({ clientMessageId }).lean();
};

/**
 * Check if clientMessageId already exists (prevent duplicates)
 */
messageSchema.statics.clientIdExists = async function (clientMessageId) {
  const count = await this.countDocuments({ clientMessageId });
  return count > 0;
};

export default mongoose.model("Message", messageSchema);
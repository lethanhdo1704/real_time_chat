// backend/models/Message.js - FIXED VERSION
// 🔧 FIX: Prevent "Cannot overwrite model" error in ES modules

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

    clientMessageId: {
      type: String,
      default: null,
    },

    content: {
      type: String,
      default: "",
      maxlength: 5000,
    },

    type: {
      type: String,
      enum: ["text", "media", "system", "link"],
      default: "text",
    },

    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        mime: {
          type: String,
          required: true,
        },
        mediaType: {
          type: String,
          enum: ["image", "video", "audio", "file", "link"],
          required: true,
        },
      },
    ],

    reactions: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isRecalled: {
      type: Boolean,
      default: false,
    },
    recalledAt: {
      type: Date,
      default: null,
    },

    hiddenFor: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],

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
        ret.messageId = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================
// 🔥 OPTIMIZED INDEXES
// ============================================

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ clientMessageId: 1 }, { sparse: true });
messageSchema.index({ 
  conversation: 1, 
  "attachments.mediaType": 1, 
  createdAt: -1 
});
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, sender: 1, createdAt: -1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

messageSchema.virtual("messageId").get(function () {
  return this._id;
});

// ============================================
// INSTANCE METHODS
// ============================================

messageSchema.methods.isHiddenFor = function (userId) {
  return this.hiddenFor.some((id) => id.toString() === userId.toString());
};

messageSchema.methods.isVisibleFor = function (userId) {
  if (this.deletedAt) return false;
  if (this.isHiddenFor(userId)) return false;
  return true;
};

messageSchema.methods.getState = function () {
  return {
    isDeleted: !!this.deletedAt,
    isRecalled: this.isRecalled,
    recalledAt: this.recalledAt,
  };
};

// ============================================
// STATIC METHODS
// ============================================

messageSchema.statics.getConversationMessages = async function (
  conversationId,
  userId,
  before = null,
  limit = 50
) {
  const query = {
    conversation: conversationId,
    deletedAt: null,
    hiddenFor: { $ne: userId },
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
      select: "content sender createdAt isRecalled recalledAt",
      populate: {
        path: "sender",
        select: "uid nickname avatar",
      },
    })
    .populate({
      path: "reactions.user",
      select: "uid nickname avatar",
    })
    .lean();
};

messageSchema.statics.findByClientId = async function (clientMessageId) {
  return this.findOne({ clientMessageId }).lean();
};

messageSchema.statics.clientIdExists = async function (clientMessageId) {
  const count = await this.countDocuments({ clientMessageId });
  return count > 0;
};

messageSchema.statics.hideForUser = async function (messageId, userId) {
  const result = await this.findByIdAndUpdate(
    messageId,
    {
      $addToSet: { hiddenFor: userId },
    },
    { new: true }
  );

  return result;
};

messageSchema.statics.recallMessage = async function (
  messageId,
  clearHidden = true
) {
  const update = {
    isRecalled: true,
    recalledAt: new Date(),
    content: "",
    reactions: [],
  };

  if (clearHidden) {
    update.hiddenFor = [];
  }

  const result = await this.findByIdAndUpdate(messageId, update, { new: true });

  return result;
};

messageSchema.statics.adminDelete = async function (messageId, adminId) {
  const result = await this.findByIdAndUpdate(
    messageId,
    {
      deletedAt: new Date(),
      deletedBy: adminId,
      hiddenFor: [],
      isRecalled: false,
      reactions: [],
    },
    { new: true }
  );

  return result;
};

messageSchema.statics.toggleReaction = async function (
  messageId,
  userId,
  emoji
) {
  const message = await this.findById(messageId);

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.deletedAt) {
    throw new Error("Cannot react to deleted message");
  }

  if (message.isRecalled) {
    throw new Error("Cannot react to recalled message");
  }

  const existingIndex = message.reactions.findIndex(
    (r) => r.user.toString() === userId.toString() && r.emoji === emoji
  );

  if (existingIndex !== -1) {
    message.reactions.splice(existingIndex, 1);
  } else {
    message.reactions.push({
      user: userId,
      emoji: emoji,
      createdAt: new Date(),
    });
  }

  await message.save();

  await message.populate({
    path: "reactions.user",
    select: "uid nickname avatar",
  });

  return message;
};

// ==================== 🔧 FIX: Prevent model overwrite error ====================

let Message;

try {
  // Try to get existing model
  Message = mongoose.model('Message');
} catch (error) {
  // Model doesn't exist yet, create it
  Message = mongoose.model('Message', messageSchema);
}

export default Message;
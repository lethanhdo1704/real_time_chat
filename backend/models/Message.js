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

    // ============================================
    // 🆕 3 KIỂU DELETE (THEO THỨ TỰ ƯU TIÊN)
    // ============================================
    
    // PRIORITY 1: Admin delete (highest priority)
    // Tin nhắn bị xóa bởi admin → không ai thấy
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    
    // PRIORITY 2: Recall (sender delete for all)
    // Thu hồi tin nhắn → tất cả đều thấy "Tin nhắn đã được thu hồi"
    isRecalled: {
      type: Boolean,
      default: false,
    },
    recalledAt: {
      type: Date,
      default: null,
    },
    
    // PRIORITY 3: Hidden (user-specific delete)
    // Gỡ tin nhắn → chỉ user trong array này không thấy
    // 🔧 Renamed from hiddenFrom → hiddenFor (better semantics)
    hiddenFor: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],

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

// User activity
messageSchema.index({ sender: 1, createdAt: -1 });

// Client message ID lookup
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
// INSTANCE METHODS
// ============================================

/**
 * Check if message is hidden for a specific user
 */
messageSchema.methods.isHiddenFor = function(userId) {
  return this.hiddenFor.some(id => id.toString() === userId.toString());
};

/**
 * Check if message is visible for a specific user
 * Follows priority: deletedAt > isRecalled > hiddenFor
 */
messageSchema.methods.isVisibleFor = function(userId) {
  // Priority 1: Admin deleted → never visible
  if (this.deletedAt) return false;
  
  // Priority 2: Recalled → visible but as placeholder
  // (handled by frontend)
  
  // Priority 3: Hidden for this user → not visible
  if (this.isHiddenFor(userId)) return false;
  
  return true;
};

/**
 * Get message state for frontend
 * 🔧 Returns raw data instead of formatted content
 */
messageSchema.methods.getState = function() {
  return {
    isDeleted: !!this.deletedAt,
    isRecalled: this.isRecalled,
    recalledAt: this.recalledAt,
  };
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get conversation messages with pagination
 * 🆕 Filters based on user visibility
 */
messageSchema.statics.getConversationMessages = async function (
  conversationId,
  userId,
  before = null,
  limit = 50
) {
  const query = {
    conversation: conversationId,
    deletedAt: null, // Exclude admin-deleted messages
    hiddenFor: { $ne: userId }, // Exclude messages hidden by this user
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

/**
 * 🆕 Hide message for a specific user (KIỂU 1 & 2)
 * Note: Business rules (permissions) should be checked in service layer
 */
messageSchema.statics.hideForUser = async function (messageId, userId) {
  const result = await this.findByIdAndUpdate(
    messageId,
    { 
      $addToSet: { hiddenFor: userId } // Prevent duplicates
    },
    { new: true }
  );
  
  return result;
};

/**
 * 🆕 Recall message for everyone (KIỂU 3)
 * Note: Business rules (sender check, time limit) should be in service layer
 * 
 * 🧠 Optional enhancement: Clear hiddenFor when recalling
 */
messageSchema.statics.recallMessage = async function (messageId, clearHidden = true) {
  const update = { 
    isRecalled: true,
    recalledAt: new Date(),
    content: "",
  };
  
  // Optional: Clear hidden state since recall is global
  if (clearHidden) {
    update.hiddenFor = [];
  }
  
  const result = await this.findByIdAndUpdate(
    messageId,
    update,
    { new: true }
  );
  
  return result;
};

/**
 * 🆕 Admin delete message (KIỂU ADMIN)
 * Clears all other states since this is highest priority
 */
messageSchema.statics.adminDelete = async function (messageId, adminId) {
  const result = await this.findByIdAndUpdate(
    messageId,
    { 
      deletedAt: new Date(),
      deletedBy: adminId,
      // Clear other states
      hiddenFor: [],
      isRecalled: false,
    },
    { new: true }
  );
  
  return result;
};

export default mongoose.model("Message", messageSchema);
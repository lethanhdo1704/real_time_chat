// backend/models/GroupNotification.js - UPDATED
import mongoose from "mongoose";
const { Schema } = mongoose;

const groupNotificationSchema = new Schema(
  {
    // 🎯 Người nhận thông báo
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🏠 Group liên quan
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    
    // 👤 Target user (for certain notification types)
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    
    // 🛡️ Unique key for preventing duplicate notifications
    // Format: "type:conversation:actor" or "type:conversation:actor:recipient"
    uniqueKey: {
      type: String,
      index: true,
      sparse: true,
    },
    
    // 📋 Loại thông báo
    type: {
      type: String,
      enum: [
        "GROUP_INVITE", // Được mời vào group
        "GROUP_JOIN_REQUEST", // Có người xin vào (gửi cho admin/owner)
        "GROUP_JOIN_APPROVED", // Request được duyệt
        "GROUP_JOIN_REJECTED", // Request bị từ chối
        "GROUP_MEMBER_JOINED", // Member mới vào (thông báo cho cả group)
        "GROUP_KICKED", // Bị kick
        "GROUP_PERMISSION_CHANGED", // Quyền gửi tin nhắn thay đổi
        "GROUP_DELETED", // Group bị xóa
        "GROUP_ROLE_CHANGED", // Được promote/demote (bonus)
      ],
      required: true,
      index: true,
    },

    // 👤 Người thực hiện hành động
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 📦 Dữ liệu mở rộng (linh hoạt theo type)
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },

    // ✅ Trạng thái đọc
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // ⏰ Trạng thái xử lý (for requests)
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "expired"],
      default: "pending",
      index: true,
    },

    // 📅 Thời gian tạo
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// ========================================
// 🔥 INDEXES (CRITICAL FOR PERFORMANCE)
// ========================================

// Badge count: đếm unread notifications
groupNotificationSchema.index({ recipient: 1, isRead: 1 });

// Notification list: lấy danh sách thông báo của user
groupNotificationSchema.index({ recipient: 1, createdAt: -1 });

// Cleanup: xóa notifications khi group bị xóa
groupNotificationSchema.index({ conversation: 1 });

// Query by type (để lọc)
groupNotificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });

// 🛡️ PREVENT DUPLICATE JOIN REQUESTS
// A user can only have 1 pending join request per group
groupNotificationSchema.index(
  { 
    conversation: 1, 
    actor: 1, 
    type: 1,
    status: 1
  },
  {
    unique: true,
    partialFilterExpression: { 
      type: "GROUP_JOIN_REQUEST",
      status: "pending"
    },
    name: 'one_pending_join_request_per_user_per_group'
  }
);

// 🛡️ PREVENT DUPLICATE INVITES
// A user can only have 1 pending invite per group
groupNotificationSchema.index(
  { 
    conversation: 1, 
    recipient: 1, 
    type: 1,
    status: 1
  },
  {
    unique: true,
    partialFilterExpression: { 
      type: "GROUP_INVITE",
      status: "pending"
    },
    name: 'one_pending_invite_per_user_per_group'
  }
);

// ========================================
// 🛠 STATIC METHODS
// ========================================

/**
 * Tạo notification mới
 * @param {Object} data - { recipient, conversation, type, actor, payload }
 */
groupNotificationSchema.statics.createNotification = async function (data) {
  const notification = await this.create({
    recipient: data.recipient,
    conversation: data.conversation,
    type: data.type,
    actor: data.actor,
    payload: data.payload || {},
    status: data.status || "pending",
    targetUser: data.targetUser || null,
  });

  return notification.populate([
    { path: "actor", select: "uid nickname avatar" },
    { path: "conversation", select: "name avatar type" },
  ]);
};

/**
 * 🛡️ Check if user has pending join request for this group
 */
groupNotificationSchema.statics.hasPendingJoinRequest = async function (
  conversationId,
  userId
) {
  const existing = await this.findOne({
    conversation: conversationId,
    actor: userId,
    type: "GROUP_JOIN_REQUEST",
    status: "pending",
  });
  
  return !!existing;
};

/**
 * 🛡️ Check if user has pending invite for this group
 */
groupNotificationSchema.statics.hasPendingInvite = async function (
  conversationId,
  userId
) {
  const existing = await this.findOne({
    conversation: conversationId,
    recipient: userId,
    type: "GROUP_INVITE",
    status: "pending",
  });
  
  return !!existing;
};

/**
 * 🛡️ Cancel previous pending requests/invites before creating new one
 */
groupNotificationSchema.statics.cancelPendingNotifications = async function (
  conversationId,
  userId,
  type
) {
  const query = {
    conversation: conversationId,
    type,
    status: "pending",
  };
  
  // For join requests, actor is the requester
  if (type === "GROUP_JOIN_REQUEST") {
    query.actor = userId;
  }
  // For invites, recipient is the invited user
  else if (type === "GROUP_INVITE") {
    query.recipient = userId;
  }
  
  return this.updateMany(query, { status: "expired" });
};

/**
 * Lấy unread count của user
 */
groupNotificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

/**
 * Đánh dấu đã đọc
 */
groupNotificationSchema.statics.markAsRead = async function (
  notificationIds,
  userId
) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId,
    },
    {
      isRead: true,
    }
  );
};

/**
 * Đánh dấu TẤT CẢ đã đọc
 */
groupNotificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false,
    },
    {
      isRead: true,
    }
  );
};

/**
 * Lấy danh sách notifications của user
 */
groupNotificationSchema.statics.getUserNotifications = async function (
  userId,
  { limit = 20, skip = 0, type = null } = {}
) {
  const query = { recipient: userId };
  if (type) query.type = type;

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("actor", "uid nickname avatar")
    .populate("conversation", "name avatar type");
};

/**
 * Xóa tất cả notifications của một group (khi group bị xóa)
 */
groupNotificationSchema.statics.deleteByConversation = async function (
  conversationId
) {
  return this.deleteMany({ conversation: conversationId });
};

/**
 * Update notification status (approve/reject requests)
 */
groupNotificationSchema.statics.updateStatus = async function (
  notificationId,
  status
) {
  return this.findByIdAndUpdate(
    notificationId,
    { status },
    { new: true }
  ).populate([
    { path: "actor", select: "uid nickname avatar" },
    { path: "conversation", select: "name avatar type" },
  ]);
};

// ========================================
// 🎯 INSTANCE METHODS
// ========================================

/**
 * Format notification thành object gửi cho client
 */
groupNotificationSchema.methods.toClient = function () {
  return {
    id: this._id,
    type: this.type,
    isRead: this.isRead,
    status: this.status,
    createdAt: this.createdAt,
    actor: this.actor,
    conversation: this.conversation,
    payload: this.payload,
  };
};

export default mongoose.model("GroupNotification", groupNotificationSchema);
// backend/models/GroupNotification.js
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
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
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

    // 📅 Thời gian tạo
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Không cần updatedAt
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
  });

  return notification.populate([
    { path: "actor", select: "uid nickname avatar" },
    { path: "conversation", select: "name avatar type" },
  ]);
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
    createdAt: this.createdAt,
    actor: this.actor,
    conversation: this.conversation,
    payload: this.payload,
  };
};

export default mongoose.model("GroupNotification", groupNotificationSchema);

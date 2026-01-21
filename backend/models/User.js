// backend/models/User.js
import mongoose from "mongoose";
import crypto from "crypto";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    uid: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
      index: true,
    },

    nickname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    avatarUpdatedAt: {
      type: Date,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["active", "banned", "deleted"],
      default: "active",
      index: true,
    },

    // ===== Ban info (chỉ dùng khi status = banned)
    banStartAt: {
      type: Date,
      default: null,
    },

    banEndAt: {
      type: Date,
      default: null, // ban tạm, hết hạn thì cho hoạt động lại
    },

    bannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ===== Presence
    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

// ========================================
// 🚀 OPTIMIZED INDEXES
// ========================================

// 1. Compound index cho admin listing (thay thế 2 index đơn)
// Hỗ trợ query: filter by status + role + sort by createdAt
userSchema.index({ status: 1, role: 1, createdAt: -1 });

// 2. Text index cho search (email, nickname, uid)
userSchema.index({ 
  email: 'text', 
  nickname: 'text', 
  uid: 'text' 
}, {
  weights: {
    email: 10,      // Priority cao nhất
    nickname: 5,    // Priority trung bình
    uid: 3          // Priority thấp
  },
  name: 'user_search_index'
});

// 3. Compound index cho auto-unban expired users
// Tìm users: status=banned + banEndAt đã hết hạn
userSchema.index({ status: 1, banEndAt: 1 });

// 4. Index cho online users tracking
userSchema.index({ isOnline: 1, lastSeen: -1 });

// 5. Partial index cho banned users (chỉ index khi status = banned)
// Tiết kiệm storage vì chỉ index một phần nhỏ data
userSchema.index(
  { bannedBy: 1, banStartAt: -1 }, 
  { 
    partialFilterExpression: { status: 'banned' },
    name: 'banned_users_index'
  }
);

const User = mongoose.model("User", userSchema);
export default User;
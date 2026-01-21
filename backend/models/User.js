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

// Index hỗ trợ admin
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);
export default User;

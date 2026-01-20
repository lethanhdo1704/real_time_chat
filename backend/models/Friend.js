// backend/models/Friend.js - OPTIMIZED VERSION
import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    friend: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
    seenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ CRITICAL INDEXES cho performance
friendSchema.index({ user: 1, status: 1 }); // Query lời mời của user theo status
friendSchema.index({ friend: 1, status: 1 }); // Query lời mời đến friend theo status
friendSchema.index({ user: 1, friend: 1 }, { unique: true }); // Tránh duplicate + tăng tốc

// ✅ Indexes bổ sung
friendSchema.index({ status: 1 }); // Filter theo status
friendSchema.index({ friend: 1, status: 1, seenAt: 1 }); // Query unseen requests
friendSchema.index({ createdAt: -1 }); // Sort theo thời gian

// ✅ Compound index cho query phức tạp
friendSchema.index({ 
  user: 1, 
  friend: 1, 
  status: 1 
}); // Check relationship status

export default mongoose.model("Friend", friendSchema);
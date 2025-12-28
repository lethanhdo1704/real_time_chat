// backend/models/Friend.js
import mongoose from "mongoose";
const friendSchema = new mongoose.Schema(
  {
    user: {
      // người gửi lời mời
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    friend: {
      // người nhận lời mời
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
export default mongoose.model("Friend", friendSchema);
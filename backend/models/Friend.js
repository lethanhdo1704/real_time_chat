// backend/models/Friend.js
import mongoose from "mongoose";

const friendSchema = new mongoose.Schema({
  user: { type: String, ref: "User" }, // uid của người dùng
  friend: { type: String, ref: "User" }, // uid của bạn bè
  status: {
    type: String,
    enum: ["pending", "accepted", "blocked"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Friend", friendSchema);

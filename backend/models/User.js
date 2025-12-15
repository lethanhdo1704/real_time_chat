// backend/models/User.js
import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    unique: true,
    default: () => crypto.randomUUID(),
    index: true,
  },

  nickname: {
    type: String,
    required: true, 
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  passwordHash: {
    type: String,
    required: true,
  },

  avatar: {
    type: String,
    default: "",
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  isOnline: {
    type: Boolean,
    default: false,
  },

  lastSeen: {
    type: Date,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
export default User;


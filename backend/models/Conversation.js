// backend/models/Conversation.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const conversationSchema = new Schema({
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true,
  },

  // Group only
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },

  avatar: String,

  // Group only - private chat không có owner
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  // Private chat only - unique link to friendship
  friendshipId: {
    type: Schema.Types.ObjectId,
    ref: 'Friend',
    unique: true,
    sparse: true
  },

  // Performance cache - updated by service
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },

  lastMessageAt: {
    type: Date,
    index: true
  },

  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
conversationSchema.index({ type: 1 });
conversationSchema.index({ lastMessageAt: -1 }); // sidebar sorting

export default mongoose.model('Conversation', conversationSchema);
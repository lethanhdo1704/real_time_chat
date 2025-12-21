// ===== models/Message.js (REWRITE) =====
import mongoose from "mongoose";

const { Schema } = mongoose;
const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  attachments: [{
    url: String,
    name: String,
    size: Number,
    type: String
  }],
  
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

messageSchema.index({ conversation: 1, _id: -1 });
messageSchema.index({ conversation: 1, deletedAt: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
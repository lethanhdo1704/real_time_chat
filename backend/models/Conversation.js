// ===== models/Conversation.js =====
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['private', 'group'],
    required: true
  },
  
  name: {
    type: String,
    default: null,
    maxlength: 100
  },
  avatar: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  friendshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Friend',
    default: null
  },
  
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

conversationSchema.index({ friendshipId: 1 }, { unique: true, sparse: true });
conversationSchema.index({ type: 1 });
conversationSchema.index({ createdBy: 1 });

conversationSchema.statics.findOrCreatePrivate = async function(userId, friendId, friendshipId) {
  let conversation = await this.findOne({ friendshipId });
  
  if (!conversation) {
    conversation = await this.create({
      type: 'private',
      createdBy: userId,
      friendshipId
    });
    
    const ConversationMember = mongoose.model('ConversationMember');
    await ConversationMember.insertMany([
      { conversation: conversation._id, user: userId, role: 'member' },
      { conversation: conversation._id, user: friendId, role: 'member' }
    ]);
  }
  
  return conversation;
};

export default mongoose.model('Conversation', conversationSchema);

// ===== services/message.service.js =====
import Conversation from "../models/Conversation.js";
import ConversationMember from "../models/ConversationMember.js";
import Message from "../models/Message.js";
import Friend from "../models/Friend.js";
class MessageService {
  async sendMessage({ conversationId, senderId, content, type = 'text', replyTo = null, attachments = [] }) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    const senderMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: senderId,
      leftAt: null
    });
    
    if (!senderMember) {
      throw new Error('Not a member of this conversation');
    }
    
    if (conversation.type === 'private') {
      const friendship = await Friend.findById(conversation.friendshipId);
      if (!friendship || friendship.status !== 'accepted') {
        throw new Error('Cannot send message - not friends');
      }
    }
    
    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content,
      type,
      replyTo,
      attachments
    });
    
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    
    senderMember.lastSeenMessage = message._id;
    senderMember.lastSeenAt = new Date();
    await senderMember.save();
    
    await message.populate('sender', 'uid nickname avatar');
    
    const otherMembers = await ConversationMember.find({
      conversation: conversationId,
      user: { $ne: senderId },
      leftAt: null
    }).populate('user', 'uid');
    
    return {
      message: {
        messageId: message._id,
        conversation: conversationId,
        sender: {
          uid: message.sender.uid,
          nickname: message.sender.nickname,
          avatar: message.sender.avatar
        },
        content: message.content,
        type: message.type,
        replyTo: message.replyTo,
        attachments: message.attachments,
        createdAt: message.createdAt
      },
      notifyMembers: otherMembers.map(m => m.user.uid)
    };
  }
  
  async getMessages(conversationId, userId, before = null, limit = 50) {
    const isMember = await ConversationMember.isActiveMember(conversationId, userId);
    if (!isMember) {
      throw new Error('Not a member');
    }
    
    const query = {
      conversation: conversationId,
      deletedAt: null
    };
    
    if (before) {
      query._id = { $lt: before };
    }
    
    const messages = await Message.find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .populate('sender', 'uid nickname avatar')
      .populate('replyTo', 'content sender');
    
    const hasMore = messages.length === limit;
    
    return {
      messages: messages.map(msg => ({
        messageId: msg._id,
        sender: {
          uid: msg.sender.uid,
          nickname: msg.sender.nickname,
          avatar: msg.sender.avatar
        },
        content: msg.content,
        type: msg.type,
        replyTo: msg.replyTo ? {
          messageId: msg.replyTo._id,
          content: msg.replyTo.content
        } : null,
        attachments: msg.attachments,
        createdAt: msg.createdAt,
        editedAt: msg.editedAt
      })),
      hasMore
    };
  }
  
  async markAsRead(conversationId, userId) {
    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: userId,
      leftAt: null
    });
    
    if (!member) {
      throw new Error('Not a member');
    }
    
    const lastMessage = await Message.findOne({
      conversation: conversationId,
      deletedAt: null
    }).sort({ _id: -1 });
    
    if (!lastMessage) {
      return { success: true, lastSeenMessage: null };
    }
    
    member.lastSeenMessage = lastMessage._id;
    member.lastSeenAt = new Date();
    await member.save();
    
    return {
      success: true,
      lastSeenMessage: lastMessage._id,
      lastSeenAt: member.lastSeenAt
    };
  }
}

export default new MessageService();
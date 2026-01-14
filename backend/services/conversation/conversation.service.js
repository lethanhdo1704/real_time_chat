// backend/services/conversation/conversation.service.js
import ConversationQuery from './conversation.query.js';
import ConversationCreate from './conversation.create.js';
import ConversationRead from './conversation.read.js';
import ConversationMember from './conversation.member.js';
import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';
import mongoose from 'mongoose';

/**
 * Main Conversation Service - Orchestrator
 * Delegates to specific services for each domain
 */
class ConversationService {
  /**
   * Check if conversation exists with a friend
   */
  async checkConversation(userUid, friendUid) {
    return ConversationQuery.checkConversation(userUid, friendUid);
  }

  /**
   * Get user's conversations for sidebar
   */
  async getUserConversations(userUid, limit = 20, offset = 0) {
    return ConversationQuery.getUserConversations(userUid, limit, offset);
  }

  /**
   * Get conversation detail
   */
  async getConversationDetail(conversationId, userUid) {
    return ConversationQuery.getConversationDetail(conversationId, userUid);
  }

  /**
   * Create private conversation (1-1 chat)
   */
  async createPrivate(userUid, friendUid) {
    return ConversationCreate.createPrivate(userUid, friendUid);
  }

  /**
   * Create group conversation
   */
  async createGroup(userUid, name, memberUids) {
    return ConversationCreate.createGroup(userUid, name, memberUids);
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId, userUid) {
    return ConversationRead.markAsRead(conversationId, userUid);
  }

  /**
   * Leave group
   */
  async leaveGroup(conversationId, userUid) {
    return ConversationMember.leaveGroup(conversationId, userUid);
  }

  /**
   * Add members to group
   */
  async addMembers(conversationId, adminUid, memberUids) {
    return ConversationMember.addMembers(conversationId, adminUid, memberUids);
  }

  /**
   * Remove member from group
   */
  async removeMember(conversationId, adminUid, memberUid) {
    return ConversationMember.removeMember(conversationId, adminUid, memberUid);
  }

  // ============================================
  // 🔥 COUNTER METHODS - NEW
  // ============================================

  /**
   * Update conversation after sending message
   * ✅ Atomic $inc - no race condition
   * ✅ Call this AFTER message is saved
   * 
   * @param {string|ObjectId} conversationId - Conversation ID
   * @param {Object} message - Saved Message document
   * @returns {Promise<Object>} Updated conversation
   */
  async updateAfterSendMessage(conversationId, message) {
    // 1. Build increment object
    const inc = {
      totalMessages: 1,
    };

    // 2. Count attachments by mediaType
    for (const att of message.attachments || []) {
      const counterKey = {
        image: 'sharedImages',
        video: 'sharedVideos',
        audio: 'sharedAudios',
        file: 'sharedFiles',
        link: 'sharedLinks',
      }[att.mediaType];

      if (counterKey) {
        inc[counterKey] = (inc[counterKey] || 0) + 1;
      }
    }

    // 3. Atomic update
    const updated = await Conversation.findOneAndUpdate(
      { _id: conversationId },
      { $inc: inc },
      { new: true }
    );

    if (!updated) {
      console.warn('⚠️ [updateAfterSendMessage] Conversation not found:', conversationId);
    }

    return updated;
  }

  /**
   * Rebuild all counters for a conversation
   * ✅ Use when counters are corrupted
   * ✅ Admin/cron job only
   * 
   * @param {string|ObjectId} conversationId - Conversation ID
   * @returns {Promise<Object>} Updated conversation
   */
  async rebuildCounters(conversationId) {
    // Convert to ObjectId if string
    const convId = mongoose.Types.ObjectId.isValid(conversationId)
      ? new mongoose.Types.ObjectId(conversationId)
      : conversationId;

    // Aggregate to count everything
    const result = await Message.aggregate([
      {
        $match: {
          conversation: convId,
          deletedAt: null,
          isRecalled: false,
        },
      },
      {
        $facet: {
          // Count unique messages
          totalMessages: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
              },
            },
          ],
          // Count attachments by type
          attachments: [
            { $unwind: '$attachments' },
            {
              $group: {
                _id: '$attachments.mediaType',
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    // Extract counts
    const totalMessages = result[0]?.totalMessages[0]?.count || 0;
    
    const attachmentCounts = {
      sharedImages: 0,
      sharedVideos: 0,
      sharedAudios: 0,
      sharedFiles: 0,
      sharedLinks: 0,
    };

    for (const item of result[0]?.attachments || []) {
      const key = {
        image: 'sharedImages',
        video: 'sharedVideos',
        audio: 'sharedAudios',
        file: 'sharedFiles',
        link: 'sharedLinks',
      }[item._id];

      if (key) {
        attachmentCounts[key] = item.count;
      }
    }

    // Update conversation
    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          totalMessages,
          ...attachmentCounts,
        },
      },
      { new: true }
    );

    console.log('✅ [rebuildCounters] Counters rebuilt:', {
      conversationId: conversationId.toString(),
      totalMessages,
      ...attachmentCounts,
    });

    return updated;
  }

  /**
   * Get conversation info with counters
   * ✅ For Conversation Info modal
   * 
   * @param {string|ObjectId} conversationId - Conversation ID
   * @returns {Promise<Object>} Conversation info with counters
   */
  async getConversationInfo(conversationId) {
    const conversation = await Conversation.findById(conversationId)
      .select(
        'type name avatar totalMessages sharedImages sharedVideos sharedAudios sharedFiles sharedLinks createdAt'
      )
      .lean();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Format response
    return {
      id: conversation._id,
      type: conversation.type,
      name: conversation.name,
      avatar: conversation.avatar,
      createdAt: conversation.createdAt,
      statistics: {
        totalMessages: conversation.totalMessages,
        shared: {
          images: conversation.sharedImages,
          videos: conversation.sharedVideos,
          audios: conversation.sharedAudios,
          files: conversation.sharedFiles,
          links: conversation.sharedLinks,
        },
      },
    };
  }
}

export default new ConversationService();
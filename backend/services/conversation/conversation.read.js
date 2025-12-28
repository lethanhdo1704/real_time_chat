// backend/services/conversation/conversation.read.js
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import User from "../../models/User.js";

/**
 * Conversation Read Service
 * Handles marking conversations as read
 */
class ConversationReadService {
  /**
   * Mark conversation as read
   * 
   * @param {string} conversationId - Conversation ID
   * @param {string} userUid - User's uid
   * @returns {Object} Success status with unreadCount
   */
  async markAsRead(conversationId, userUid) {
    try {
      console.log('✅ [ConversationRead] Marking as read:', { conversationId, userUid });

      // Convert uid to _id
      const currentUser = await User.findOne({ uid: userUid })
        .select('_id')
        .lean();

      if (!currentUser) {
        throw new Error('User not found');
      }

      const userId = currentUser._id;

      // Verify user is a member
      const isMember = await ConversationMember.isActiveMember(conversationId, userId);
      if (!isMember) {
        throw new Error("Not a member of this conversation");
      }

      // Get the last message in conversation
      const conversation = await Conversation.findById(conversationId);
      const lastMessageId = conversation?.lastMessage || null;

      // Use the static method from ConversationMember model
      const updatedMember = await ConversationMember.markAsRead(
        conversationId,
        userId,
        lastMessageId
      );

      if (!updatedMember) {
        throw new Error("Failed to mark as read");
      }

      console.log('✅ [ConversationRead] Marked as read successfully');

      return {
        success: true,
        unreadCount: 0,
        lastSeenAt: updatedMember.lastSeenAt
      };
    } catch (error) {
      console.error("❌ [ConversationRead] markAsRead error:", error);
      throw error;
    }
  }
}

export default new ConversationReadService();
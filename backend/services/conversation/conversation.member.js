// backend/services/conversation/conversation.member.js
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import User from "../../models/User.js";

/**
 * Conversation Member Service
 * Handles member management (add, remove, leave)
 */
class ConversationMemberService {
  /**
   * Leave group conversation
   * 
   * @param {string} conversationId - Conversation ID
   * @param {string} userUid - User's uid
   * @returns {Object} Success status
   */
  async leaveGroup(conversationId, userUid) {
    try {
      // Convert uid to _id
      const currentUser = await User.findOne({ uid: userUid })
        .select('_id')
        .lean();

      if (!currentUser) {
        throw new Error('User not found');
      }

      const userId = currentUser._id;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.type !== "group") {
        throw new Error("Invalid group conversation");
      }

      const member = await ConversationMember.findOne({
        conversation: conversationId,
        user: userId,
        leftAt: null,
      });

      if (!member) {
        throw new Error("Not a member");
      }

      // Owner must transfer ownership before leaving
      if (member.role === "owner") {
        const otherMembers = await ConversationMember.countDocuments({
          conversation: conversationId,
          leftAt: null,
          user: { $ne: userId },
        });

        if (otherMembers > 0) {
          throw new Error("Owner must transfer ownership before leaving");
        }
      }

      member.leftAt = new Date();
      await member.save();

      return { success: true };
    } catch (error) {
      console.error("❌ [ConversationMember] leaveGroup error:", error);
      throw error;
    }
  }

  /**
   * Add members to group
   * 
   * @param {string} conversationId - Conversation ID
   * @param {string} adminUid - Admin's uid
   * @param {Array<string>} memberUids - Array of member uids to add
   * @returns {Object} Success status with count of added members
   */
  async addMembers(conversationId, adminUid, memberUids) {
    try {
      // Convert admin uid to _id
      const admin = await User.findOne({ uid: adminUid })
        .select('_id')
        .lean();

      if (!admin) {
        throw new Error('Admin user not found');
      }

      const adminId = admin._id;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.type !== "group") {
        throw new Error("Invalid group conversation");
      }

      const adminMember = await ConversationMember.findOne({
        conversation: conversationId,
        user: adminId,
        leftAt: null,
      });

      if (!adminMember || !["owner", "admin"].includes(adminMember.role)) {
        throw new Error("Permission denied");
      }

      const users = await User.find({ uid: { $in: memberUids } });
      const userIds = users.map((u) => u._id);

      const newMembers = userIds.map((userId) => ({
        conversation: conversationId,
        user: userId,
        role: "member",
        unreadCount: 0,
      }));

      await ConversationMember.insertMany(newMembers, { ordered: false });

      return { success: true, added: users.length };
    } catch (error) {
      console.error("❌ [ConversationMember] addMembers error:", error);
      throw error;
    }
  }

  /**
   * Remove member from group
   * 
   * @param {string} conversationId - Conversation ID
   * @param {string} adminUid - Admin's uid
   * @param {string} memberUid - Member uid to remove
   * @returns {Object} Success status
   */
  async removeMember(conversationId, adminUid, memberUid) {
    try {
      // Convert admin uid to _id
      const admin = await User.findOne({ uid: adminUid })
        .select('_id')
        .lean();

      if (!admin) {
        throw new Error('Admin user not found');
      }

      const adminId = admin._id;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || conversation.type !== "group") {
        throw new Error("Invalid group conversation");
      }

      const adminMember = await ConversationMember.findOne({
        conversation: conversationId,
        user: adminId,
        leftAt: null,
      });

      if (!adminMember || !["owner", "admin"].includes(adminMember.role)) {
        throw new Error("Permission denied");
      }

      const targetUser = await User.findOne({ uid: memberUid });
      if (!targetUser) {
        throw new Error("User not found");
      }

      const targetMember = await ConversationMember.findOne({
        conversation: conversationId,
        user: targetUser._id,
        leftAt: null,
      });

      if (!targetMember) {
        throw new Error("User is not a member");
      }

      if (
        ["owner", "admin"].includes(targetMember.role) &&
        adminMember.role === "admin"
      ) {
        throw new Error("Cannot remove admin or owner");
      }

      targetMember.leftAt = new Date();
      await targetMember.save();

      return { success: true };
    } catch (error) {
      console.error("❌ [ConversationMember] removeMember error:", error);
      throw error;
    }
  }
}

export default new ConversationMemberService();
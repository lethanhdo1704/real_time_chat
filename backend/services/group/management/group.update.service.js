// backend/services/group/management/group.update.service.js

import User from "../../../models/User.js";
import Conversation from "../../../models/Conversation.js";
import ConversationMember from "../../../models/ConversationMember.js";
import groupEmitter from "../group.emitter.js";

/**
 * Group Update Service
 * Handles updating group information (name, avatar, settings)
 */
class GroupUpdateService {
  /**
   * Convert UID to User
   */
  async uidToUser(uid) {
    const user = await User.findOne({ uid }).select("_id uid nickname avatar");
    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
  }

  /**
   * Update group information
   * @param {string} conversationId - Conversation ID
   * @param {string} actorUid - User UID (must be owner)
   * @param {Object} updates - { name?, avatar?, messagePermission?, joinMode? }
   * @returns {Promise<Object>} Updated group info
   */
  async updateGroupInfo(conversationId, actorUid, updates) {
    console.log("✏️ [GroupUpdateService] Updating group:", {
      conversationId,
      actorUid,
      updates,
    });

    // ============================================
    // 1. VERIFY CONVERSATION EXISTS AND IS GROUP
    // ============================================
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("NOT_A_GROUP");
    }

    // ============================================
    // 2. VERIFY ACTOR IS OWNER
    // ============================================
    const actor = await this.uidToUser(actorUid);

    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: actor._id,
      role: "owner",
      leftAt: null,
    });

    if (!member) {
      throw new Error("ONLY_OWNER_CAN_UPDATE");
    }

    // ============================================
    // 3. VALIDATE AND PREPARE UPDATE DATA
    // ============================================
    const allowedFields = ["name", "avatar", "messagePermission", "joinMode"];
    const updateData = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("NO_FIELDS_TO_UPDATE");
    }

    // Validate joinMode
    if (updates.joinMode && !["approval", "link"].includes(updates.joinMode)) {
      throw new Error("INVALID_JOIN_MODE");
    }

    // Validate messagePermission
    if (updates.messagePermission) {
      const validPermissions = ["all", "admins_only", "owner_only"];
      if (!validPermissions.includes(updates.messagePermission)) {
        throw new Error("INVALID_MESSAGE_PERMISSION");
      }
    }

    // Validate name
    if (updates.name !== undefined) {
      if (typeof updates.name !== "string") {
        throw new Error("INVALID_NAME_TYPE");
      }
      const trimmedName = updates.name.trim();
      if (trimmedName.length === 0) {
        throw new Error("NAME_CANNOT_BE_EMPTY");
      }
      if (trimmedName.length > 100) {
        throw new Error("NAME_TOO_LONG");
      }
      updateData.name = trimmedName;
    }

    // ============================================
    // 4. UPDATE CONVERSATION
    // ============================================
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      updateData,
      { new: true }
    ).populate("createdBy", "uid nickname avatar");

    // ============================================
    // 5. EMIT EVENTS
    // ============================================
    if (updates.joinMode) {
      groupEmitter.emitJoinModeChanged({
        conversationId,
        newJoinMode: updates.joinMode,
      });
    }

    if (updates.messagePermission) {
      groupEmitter.emitPermissionChanged({
        conversationId,
        newPermission: updates.messagePermission,
      });
    }

    console.log("✅ [GroupUpdateService] Group updated successfully");

    // ============================================
    // 6. RETURN FORMATTED RESPONSE
    // ============================================
    return {
      _id: updatedConversation._id,
      type: updatedConversation.type,
      name: updatedConversation.name,
      avatar: updatedConversation.avatar,
      createdBy: updatedConversation.createdBy
        ? {
            uid: updatedConversation.createdBy.uid,
            nickname: updatedConversation.createdBy.nickname,
            avatar: updatedConversation.createdBy.avatar,
          }
        : null,
      joinMode: updatedConversation.joinMode,
      messagePermission: updatedConversation.messagePermission,
      totalMessages: updatedConversation.totalMessages,
      sharedImages: updatedConversation.sharedImages,
      sharedVideos: updatedConversation.sharedVideos,
      sharedAudios: updatedConversation.sharedAudios,
      sharedFiles: updatedConversation.sharedFiles,
      sharedLinks: updatedConversation.sharedLinks,
      isDeleted: updatedConversation.isDeleted,
      createdAt: updatedConversation.createdAt,
      updatedAt: updatedConversation.updatedAt,
    };
  }

  /**
   * Update group name only
   */
  async updateGroupName(conversationId, actorUid, name) {
    return this.updateGroupInfo(conversationId, actorUid, { name });
  }

  /**
   * Update group avatar only
   */
  async updateGroupAvatar(conversationId, actorUid, avatar) {
    return this.updateGroupInfo(conversationId, actorUid, { avatar });
  }

  /**
   * Update message permission only
   */
  async updateMessagePermission(conversationId, actorUid, messagePermission) {
    return this.updateGroupInfo(conversationId, actorUid, { messagePermission });
  }

  /**
   * Update join mode only
   */
  async updateJoinMode(conversationId, actorUid, joinMode) {
    return this.updateGroupInfo(conversationId, actorUid, { joinMode });
  }
}

// ✅ CRITICAL: Export as default singleton instance
export default new GroupUpdateService();
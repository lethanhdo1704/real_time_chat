// backend/services/group/management/member.leave.service.js
import Conversation from "../../../models/Conversation.js";
import ConversationMember from "../../../models/ConversationMember.js";
import groupEmitter from "../group.emitter.js";
import groupPermissions from "../group.permissions.js";
import userHelper from "./user.helper.service.js";

class MemberLeaveService {
  /**
   * Leave group
   */
  async leaveGroup(conversationId, userUid) {
    // Check if conversation is a group
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("CANNOT_LEAVE_PRIVATE_CONVERSATION");
    }

    const user = await userHelper.uidToUser(userUid);

    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: user._id,
      leftAt: null,
    });

    if (!member) {
      throw new Error("NOT_MEMBER");
    }

    // Check if owner can leave
    if (member.role === "owner") {
      await groupPermissions.canOwnerLeave(conversationId, user._id);
    }

    // softDeleteMember with null = voluntary leave
    await ConversationMember.softDeleteMember(
      conversationId,
      user._id,
      null // null = voluntary leave
    );

    // Check if last member
    const remainingMembers = await ConversationMember.countDocuments({
      conversation: conversationId,
      leftAt: null,
    });

    if (remainingMembers === 0) {
      // Delete group
      await Conversation.findByIdAndUpdate(conversationId, {
        isDeleted: true,
      });

      groupEmitter.emitGroupDeleted({
        conversationId,
      });
    } else {
      // Emit member left
      groupEmitter.emitMemberLeft({
        user: {
          uid: user.uid,
          nickname: user.nickname,
          avatar: user.avatar,
        },
        conversationId,
      });
    }

    return { success: true };
  }
}

export default new MemberLeaveService();
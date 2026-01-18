// backend/services/group/management/kick.history.service.js
import Conversation from "../../../models/Conversation.js";
import ConversationMember from "../../../models/ConversationMember.js";
import userHelper from "./user.helper.service.js";

class KickHistoryService {
  /**
   * Get kick history for a group
   */
  async getKickHistory(conversationId, actorUid, limit = 50) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("CONVERSATION_NOT_FOUND");
    }
    if (conversation.type !== "group") {
      throw new Error("NOT_A_GROUP");
    }

    const actor = await userHelper.uidToUser(actorUid);

    // Check if admin/owner
    const member = await ConversationMember.findOne({
      conversation: conversationId,
      user: actor._id,
      role: { $in: ["owner", "admin"] },
      leftAt: null,
    });

    if (!member) {
      throw new Error("UNAUTHORIZED");
    }

    // Get kicked members
    const kickedMembers = await ConversationMember.getKickedMembers(
      conversationId,
      limit
    );

    return {
      kickedMembers: kickedMembers.map((m) => ({
        user: {
          uid: m.user.uid,
          nickname: m.user.nickname,
          avatar: m.user.avatar,
        },
        kickedBy: {
          uid: m.kickedBy.uid,
          nickname: m.kickedBy.nickname,
          avatar: m.kickedBy.avatar,
        },
        kickedAt: m.kickedAt,
        leftAt: m.leftAt,
        durationSinceKick: Date.now() - m.kickedAt.getTime(),
      })),
    };
  }

  /**
   * Check if user was kicked
   */
  async checkKickStatus(conversationId, userUid) {
    const user = await userHelper.uidToUser(userUid);

    const kickInfo = await ConversationMember.getKickInfo(
      conversationId,
      user._id
    );

    if (!kickInfo) {
      return { wasKicked: false };
    }

    return {
      wasKicked: true,
      kickedBy: {
        uid: kickInfo.kickedBy.uid,
        nickname: kickInfo.kickedBy.nickname,
        avatar: kickInfo.kickedBy.avatar,
      },
      kickedAt: kickInfo.kickedAt,
      leftAt: kickInfo.leftAt,
    };
  }
}

export default new KickHistoryService();
// backend/controllers/group/group.info.controller.js
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import User from "../../models/User.js";

class GroupInfoController {
  /**
   * Get group info
   * GET /api/groups/:conversationId
   */
  async getGroupInfo(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log(
        `📋 [GroupInfoController] Getting group info for ${conversationId}`
      );

      const conversation = await Conversation.findById(conversationId).populate(
        "createdBy",
        "uid nickname avatar"
      );

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "CONVERSATION_NOT_FOUND",
        });
      }

      const user = await User.findOne({ uid: req.user.uid });
      const member = await ConversationMember.findOne({
        conversation: conversationId,
        user: user._id,
        leftAt: null,
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          message: "NOT_MEMBER",
        });
      }

      const members = await ConversationMember.find({
        conversation: conversationId,
        leftAt: null,
      })
        .populate("user", "uid nickname avatar")
        .select("role joinedAt")
        .lean();

      const roleOrder = { owner: 0, admin: 1, member: 2 };
      const formattedMembers = members
        .filter((m) => m.user)
        .sort((a, b) => {
          const roleDiff = roleOrder[a.role] - roleOrder[b.role];
          if (roleDiff !== 0) return roleDiff;
          return new Date(a.joinedAt) - new Date(b.joinedAt);
        })
        .map((m) => ({
          uid: m.user.uid,
          nickname: m.user.nickname,
          avatar: m.user.avatar,
          role: m.role,
          joinedAt: m.joinedAt,
        }));

      const groupInfo = {
        _id: conversation._id,
        type: conversation.type,
        name: conversation.name,
        avatar: conversation.avatar,
        createdBy: conversation.createdBy
          ? {
              uid: conversation.createdBy.uid,
              nickname: conversation.createdBy.nickname,
              avatar: conversation.createdBy.avatar,
            }
          : null,
        joinMode: conversation.joinMode,
        messagePermission: conversation.messagePermission,
        totalMessages: conversation.totalMessages,
        sharedImages: conversation.sharedImages,
        sharedVideos: conversation.sharedVideos,
        sharedAudios: conversation.sharedAudios,
        sharedFiles: conversation.sharedFiles,
        sharedLinks: conversation.sharedLinks,
        isDeleted: conversation.isDeleted,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        members: formattedMembers,
        totalMembers: formattedMembers.length,
        currentUserRole: member.role,
      };

      console.log(
        `✅ [GroupInfoController] Group info retrieved with ${formattedMembers.length} members`
      );

      res.json({
        success: true,
        data: groupInfo,
      });
    } catch (error) {
      console.error("❌ [GroupInfoController] getGroupInfo error:", error.message);
      next(error);
    }
  }
}

export default new GroupInfoController();
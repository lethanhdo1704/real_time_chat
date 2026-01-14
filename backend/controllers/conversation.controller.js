// backend/controllers/conversation.controller.js
import conversationService from "../services/conversation/index.js";

class ConversationController {
  /**
   * 🔥 NEW: Check if conversation exists with a friend
   * GET /api/conversations/check/:friendId
   */
  async checkConversation(req, res, next) {
    try {
      const { friendId } = req.params;

      if (!friendId) {
        return res.status(400).json({
          success: false,
          message: 'friendId is required'
        });
      }

      console.log('🔍 [ConversationController] Checking conversation:', {
        userId: req.user.uid,
        friendId
      });

      const result = await conversationService.checkConversation(
        req.user.uid,
        friendId
      );

      console.log('✅ [ConversationController] Check result:', {
        exists: result.exists,
        conversationId: result.conversationId
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ [ConversationController] checkConversation error:', error.message);
      next(error);
    }
  }

  /**
   * Create private conversation (1-1 chat)
   * POST /api/conversations/private
   */
  async createPrivate(req, res, next) {
    try {
      const { friendUid } = req.body;
      
      if (!friendUid) {
        return res.status(400).json({
          success: false,
          message: 'friendUid is required'
        });
      }

      console.log('🔨 [ConversationController] Creating private chat with:', friendUid);
      
      const result = await conversationService.createPrivate(
        req.user.uid,
        friendUid
      );

      console.log('✅ [ConversationController] Private chat created:', result.conversationId);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ [ConversationController] createPrivate error:', error.message);
      next(error);
    }
  }
  
  /**
   * Create group conversation
   * POST /api/conversations/group
   */
  async createGroup(req, res, next) {
    try {
      const { name, memberUids } = req.body;
      
      if (!name || !memberUids) {
        return res.status(400).json({
          success: false,
          message: 'name and memberUids are required'
        });
      }

      if (!Array.isArray(memberUids)) {
        return res.status(400).json({
          success: false,
          message: 'memberUids must be an array'
        });
      }

      console.log('🔨 [ConversationController] Creating group:', name);
      
      const result = await conversationService.createGroup(
        req.user.uid,
        name,
        memberUids
      );

      console.log('✅ [ConversationController] Group created:', result.conversationId);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ [ConversationController] createGroup error:', error.message);
      next(error);
    }
  }
  
  /**
   * Get user's conversations (sidebar)
   * GET /api/conversations
   */
  async getUserConversations(req, res, next) {
    try {
      const { limit = 20, offset = 0 } = req.query;

      console.log('📥 [ConversationController] Getting conversations for user:', req.user.uid);
      
      const conversations = await conversationService.getUserConversations(
        req.user.uid,
        parseInt(limit, 10),
        parseInt(offset, 10)
      );

      console.log('✅ [ConversationController] Retrieved:', conversations.length, 'conversations');

      res.json({
        success: true,
        data: { conversations }
      });
    } catch (error) {
      console.error('❌ [ConversationController] getUserConversations error:', error.message);
      next(error);
    }
  }
  
  /**
   * Get conversation detail
   * GET /api/conversations/:conversationId
   */
  async getConversationDetail(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log('📥 [ConversationController] Getting detail for:', conversationId);
      
      const detail = await conversationService.getConversationDetail(
        conversationId,
        req.user.uid
      );

      console.log('✅ [ConversationController] Detail retrieved');

      res.json({
        success: true,
        data: detail
      });
    } catch (error) {
      console.error('❌ [ConversationController] getConversationDetail error:', error.message);
      next(error);
    }
  }

  /**
   * Mark conversation as read
   * POST /api/conversations/:conversationId/read
   * 
   * 🔥 FIXED: Return complete data for FE to update UI
   */
  async markAsRead(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log('✅ [ConversationController] Marking as read:', conversationId, 'for user:', req.user.uid);
      
      const result = await conversationService.markAsRead(conversationId, req.user.uid);

      console.log('✅ [ConversationController] Marked as read successfully:', result);

      // 🔥 FIXED: Return data object with complete info
      res.json({
        success: true,
        message: 'Conversation marked as read',
        data: {
          conversationId: result.conversationId,
          unreadCount: result.unreadCount,
          lastSeenMessageId: result.lastSeenMessageId,
          lastSeenAt: result.lastSeenAt
        }
      });
    } catch (error) {
      console.error('❌ [ConversationController] markAsRead error:', error.message);
      next(error);
    }
  }
  
  /**
   * Leave group
   * POST /api/conversations/:conversationId/leave
   */
  async leaveGroup(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log('🚪 [ConversationController] User leaving group:', conversationId);
      
      const result = await conversationService.leaveGroup(
        conversationId,
        req.user.uid
      );

      console.log('✅ [ConversationController] User left group');

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ [ConversationController] leaveGroup error:', error.message);
      next(error);
    }
  }
  
  /**
   * Add members to group
   * POST /api/conversations/:conversationId/members
   */
  async addMembers(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { memberUids } = req.body;
      
      if (!memberUids || !Array.isArray(memberUids)) {
        return res.status(400).json({
          success: false,
          message: 'memberUids array is required'
        });
      }

      console.log('➕ [ConversationController] Adding members to:', conversationId);
      
      const result = await conversationService.addMembers(
        conversationId,
        req.user.uid,
        memberUids
      );

      console.log('✅ [ConversationController] Members added');

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ [ConversationController] addMembers error:', error.message);
      next(error);
    }
  }
  
  /**
   * Remove member from group
   * DELETE /api/conversations/:conversationId/members/:memberUid
   */
  async removeMember(req, res, next) {
    try {
      const { conversationId, memberUid } = req.params;

      console.log('➖ [ConversationController] Removing member:', memberUid);
      
      const result = await conversationService.removeMember(
        conversationId,
        req.user.uid,
        memberUid
      );

      console.log('✅ [ConversationController] Member removed');

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ [ConversationController] removeMember error:', error.message);
      next(error);
    }
  }

  // ============================================
  // 🔥 COUNTER METHODS - NEW
  // ============================================

  /**
   * Get conversation info with counters
   * GET /api/conversations/:conversationId/info
   * ✅ For Conversation Info modal
   */
  async getConversationInfo(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log('📊 [ConversationController] Getting info for:', conversationId);
      
      const info = await conversationService.getConversationInfo(conversationId);

      console.log('✅ [ConversationController] Info retrieved:', {
        totalMessages: info.statistics.totalMessages,
        sharedMedia: info.statistics.shared
      });

      res.json({
        success: true,
        data: info,
      });
    } catch (error) {
      console.error('❌ [ConversationController] getConversationInfo error:', error.message);
      next(error);
    }
  }

  /**
   * Rebuild all counters (Admin only)
   * POST /api/conversations/:conversationId/rebuild-counters
   * ✅ Use when counters are corrupted
   */
  async rebuildCounters(req, res, next) {
    try {
      const { conversationId } = req.params;

      // TODO: Check if user is admin
      // if (!req.user.isAdmin) {
      //   throw new Error('Unauthorized');
      // }

      console.log('🔧 [ConversationController] Rebuilding counters for:', conversationId);
      
      const conversation = await conversationService.rebuildCounters(conversationId);

      console.log('✅ [ConversationController] Counters rebuilt:', {
        totalMessages: conversation.totalMessages,
        sharedImages: conversation.sharedImages,
        sharedVideos: conversation.sharedVideos,
      });

      res.json({
        success: true,
        message: 'Counters rebuilt successfully',
        data: {
          conversationId,
          counters: {
            totalMessages: conversation.totalMessages,
            sharedImages: conversation.sharedImages,
            sharedVideos: conversation.sharedVideos,
            sharedAudios: conversation.sharedAudios,
            sharedFiles: conversation.sharedFiles,
            sharedLinks: conversation.sharedLinks,
          },
        },
      });
    } catch (error) {
      console.error('❌ [ConversationController] rebuildCounters error:', error.message);
      next(error);
    }
  }
}

export default new ConversationController();
// backend/controllers/conversation.controller.js
import conversationService from "../services/conversation.service.js";

class ConversationController {
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
        req.user.id,
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
        req.user.id,
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

      console.log('📥 [ConversationController] Getting conversations for user:', req.user.id);
      
      const conversations = await conversationService.getUserConversations(
        req.user.id,
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
        req.user.id
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
   * Leave group
   * POST /api/conversations/:conversationId/leave
   */
  async leaveGroup(req, res, next) {
    try {
      const { conversationId } = req.params;

      console.log('🚪 [ConversationController] User leaving group:', conversationId);
      
      const result = await conversationService.leaveGroup(
        conversationId,
        req.user.id
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
        req.user.id,
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
        req.user.id,
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
}

export default new ConversationController();
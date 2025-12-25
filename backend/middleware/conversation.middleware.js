// backend/middleware/conversation.middleware.js
import ConversationMember from "../models/ConversationMember.js";

/**
 * Check if user is an active member of a conversation
 * 
 * Usage:
 * router.get('/:conversationId', checkMembership, controller.method);
 * 
 * Sets req.conversationId for use in controller
 */
export const checkMembership = async (req, res, next) => {
  try {
    // Handle both :conversationId and :id params
    const { conversationId, id } = req.params;
    const targetConversationId = conversationId || id;

    if (!targetConversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required"
      });
    }

    console.log(`🔐 [Middleware] Checking membership: ${req.user.uid} → ${targetConversationId}`);

    // Check if user is active member
    const isMember = await ConversationMember.isActiveMember(
      targetConversationId,
      req.user.id
    );

    if (!isMember) {
      console.log(`❌ [Middleware] User ${req.user.uid} not a member of ${targetConversationId}`);
      return res.status(403).json({
        success: false,
        message: "Not a member of this conversation"
      });
    }

    console.log(`✅ [Middleware] Membership verified`);

    // Set conversationId for controller to use
    req.conversationId = targetConversationId;
    next();

  } catch (error) {
    console.error('❌ [Middleware] checkMembership error:', error.message);
    
    // Pass error to error handler middleware
    next(error);
  }
};

/**
 * Check if user is admin or owner of a conversation
 * 
 * Usage:
 * router.post('/:conversationId/members', checkAdminRole, controller.method);
 */
export const checkAdminRole = async (req, res, next) => {
  try {
    const { conversationId, id } = req.params;
    const targetConversationId = conversationId || id;

    if (!targetConversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required"
      });
    }

    console.log(`🔐 [Middleware] Checking admin role: ${req.user.uid} → ${targetConversationId}`);

    // Get member with role
    const member = await ConversationMember.findOne({
      conversation: targetConversationId,
      user: req.user.id,
      leftAt: null
    }).lean();

    if (!member) {
      console.log(`❌ [Middleware] User ${req.user.uid} not a member`);
      return res.status(403).json({
        success: false,
        message: "Not a member of this conversation"
      });
    }

    // Check if admin or owner
    if (!['admin', 'owner'].includes(member.role)) {
      console.log(`❌ [Middleware] User ${req.user.uid} not an admin (role: ${member.role})`);
      return res.status(403).json({
        success: false,
        message: "Admin or owner role required"
      });
    }

    console.log(`✅ [Middleware] Admin role verified (role: ${member.role})`);

    // Set for controller
    req.conversationId = targetConversationId;
    req.memberRole = member.role;
    next();

  } catch (error) {
    console.error('❌ [Middleware] checkAdminRole error:', error.message);
    next(error);
  }
};

/**
 * Check if user is owner of a conversation
 * 
 * Usage:
 * router.delete('/:conversationId', checkOwnerRole, controller.method);
 */
export const checkOwnerRole = async (req, res, next) => {
  try {
    const { conversationId, id } = req.params;
    const targetConversationId = conversationId || id;

    if (!targetConversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required"
      });
    }

    console.log(`🔐 [Middleware] Checking owner role: ${req.user.uid} → ${targetConversationId}`);

    // Get member with role
    const member = await ConversationMember.findOne({
      conversation: targetConversationId,
      user: req.user.id,
      leftAt: null
    }).lean();

    if (!member) {
      console.log(`❌ [Middleware] User ${req.user.uid} not a member`);
      return res.status(403).json({
        success: false,
        message: "Not a member of this conversation"
      });
    }

    // Check if owner
    if (member.role !== 'owner') {
      console.log(`❌ [Middleware] User ${req.user.uid} not owner (role: ${member.role})`);
      return res.status(403).json({
        success: false,
        message: "Owner role required"
      });
    }

    console.log(`✅ [Middleware] Owner role verified`);

    req.conversationId = targetConversationId;
    req.memberRole = member.role;
    next();

  } catch (error) {
    console.error('❌ [Middleware] checkOwnerRole error:', error.message);
    next(error);
  }
};
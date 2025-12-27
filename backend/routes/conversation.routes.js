// backend/routes/conversation.routes.js
import express from "express";
import conversationController from "../controllers/conversation.controller.js";
import auth from "../middleware/auth.js";
import { checkMembership } from "../middleware/conversation.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// ===========================
// 🔥 NEW: CHECK CONVERSATION
// ===========================

// Check if conversation exists with a friend
// GET /api/conversations/check/:friendId
// 
// ⚠️ IMPORTANT: This route MUST be BEFORE /:conversationId
// Otherwise Express will match "check" as conversationId
router.get('/check/:friendId', conversationController.checkConversation);

// ===========================
// CREATE CONVERSATIONS
// ===========================

// Create private conversation (1-1 chat)
// POST /api/conversations/private
router.post('/private', conversationController.createPrivate);

// Create group conversation
// POST /api/conversations/group
router.post('/group', conversationController.createGroup);

// ===========================
// GET CONVERSATIONS
// ===========================

// Get user's conversations (sidebar)
// GET /api/conversations
router.get('/', conversationController.getUserConversations);

// Get conversation detail
// GET /api/conversations/:conversationId
// ⚠️ This route must be AFTER /check/:friendId
router.get(
  '/:conversationId',
  checkMembership,
  conversationController.getConversationDetail
);

// ===========================
// MARK AS READ
// ===========================

// Mark conversation as read
// POST /api/conversations/:conversationId/read
router.post(
  '/:conversationId/read',
  checkMembership,
  conversationController.markAsRead
);

// ===========================
// MANAGE GROUP MEMBERS
// ===========================

// Leave group
// POST /api/conversations/:conversationId/leave
router.post(
  '/:conversationId/leave',
  checkMembership,
  conversationController.leaveGroup
);

// Add members to group
// POST /api/conversations/:conversationId/members
router.post(
  '/:conversationId/members',
  checkMembership,
  conversationController.addMembers
);

// Remove member from group
// DELETE /api/conversations/:conversationId/members/:memberUid
router.delete(
  '/:conversationId/members/:memberUid',
  checkMembership,
  conversationController.removeMember
);

export default router;
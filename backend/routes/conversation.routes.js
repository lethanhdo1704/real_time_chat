// backend/routes/conversation.routes.js
import express from "express";
import conversationController from "../controllers/conversation.controller.js";
import auth from "../middleware/auth.js";
import { checkMembership } from "../middleware/conversation.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

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
router.get(
  '/:conversationId',
  checkMembership,
  conversationController.getConversationDetail
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
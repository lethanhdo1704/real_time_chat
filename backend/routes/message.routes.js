// backend/routes/message.routes.js
import express from "express";
import messageController from "../controllers/message.controller.js";
import auth from "../middleware/auth.js";
import { checkMembership } from "../middleware/conversation.middleware.js";
import { sanitizeMessage, sanitizeFileMetadata } from "../middleware/sanitize.js";
import { messageLimiter, messageActionLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// ===========================
// CRITICAL: Specific routes MUST come before parameterized routes
// ===========================

// Mark conversation as read
// POST /api/messages/read
router.post('/read', messageController.markAsRead);

// Get last messages for multiple conversations (batch - for sidebar)
// POST /api/messages/last-messages
router.post('/last-messages', messageController.getLastMessages);

// ===========================
// MESSAGE CRUD
// ===========================

// Send message
// POST /api/messages
// Rate limited: 20 messages/minute per user
router.post(
  '/',
  messageLimiter,           // Rate limit
  sanitizeMessage,          // Sanitize content
  sanitizeFileMetadata,     // Sanitize attachments
  messageController.sendMessage
);

// Edit message
// PUT /api/messages/:messageId
// Rate limited: 10 edits/minute per user
router.put(
  '/:messageId',
  messageActionLimiter,     // Rate limit for edit/delete
  sanitizeMessage,          // Sanitize new content
  messageController.editMessage
);

// Delete message (soft delete)
// DELETE /api/messages/:messageId
// Rate limited: 10 deletes/minute per user
router.delete(
  '/:messageId',
  messageActionLimiter,     // Rate limit for edit/delete
  messageController.deleteMessage
);

// ===========================
// GET MESSAGES (must be last due to :conversationId param)
// ===========================

// Get messages with pagination
// GET /api/messages/:conversationId?before=messageId&limit=50
router.get(
  '/:conversationId',
  checkMembership,          // Verify user is member
  messageController.getMessages
);

export default router;
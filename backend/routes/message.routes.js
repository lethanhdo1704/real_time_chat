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
  messageLimiter,
  sanitizeMessage,
  sanitizeFileMetadata,
  messageController.sendMessage
);

// Edit message
// PUT /api/messages/:messageId
// Rate limited: 10 edits/minute per user
router.put(
  '/:messageId',
  messageActionLimiter,
  sanitizeMessage,
  messageController.editMessage
);

// ===========================
// 🆕 DELETE ACTIONS (3 TYPES + 1 ADMIN)
// ===========================

// KIỂU 1: Hide message (Gỡ tin nhắn - bất kỳ message nào)
// POST /api/messages/:messageId/hide
// Business rule: Anyone can hide any message from their view
// UI: "Tin nhắn đã được gỡ"
router.post(
  '/:messageId/hide',
  messageActionLimiter,
  messageController.hideMessage
);

// KIỂU 2: Delete for me (Xóa tin nhắn của chính mình - chỉ mình tôi thấy)
// DELETE /api/messages/:messageId/delete-for-me
// Business rule: Only sender can delete their own message from their view
// UI: "Bạn đã xóa tin nhắn này"
router.delete(
  '/:messageId/delete-for-me',
  messageActionLimiter,
  messageController.deleteForMe
);

// KIỂU 3: Recall message (Thu hồi - mọi người thấy)
// POST /api/messages/:messageId/recall
// Business rule: Only sender can recall within 15 minutes
// UI: "Tin nhắn đã được thu hồi" (shows to everyone)
router.post(
  '/:messageId/recall',
  messageActionLimiter,
  messageController.recallMessage
);

// PRIORITY 1: Admin delete (highest priority - permanent deletion)
// DELETE /api/messages/:messageId
// Business rule: Only admin/owner can permanently delete
// UI: Message disappears completely for everyone
// TODO: Add admin role check middleware if needed
router.delete(
  '/:messageId',
  messageActionLimiter,
  messageController.deleteMessage
);

// ===========================
// 🔥 NEW: CONVERSATION MEDIA
// ===========================

// Get conversation media (images/videos/audios/files/links)
// GET /api/messages/:conversationId/media?mediaType=image&before=xxx&limit=20
// 
// ⚠️ IMPORTANT: Must be BEFORE /:conversationId route to avoid conflict
router.get(
  '/:conversationId/media',
  checkMembership,
  messageController.getConversationMedia
);

// ===========================
// GET MESSAGES (must be last due to :conversationId param)
// ===========================

// Get messages with pagination
// GET /api/messages/:conversationId?before=messageId&limit=50
router.get(
  '/:conversationId',
  checkMembership,
  messageController.getMessages
);

export default router;
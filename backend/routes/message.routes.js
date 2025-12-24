// backend/routes/message.routes.js (UPDATED)
import express from "express";
import messageController from "../controllers/message.controller.js";
import auth from "../middleware/auth.js";
import { sanitizeMessage, sanitizeFileMetadata } from "../middleware/sanitize.js";
import { messageLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// ✅ Send message - with rate limiting and sanitization
router.post(
  '/', 
  messageLimiter,           // ← Rate limit: 20 messages/minute
  sanitizeMessage,          // ← Sanitize content
  sanitizeFileMetadata,     // ← Sanitize attachments
  messageController.sendMessage
);

// ✅ Get messages - with pagination
router.get('/:conversationId', messageController.getMessages);

// ✅ Mark as read
router.post('/read', messageController.markAsRead);

// ✅ Get last messages (batch)
router.post('/last-messages', messageController.getLastMessages);

// ✅ NEW: Edit message
router.put(
  '/:messageId',
  sanitizeMessage,          // ← Sanitize new content
  messageController.editMessage
);

// ✅ NEW: Delete message
router.delete('/:messageId', messageController.deleteMessage);

export default router;
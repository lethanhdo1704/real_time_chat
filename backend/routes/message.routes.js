// ===== routes/message.routes.js (REWRITE) =====
import express from "express";
import messageController from "../controllers/message.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.post('/', messageController.sendMessage);
router.get('/:conversationId', messageController.getMessages);
router.post('/read', messageController.markAsRead);

export default router;
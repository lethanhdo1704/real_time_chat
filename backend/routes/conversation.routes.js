// backend/routes/conversation.routes.js
import express from "express";
import conversationController from "../controllers/conversation.controller.js";
import auth from "../middleware/auth.js";
import { checkMembership } from "../middleware/conversation.middleware.js";

const router = express.Router();

router.use(auth);

router.post('/private', conversationController.createPrivate);
router.post('/group', conversationController.createGroup);
router.get('/', conversationController.getUserConversations);
router.get('/:id', checkMembership, conversationController.getConversationDetail);
router.post('/:id/leave', checkMembership, conversationController.leaveGroup);
router.post('/:id/members', checkMembership, conversationController.addMembers);
router.delete('/:id/members/:memberUid', checkMembership, conversationController.removeMember);

export default router;




// backend/routes/friend.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import friendController from "../controllers/friend.controller.js";

const router = express.Router();

// Friend request operations
router.post("/request", authMiddleware, friendController.sendRequest);
router.post("/accept", authMiddleware, friendController.acceptRequest);
router.post("/reject", authMiddleware, friendController.rejectRequest);
router.post("/cancel", authMiddleware, friendController.cancelRequest);
router.post("/unfriend", authMiddleware, friendController.unfriend);

// Friend list and status
router.get("/list", authMiddleware, friendController.getFriendsList);
router.get("/status/:friendUid", authMiddleware, friendController.getFriendStatus);

// 🔥 NEW: Notification tracking (seenAt)
router.patch("/requests/:requestId/seen", authMiddleware, friendController.markRequestAsSeen);
router.patch("/requests/seen-all", authMiddleware, friendController.markAllRequestsAsSeen);
router.get("/requests/unseen-count", authMiddleware, friendController.getUnseenRequestCount);

export default router;
// backend/routes/group.routes.js
import express from "express";
import groupController from "../controllers/group.controller.js";
import auth from "../middleware/auth.js";
import { checkMembership, checkAdminRole, checkOwnerRole } from "../middleware/conversation.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// ===========================
// NOTIFICATIONS
// ===========================

// Get notifications
router.get("/notifications", groupController.getNotifications);

// Get unread count
router.get("/notifications/unread-count", groupController.getUnreadCount);

// Mark all as read
router.post("/notifications/read-all", groupController.markAllNotificationsAsRead);

// Mark single notification as read
router.post("/notifications/:notificationId/read", groupController.markNotificationAsRead);

// ===========================
// INVITES
// ===========================

// Accept invite
router.post("/invites/:notificationId/accept", groupController.acceptInvite);

// Reject invite
router.post("/invites/:notificationId/reject", groupController.rejectInvite);

// ===========================
// JOIN REQUESTS
// ===========================

// Approve join request
router.post("/join-requests/:notificationId/approve", groupController.approveJoinRequest);

// Reject join request
router.post("/join-requests/:notificationId/reject", groupController.rejectJoinRequest);

// ===========================
// INVITE LINKS
// ===========================

// Join via link (public - no membership check)
router.post("/join/:code", groupController.joinViaLink);

// ===========================
// GROUP-SPECIFIC ACTIONS
// ===========================

// 🔥 NEW: Get group info (must be member)
router.get("/:conversationId", checkMembership, groupController.getGroupInfo);

// Invite users (any member can invite)
router.post("/:conversationId/invite", checkMembership, groupController.inviteUsers);

// Send join request (user not in group yet)
router.post("/:conversationId/join-request", groupController.sendJoinRequest);

// Create invite link (any member can create)
router.post("/:conversationId/invite-link", checkMembership, groupController.createInviteLink);

// Leave group (any member can leave)
router.post("/:conversationId/leave", checkMembership, groupController.leaveGroup);

// Kick member (admin/owner only)
router.delete("/:conversationId/members/:memberUid", checkAdminRole, groupController.kickMember);

// Change member role (owner only)
router.patch("/:conversationId/members/:memberUid/role", checkOwnerRole, groupController.changeMemberRole);

// Transfer ownership (owner only)
router.post("/:conversationId/transfer-ownership", checkOwnerRole, groupController.transferOwnership);

// Transfer ownership and leave (owner only)
router.post("/:conversationId/transfer-and-leave", checkOwnerRole, groupController.transferOwnershipAndLeave);

// Update group info (owner only)
router.patch("/:conversationId", checkOwnerRole, groupController.updateGroupInfo);

export default router;
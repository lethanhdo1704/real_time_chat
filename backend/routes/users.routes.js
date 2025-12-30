// backend/routes/users.routes.js
import express from "express";
import auth from "../middleware/auth.js";
import uploadAvatar, { handleAvatarUploadError } from "../middleware/uploadAvatar.js";
import userController from "../controllers/user.controller.js";
import avatarController from "../controllers/avatar.controller.js";
import { avatarUploadLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// ===== USER PROFILE ROUTES =====

/**
 * GET /api/users/me
 * Get current user info
 */
router.get("/me", auth, userController.getMe);

/**
 * GET /api/users/search?uid=...
 * Search user by UID
 */
router.get("/search", auth, userController.searchUser);

/**
 * PUT /api/users/me
 * Update user profile (nickname)
 */
router.put("/me", auth, userController.updateProfile);

// ===== AVATAR ROUTES =====

/**
 * PUT /api/users/me/avatar
 * Upload/Update avatar
 */
router.put(
  "/me/avatar",
  auth,
  avatarUploadLimiter,
  uploadAvatar.single('avatar'),
  handleAvatarUploadError,
  avatarController.uploadAvatar
);

/**
 * DELETE /api/users/me/avatar
 * Remove avatar
 */
router.delete("/me/avatar", auth, avatarController.removeAvatar);

export default router;
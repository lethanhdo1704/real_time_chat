// backend/controllers/avatar.controller.js
import avatarService from "../services/avatar.service.js";
import User from "../models/User.js";

class AvatarController {
  /**
   * Upload/Update avatar
   * PUT /api/users/me/avatar
   */
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "No avatar file provided" 
        });
      }

      console.log("📤 [Avatar] Uploading:", {
        uid: req.user.uid,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Delete old avatar if exists (to clean up R2 storage)
      const existingUser = await User.findOne({ uid: req.user.uid });
      if (existingUser?.avatar) {
        try {
          await avatarService.delete(req.user.uid);
        } catch (error) {
          console.warn("⚠️  Failed to delete old avatar:", error.message);
        }
      }

      // Process and upload to R2
      const avatarUrl = await avatarService.processAndSave(
        req.file.buffer,
        req.user.uid
      );

      // Update user record
      const user = await User.findOneAndUpdate(
        { uid: req.user.uid },
        { 
          avatar: avatarUrl, // Full R2 URL
          avatarUpdatedAt: new Date()
        },
        { new: true }
      ).select("-passwordHash");

      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      console.log("✅ [Avatar] Upload success:", avatarUrl);

      // 🔔 Unified socket event
      const socketEmitter = req.app.get('socketEmitter');
      if (socketEmitter) {
        socketEmitter.emitToUser(req.user.uid, 'user:update', {
          uid: user.uid,
          avatar: user.avatar,
          avatarUpdatedAt: user.avatarUpdatedAt
        });
      }

      res.json({
        success: true,
        message: "Avatar uploaded successfully",
        data: {
          uid: user.uid,
          nickname: user.nickname,
          avatar: user.avatar,
          avatarUpdatedAt: user.avatarUpdatedAt
        }
      });

    } catch (error) {
      console.error("❌ [Avatar] Upload error:", error);
      
      if (error.message === "Invalid image file") {
        return res.status(400).json({
          success: false,
          message: "Invalid image file. Please upload a valid image."
        });
      }

      if (error.message === "R2 storage is not enabled") {
        return res.status(503).json({
          success: false,
          message: "Avatar upload is temporarily unavailable"
        });
      }

      res.status(500).json({ 
        success: false,
        message: "Server error" 
      });
    }
  }

  /**
   * Remove avatar
   * DELETE /api/users/me/avatar
   */
  async removeAvatar(req, res) {
    try {
      const user = await User.findOne({ uid: req.user.uid });

      if (!user || !user.avatar) {
        return res.status(400).json({ 
          success: false,
          message: "No avatar to remove" 
        });
      }

      console.log("🗑️  [Avatar] Removing:", req.user.uid);

      // Delete from R2
      await avatarService.delete(req.user.uid);

      // Update DB
      user.avatar = "";
      user.avatarUpdatedAt = new Date();
      await user.save();

      console.log("✅ [Avatar] Removed");

      // 🔔 Unified socket event
      const socketEmitter = req.app.get('socketEmitter');
      if (socketEmitter) {
        socketEmitter.emitToUser(req.user.uid, 'user:update', {
          uid: user.uid,
          avatar: null,
          avatarUpdatedAt: user.avatarUpdatedAt
        });
      }

      res.json({
        success: true,
        message: "Avatar removed successfully"
      });

    } catch (error) {
      console.error("❌ [Avatar] Remove error:", error);
      res.status(500).json({ 
        success: false,
        message: "Server error" 
      });
    }
  }
}

export default new AvatarController();
// backend/controllers/user.controller.js
import User from "../models/User.js";

class UserController {
  /**
   * Get current user profile
   * GET /api/users/me
   */
  async getMe(req, res) {
    try {
      const user = await User.findOne({ uid: req.user.uid })
        .select("-passwordHash");

      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      res.json({
        success: true,
        data: {
          uid: user.uid,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
          avatarUpdatedAt: user.avatarUpdatedAt, // ⭐ For cache busting
          role: user.role,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error("❌ GET /users/me error:", error);
      res.status(500).json({ 
        success: false,
        message: "Server error" 
      });
    }
  }

  /**
   * Search user by UID
   * GET /api/users/search?uid=...
   */
  async searchUser(req, res) {
    try {
      const { uid } = req.query;
      
      if (!uid) {
        return res.status(400).json({ 
          success: false,
          message: "UID is required" 
        });
      }

      const user = await User.findOne({ uid }).select("-passwordHash");
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      res.json({
        success: true,
        data: {
          uid: user.uid,
          nickname: user.nickname,
          avatar: user.avatar,
          avatarUpdatedAt: user.avatarUpdatedAt,
          email: user.email
        }
      });
    } catch (error) {
      console.error("❌ GET /users/search error:", error);
      res.status(500).json({ 
        success: false,
        message: "Server error" 
      });
    }
  }

  /**
   * Update user profile (nickname)
   * PUT /api/users/me
   */
  async updateProfile(req, res) {
    try {
      const { nickname } = req.body;

      // Validation
      if (!nickname || nickname.trim().length === 0) {
        return res.status(400).json({ 
          success: false,
          message: "Nickname is required" 
        });
      }

      if (nickname.length > 50) {
        return res.status(400).json({ 
          success: false,
          message: "Nickname must be max 50 characters" 
        });
      }

      // Update user (NO lastSeen update here!)
      const user = await User.findOneAndUpdate(
        { uid: req.user.uid },
        {
          nickname: nickname.trim()
          // ✅ REMOVED: lastSeen update
        },
        { new: true }
      ).select("-passwordHash");

      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      }

      console.log(`✅ [Profile] Updated: ${req.user.uid} → ${nickname}`);

      // 🔔 Unified socket event
      const socketEmitter = req.app.get('socketEmitter');
      if (socketEmitter) {
        socketEmitter.emitToUser(req.user.uid, 'user:update', {
          uid: user.uid,
          nickname: user.nickname
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          uid: user.uid,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar
        }
      });

    } catch (error) {
      console.error("❌ [Profile] Update error:", error);
      res.status(500).json({ 
        success: false,
        message: "Server error" 
      });
    }
  }
}

export default new UserController();
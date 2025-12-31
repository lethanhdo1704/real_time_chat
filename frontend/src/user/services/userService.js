// frontend/src/services/userService.js
import api from "./api";

/**
 * User Service
 * Handles all user-related API calls
 */
class UserService {
  /**
   * Get current user profile
   * GET /api/users/me
   */
  async getMe() {
    try {
      const response = await api.get("/users/me");
      return response.data.data || response.data;
    } catch (error) {
      console.error("❌ [UserService] Get me failed:", error);
      throw error;
    }
  }

  /**
   * Update user profile (nickname)
   * PUT /api/users/me
   */
  async updateProfile(data) {
    try {
      const response = await api.put("/users/me", data);
      return response.data.data || response.data;
    } catch (error) {
      console.error("❌ [UserService] Update profile failed:", error);
      throw error;
    }
  }

  /**
   * Upload avatar
   * PUT /api/users/me/avatar
   */
  async uploadAvatar(formData) {
    try {
      const response = await api.put("/users/me/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error("❌ [UserService] Upload avatar failed:", error);
      throw error;
    }
  }

  /**
   * Remove avatar
   * DELETE /api/users/me/avatar
   */
  async removeAvatar() {
    try {
      const response = await api.delete("/users/me/avatar");
      return response.data;
    } catch (error) {
      console.error("❌ [UserService] Remove avatar failed:", error);
      throw error;
    }
  }

  /**
   * Search user by UID
   * GET /api/users/search?uid=...
   */
  async searchByUid(uid) {
    try {
      const response = await api.get(`/users/search?uid=${uid}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error("❌ [UserService] Search user failed:", error);
      throw error;
    }
  }
}

export default new UserService();
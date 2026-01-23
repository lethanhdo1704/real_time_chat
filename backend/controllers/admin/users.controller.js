// backend/controllers/admin/users.controller.js
import * as userAdminService from "../../services/admin/userAdmin.service.js";

/**
 * 📋 LIST USERS
 * GET /api/admin/users
 */
export const listUsers = async (req, res) => {
  try {
    // ✅ Lấy admin từ req.admin hoặc req.user (fallback)
    const admin = req.admin || req.user;
    
    if (!admin || !admin.role) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      });
    }

    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      role: req.query.role,
      q: req.query.q,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || "desc",
    };

    const adminRole = admin.role;
    const result = await userAdminService.listUsers(filters, adminRole);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ List users error:", error);

    if (error.message === "Permission denied: Cannot view super_admin users") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
};

/**
 * 👤 GET USER DETAIL
 * GET /api/admin/users/:id
 */
export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.admin || req.user;

    if (!admin || !admin.role) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      });
    }

    const adminRole = admin.role;
    const user = await userAdminService.getUserDetail(id, adminRole);

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: { user },
    });
  } catch (error) {
    console.error("❌ Get user detail error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Permission denied: Cannot view super_admin details") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
    });
  }
};

/**
 * 🚫 BAN USER
 * POST /api/admin/users/:id/ban
 * Body: { reason, banEndAt }
 */
export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, banEndAt } = req.body;

    const admin = req.admin || req.user;

    if (!admin || !admin.role) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      });
    }

    const adminId = admin._id;
    const adminRole = admin.role;

    const result = await userAdminService.banUser(
      id,
      adminId,
      { reason, banEndAt },
      adminRole
    );

    console.log(`✅ User banned: ${result.email} by admin ${admin.email}`);

    return res.status(200).json({
      success: true,
      message: "User banned successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Ban user error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "User is already banned" ||
      error.message === "Cannot ban admin users"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to ban user",
    });
  }
};

/**
 * ✅ UNBAN USER
 * POST /api/admin/users/:id/unban
 */
export const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.admin || req.user;

    if (!admin || !admin.role) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      });
    }

    const adminRole = admin.role;
    const result = await userAdminService.unbanUser(id, adminRole);

    console.log(`✅ User unbanned: ${result.email} by admin ${admin.email}`);

    return res.status(200).json({
      success: true,
      message: "User unbanned successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Unban user error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "User is not banned") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Permission denied: Cannot unban super_admin") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to unban user",
    });
  }
};

/**
 * 🗑️ DELETE USER (SOFT)
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.admin || req.user;

    if (!admin || !admin.role) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      });
    }

    const adminId = admin._id;
    const adminRole = admin.role;

    const result = await userAdminService.deleteUser(id, adminId, adminRole);

    console.log(`✅ User deleted: ${result.email} by admin ${admin.email}`);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Delete user error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "User is already deleted" ||
      error.message === "Cannot delete admin users"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

/**
 * ♻️ RESTORE USER
 * POST /api/admin/users/:id/restore
 */
export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.admin || req.user;

    if (!admin || !admin.role) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      });
    }

    const adminRole = admin.role;
    const result = await userAdminService.restoreUser(id, adminRole);

    console.log(`✅ User restored: ${result.email} by admin ${admin.email}`);

    return res.status(200).json({
      success: true,
      message: "User restored successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Restore user error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "User is not deleted") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Permission denied: Cannot restore super_admin") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to restore user",
    });
  }
};

/**
 * 🔄 UPDATE USER ROLE (SUPER_ADMIN ONLY)
 * PATCH /api/admin/users/:id/role
 * Body: { role }
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const admin = req.admin || req.user;

    if (!admin || !admin.role) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      });
    }

    const adminRole = admin.role;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    const result = await userAdminService.updateUserRole(id, role, adminRole);

    console.log(
      `✅ User role updated: ${result.email} → ${result.role} by ${admin.email}`
    );

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("❌ Update user role error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Only super_admin can change user roles") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "Invalid role" ||
      error.message === "Cannot promote users to super_admin role"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

/**
 * 📊 GET USER STATISTICS
 * GET /api/admin/users/statistics
 */
export const getUserStatistics = async (req, res) => {
  try {
    const admin = req.admin || req.user;

    if (!admin || !admin.role) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required',
      });
    }

    const adminRole = admin.role;
    const stats = await userAdminService.getUserStatistics(adminRole);

    return res.status(200).json({
      success: true,
      message: "Statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("❌ Get user statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve statistics",
    });
  }
};
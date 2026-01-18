// backend/controllers/group/group.notification.controller.js
import GroupNotification from "../../models/GroupNotification.js";

class GroupNotificationController {
  /**
   * Get group notifications
   * GET /api/groups/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const { limit = 20, skip = 0, type } = req.query;

      console.log(
        `📬 [GroupNotificationController] Getting notifications for ${req.user.uid}`
      );

      const notifications = await GroupNotification.getUserNotifications(
        req.user.id,
        {
          limit: parseInt(limit),
          skip: parseInt(skip),
          type,
        }
      );

      res.json({
        success: true,
        data: { notifications },
      });
    } catch (error) {
      console.error(
        "❌ [GroupNotificationController] getNotifications error:",
        error.message
      );
      next(error);
    }
  }

  /**
   * Mark notification as read
   * POST /api/groups/notifications/:notificationId/read
   */
  async markNotificationAsRead(req, res, next) {
    try {
      const { notificationId } = req.params;

      await GroupNotification.markAsRead([notificationId], req.user.id);

      res.json({
        success: true,
      });
    } catch (error) {
      console.error(
        "❌ [GroupNotificationController] markNotificationAsRead error:",
        error.message
      );
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * POST /api/groups/notifications/read-all
   */
  async markAllNotificationsAsRead(req, res, next) {
    try {
      await GroupNotification.markAllAsRead(req.user.id);

      res.json({
        success: true,
      });
    } catch (error) {
      console.error(
        "❌ [GroupNotificationController] markAllNotificationsAsRead error:",
        error.message
      );
      next(error);
    }
  }

  /**
   * Get unread notification count
   * GET /api/groups/notifications/unread-count
   */
  async getUnreadCount(req, res, next) {
    try {
      const count = await GroupNotification.getUnreadCount(req.user.id);

      res.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error(
        "❌ [GroupNotificationController] getUnreadCount error:",
        error.message
      );
      next(error);
    }
  }
}

export default new GroupNotificationController();
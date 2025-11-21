import { Router } from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notification-controller";
import { authenticateToken } from "../middlewares/auth-middleware";

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

router.get("/", getUserNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:notification_id/read", markNotificationAsRead);
router.patch("/read-all", markAllNotificationsAsRead);
router.delete("/:notification_id", deleteNotification);

export default router;


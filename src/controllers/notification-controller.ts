import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { convertBigIntToString } from '../utils/main';

const prisma = new PrismaClient();

// Get User Notifications
export async function getUserNotifications(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { page = 1, limit = 20, is_read } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required" });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { user_id: BigInt(userId) };

    if (is_read !== undefined) {
      where.is_read = is_read === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        include: {
          business: {
            select: {
              business_id: true,
              business_name: true,
              display_name: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: Number(limit),
        skip,
      }),
      prisma.notifications.count({ where }),
    ]);

    const safeNotifications = convertBigIntToString(notifications);
    res.json({
      message: "Notifications fetched successfully",
      notifications: safeNotifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch notifications" });
  }
}

// Mark Notification as Read
export async function markNotificationAsRead(req: Request, res: Response) {
  try {
    const { notification_id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required" });
    }

    const notification = await prisma.notifications.findUnique({
      where: { notification_id: BigInt(notification_id) },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.user_id.toString() !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.notifications.update({
      where: { notification_id: BigInt(notification_id) },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    const safeNotification = convertBigIntToString(updated);
    res.json({
      message: "Notification marked as read",
      notification: safeNotification,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to mark notification as read" });
  }
}

// Mark All Notifications as Read
export async function markAllNotificationsAsRead(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required" });
    }

    await prisma.notifications.updateMany({
      where: {
        user_id: BigInt(userId),
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    res.json({ message: "All notifications marked as read" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to mark notifications as read" });
  }
}

// Delete Notification
export async function deleteNotification(req: Request, res: Response) {
  try {
    const { notification_id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required" });
    }

    const notification = await prisma.notifications.findUnique({
      where: { notification_id: BigInt(notification_id) },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.user_id.toString() !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.notifications.delete({
      where: { notification_id: BigInt(notification_id) },
    });

    res.json({ message: "Notification deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete notification" });
  }
}

// Get Unread Count
export async function getUnreadCount(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID is required" });
    }

    const count = await prisma.notifications.count({
      where: {
        user_id: BigInt(userId),
        is_read: false,
      },
    });

    res.json({
      message: "Unread count fetched successfully",
      unread_count: count,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get unread count" });
  }
}


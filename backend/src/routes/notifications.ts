import express from 'express';
import { logger } from '../utils/logger';
import NotificationService from '../services/notificationService';

const router = express.Router();

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const notifications = await NotificationService.getUserNotifications(userId);

    return res.json({
      success: true,
      data: {
        notifications,
        count: notifications.length,
      },
    });
  } catch (error) {
    logger.error('Error getting notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
    });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const success = await NotificationService.markAsRead(id);

    if (success) {
      return res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

// Send test notification
router.post('/test', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const success = await NotificationService.sendSystemAlert(
      userId,
      'This is a test notification'
    );

    return res.json({
      success,
      message: success ? 'Test notification sent' : 'Failed to send test notification',
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
    });
  }
});

export default router;

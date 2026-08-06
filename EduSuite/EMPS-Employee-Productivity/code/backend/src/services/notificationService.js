const Notification = require('../models/Notification');
const admin = require('../config/firebase');

class NotificationService {
  async createNotification(data) {
    try {
      const notification = new Notification({
        recipient: data.recipient,
        sender: data.sender,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        link: data.link,
        priority: data.priority || 'medium',
        channels: data.channels || ['in-app'],
        sentAt: new Date()
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      return null;
    }
  }

  async sendPushNotification(recipientId, title, body, data) {
    try {
      const user = await User.findById(recipientId);
      if (!user || !user.fcmToken) return;

      const message = {
        notification: {
          title,
          body
        },
        data: data || {},
        token: user.fcmToken
      };

      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('Push notification error:', error);
      return null;
    }
  }

  async sendBulkNotifications(recipients, notificationData) {
    const notifications = [];
    for (const recipient of recipients) {
      const notification = await this.createNotification({
        ...notificationData,
        recipient
      });
      notifications.push(notification);
    }
    return notifications;
  }

  async getUnreadNotifications(userId) {
    return Notification.find({
      recipient: userId,
      isRead: false,
      isDeleted: false
    })
    .populate('sender', 'firstName lastName employeeId')
    .sort({ createdAt: -1 });
  }

  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return Notification.updateMany(
      { recipient: userId, isRead: false, isDeleted: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async deleteNotification(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isDeleted: true },
      { new: true }
    );
  }

  async getNotificationCounts(userId) {
    const unread = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
      isDeleted: false
    });

    const total = await Notification.countDocuments({
      recipient: userId,
      isDeleted: false
    });

    return { unread, total };
  }
}

module.exports = new NotificationService();
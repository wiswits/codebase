const Notification = require('../models/Notification');
const { emitToUser } = require('../utils/socketHelpers');

module.exports = (io, socket) => {
  const handleGetNotifications = async (data) => {
    try {
      const { limit = 50, isRead } = data;
      
      const query = {
        recipient: socket.user._id,
        isDeleted: false
      };
      
      if (isRead !== undefined) {
        query.isRead = isRead;
      }
      
      const notifications = await Notification.find(query)
        .populate('sender', 'firstName lastName employeeId')
        .sort({ createdAt: -1 })
        .limit(limit);
      
      const unreadCount = await Notification.countDocuments({
        recipient: socket.user._id,
        isRead: false,
        isDeleted: false
      });
      
      socket.emit('notifications', {
        notifications,
        unreadCount,
        total: notifications.length
      });
      
    } catch (error) {
      console.error('Get notifications error:', error);
      socket.emit('error', { message: 'Failed to get notifications' });
    }
  };
  
  const handleMarkNotificationRead = async (data) => {
    try {
      const { notificationId } = data;
      
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipient: socket.user._id
        },
        {
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );
      
      if (!notification) {
        return socket.emit('error', { message: 'Notification not found' });
      }
      
      const unreadCount = await Notification.countDocuments({
        recipient: socket.user._id,
        isRead: false,
        isDeleted: false
      });
      
      socket.emit('notification_read', {
        notification,
        unreadCount
      });
      
    } catch (error) {
      console.error('Mark notification read error:', error);
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  };
  
  const handleMarkAllRead = async () => {
    try {
      await Notification.updateMany(
        {
          recipient: socket.user._id,
          isRead: false,
          isDeleted: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );
      
      const unreadCount = await Notification.countDocuments({
        recipient: socket.user._id,
        isRead: false,
        isDeleted: false
      });
      
      socket.emit('all_read', { unreadCount });
      
    } catch (error) {
      console.error('Mark all read error:', error);
      socket.emit('error', { message: 'Failed to mark all as read' });
    }
  };
  
  const handleDeleteNotification = async (data) => {
    try {
      const { notificationId } = data;
      
      const notification = await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          recipient: socket.user._id
        },
        { isDeleted: true },
        { new: true }
      );
      
      if (!notification) {
        return socket.emit('error', { message: 'Notification not found' });
      }
      
      socket.emit('notification_deleted', { notificationId });
      
    } catch (error) {
      console.error('Delete notification error:', error);
      socket.emit('error', { message: 'Failed to delete notification' });
    }
  };
  
  const handleGetUnreadCount = async () => {
    try {
      const unreadCount = await Notification.countDocuments({
        recipient: socket.user._id,
        isRead: false,
        isDeleted: false
      });
      
      socket.emit('unread_count', { unreadCount });
      
    } catch (error) {
      console.error('Get unread count error:', error);
      socket.emit('error', { message: 'Failed to get unread count' });
    }
  };
  
  socket.on('get_notifications', handleGetNotifications);
  socket.on('mark_notification_read', handleMarkNotificationRead);
  socket.on('mark_all_read', handleMarkAllRead);
  socket.on('delete_notification', handleDeleteNotification);
  socket.on('get_unread_count', handleGetUnreadCount);
};
const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find().populate("product", "name").sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  notification.isRead = true;
  await notification.save();
  res.json(notification);
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ isRead: false }, { isRead: true });
  res.json({ message: "All notifications marked as read" });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  await notification.deleteOne();
  res.json({ message: "Notification removed" });
});

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };

const NotificationService = require('../services/NotificationService');

exports.getAll = async (req, res, next) => {
  try {
    const data = await NotificationService.getUserNotifications(req.userId, req.query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await NotificationService.getUnreadCount(req.userId);
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id, req.userId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const count = await NotificationService.markAllAsRead(req.userId);
    res.json({ success: true, message: 'All notifications marked as read', data: { count } });
  } catch (error) {
    next(error);
  }
};

exports.archive = async (req, res, next) => {
  try {
    const notification = await NotificationService.archive(req.params.id, req.userId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

exports.archiveAll = async (req, res, next) => {
  try {
    await NotificationService.archiveAll(req.userId);
    res.json({ success: true, message: 'All notifications archived' });
  } catch (error) {
    next(error);
  }
};
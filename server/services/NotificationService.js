const Notification = require('../models/Notification');

class NotificationService {
  async getUserNotifications(userId, query = {}) {
    const filter = { recipient: userId, isArchived: false };
    if (query.unreadOnly) {
      filter.isRead = false;
    }
    if (query.type) {
      filter.type = query.type;
    }

    const limit = Math.min(parseInt(query.limit) || 50, 100);
    const skip = parseInt(query.skip) || 0;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
      isArchived: false,
    });

    const totalCount = await Notification.countDocuments(filter);

    return { notifications, unreadCount, totalCount, hasMore: skip + limit < totalCount };
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  }

  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result.modifiedCount;
  }

  async archive(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isArchived: true },
      { new: true }
    );
    return notification;
  }

  async archiveAll(userId) {
    await Notification.updateMany(
      { recipient: userId },
      { isArchived: true }
    );
  }

  async create(data) {
    const notification = await Notification.create(data);
    return notification;
  }

  async createAndEmit(data, io) {
    const notification = await Notification.create(data);
    if (io) {
      io.to(`user:${data.recipient}`).emit('notification', notification);
    }
    return notification;
  }

  async bulkCreate(notifications) {
    return Notification.insertMany(notifications);
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({
      recipient: userId,
      isRead: false,
      isArchived: false,
    });
  }

  async deleteOldNotifications(daysOld = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    await Notification.deleteMany({
      createdAt: { $lt: cutoff },
      isRead: true,
    });
  }
}

module.exports = new NotificationService();
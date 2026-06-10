const cron = require('node-cron');
const Bug = require('../models/Bug');
const Notification = require('../models/Notification');
const User = require('../models/User');

const startCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bugsDue = await Bug.find({
        dueDate: { $lte: tomorrow, $gte: new Date() },
        status: { $nin: ['resolved', 'closed'] },
      }).populate('assignee');

      for (const bug of bugsDue) {
        if (bug.assignee) {
          await Notification.create({
            recipient: bug.assignee._id,
            type: 'deadline_reminder',
            title: 'Deadline Approaching',
            message: `Bug "${bug.title}" is due tomorrow`,
            data: { projectId: bug.project, bugId: bug._id.toString() },
          });
        }
      }
    } catch (error) {
      console.error('Deadline check cron error:', error);
    }
  });

  cron.schedule('0 0 * * *', async () => {
    try {
      const RefreshToken = require('../models/RefreshToken');
      await RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
    } catch (error) {
      console.error('Token cleanup cron error:', error);
    }
  });

  console.log('Cron jobs started');
};

module.exports = { startCronJobs };

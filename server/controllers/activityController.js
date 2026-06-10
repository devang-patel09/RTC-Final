const ActivityService = require('../services/ActivityService');

exports.getByProject = async (req, res, next) => {
  try {
    const activities = await ActivityService.getByProject(req.params.projectId, req.query);
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

exports.getByBug = async (req, res, next) => {
  try {
    const activities = await ActivityService.getByBug(req.params.bugId);
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

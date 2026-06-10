const AnalyticsService = require('../services/AnalyticsService');

exports.getProjectAnalytics = async (req, res, next) => {
  try {
    const analytics = await AnalyticsService.getProjectAnalytics(req.params.projectId, req.query);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

exports.getOrgAnalytics = async (req, res, next) => {
  try {
    const orgId = req.params.orgId || req.user.organizationId;
    const analytics = await AnalyticsService.getOrgAnalytics(orgId, req.query);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

exports.getUserAnalytics = async (req, res, next) => {
  try {
    const analytics = await AnalyticsService.getUserAnalytics(req.user.id, req.query);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};

exports.getSprintAnalytics = async (req, res, next) => {
  try {
    const analytics = await AnalyticsService.getSprintAnalytics(req.params.sprintId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};
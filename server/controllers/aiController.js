const AiService = require('../services/AiService');
const Bug = require('../models/Bug');
const Sprint = require('../models/Sprint');

exports.explainBug = async (req, res, next) => {
  try {
    const result = await AiService.explainBug(req.body, req.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.suggestFix = async (req, res, next) => {
  try {
    const result = await AiService.suggestFix(req.body, req.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.generateReleaseNotes = async (req, res, next) => {
  try {
    const { sprintId } = req.body;
    let sprintData = { name: 'Unscheduled', completedBugs: [], completedTasks: [] };

    if (sprintId) {
      const sprint = await Sprint.findById(sprintId);
      if (sprint) {
        const completedBugs = await Bug.find({
          sprint: sprintId,
          status: { $in: ['resolved', 'closed'] },
        }).select('title severity');
        sprintData = { name: sprint.name, completedBugs, completedTasks: [] };
      }
    }

    const result = await AiService.generateReleaseNotes(sprintData, req.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.detectPriority = async (req, res, next) => {
  try {
    const result = await AiService.detectPriority(req.body, req.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.generateSummary = async (req, res, next) => {
  try {
    const result = await AiService.generateSummary(req.body, req.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.chat = async (req, res, next) => {
  try {
    const result = await AiService.chat(req.body.prompt, req.body.context, req.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.chatStream = async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const stream = AiService.chatStream(req.query.prompt, req.query.context, req.userId);
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
};

exports.getUsage = async (req, res, next) => {
  try {
    const AiUsage = require('../models/AiUsage');
    const usage = await AiUsage.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: usage });
  } catch (error) {
    next(error);
  }
};

exports.getCacheStats = async (req, res, next) => {
  try {
    const stats = AiService.getCacheStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

exports.clearCache = async (req, res, next) => {
  try {
    AiService.clearCache();
    res.json({ success: true, message: 'AI cache cleared' });
  } catch (error) {
    next(error);
  }
};
const BugService = require('../services/BugService');
const AiService = require('../services/AiService');
const cloudinary = require('../config/cloudinary');

exports.create = async (req, res, next) => {
  try {
    const bug = await BugService.create({ ...req.validatedBody, project: req.params.projectId }, req.userId);
    req.app.get('io').to(`project:${req.params.projectId}`).emit('bug_created', bug);
    res.status(201).json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    const bugs = await BugService.getAll(req.params.projectId, req.query);
    res.json({ success: true, data: bugs });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const bug = await BugService.getById(req.params.bugId);
    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const bug = await BugService.update(req.params.bugId, req.validatedBody, req.userId);
    req.app.get('io').to(`project:${bug.project}`).emit('bug_updated', bug);
    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.delete = async (req, res, next) => {
  try {
    const bug = await BugService.getById(req.params.bugId);
    await BugService.delete(req.params.bugId, req.userId);
    req.app.get('io').to(`project:${bug.project}`).emit('bug_updated', { project: bug.project, deleted: true, id: req.params.bugId });
    res.json({ success: true, message: 'Bug deleted' });
  } catch (error) {
    next(error);
  }
};

exports.addAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'bug-tracker',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const bug = await BugService.addAttachment(
      req.params.bugId,
      {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      req.userId
    );

    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.removeAttachment = async (req, res, next) => {
  try {
    const bug = await BugService.removeAttachment(req.params.bugId, req.params.attachmentId, req.userId);
    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.reorder = async (req, res, next) => {
  try {
    await BugService.reorder(req.params.projectId, req.body.orderedIds);
    req.app.get('io').to(`project:${req.params.projectId}`).emit('card_moved', { projectId: req.params.projectId, orderedIds: req.body.orderedIds });
    res.json({ success: true, message: 'Bugs reordered' });
  } catch (error) {
    next(error);
  }
};

exports.explainWithAI = async (req, res, next) => {
  try {
    const bug = await BugService.getById(req.params.bugId);
    const result = await AiService.explainBug({
      title: bug.title,
      description: bug.description,
      stepsToReproduce: bug.stepsToReproduce,
      expectedBehavior: bug.expectedBehavior,
      actualBehavior: bug.actualBehavior,
      severity: bug.severity,
      errorMessage: req.body.errorMessage,
      stackTrace: req.body.stackTrace,
    }, req.userId);

    bug.aiExplanation = {
      rootCause: result.rootCause,
      impact: result.impact,
      explanation: result.explanation,
      recommendedActions: result.recommendedActions,
      generatedAt: new Date(),
    };
    await bug.save();

    res.json({ success: true, data: bug.aiExplanation });
  } catch (error) {
    next(error);
  }
};

exports.suggestFixWithAI = async (req, res, next) => {
  try {
    const bug = await BugService.getById(req.params.bugId);
    const result = await AiService.suggestFix({
      title: bug.title,
      description: bug.description,
      rootCause: bug.aiExplanation?.rootCause,
      severity: bug.severity,
    }, req.userId);

    bug.aiFixSuggestions = (result.possibleFixes || []).map(fix => ({
      description: fix.description,
      codeSnippet: fix.codeSnippet,
      filePath: fix.filePath,
      preventionTip: (result.preventionTips || []).join(', '),
      generatedAt: new Date(),
    }));
    await bug.save();

    res.json({ success: true, data: { fixes: bug.aiFixSuggestions, preventionTips: result.preventionTips } });
  } catch (error) {
    next(error);
  }
};

exports.detectPriority = async (req, res, next) => {
  try {
    const bug = await BugService.getById(req.params.bugId);
    const result = await AiService.detectPriority({
      title: bug.title,
      description: bug.description,
      severity: bug.severity,
    }, req.userId);

    if (result.confidence > 0.8) {
      bug.priority = result.priority;
      bug.priorityConfidence = result.confidence;
      await bug.save();
    }

    res.json({
      success: true,
      data: {
        suggestedPriority: result.priority,
        confidence: result.confidence,
        reasoning: result.reasoning,
        autoApplied: result.confidence > 0.8,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.addSubtask = async (req, res, next) => {
  try {
    const bug = await BugService.addSubtask(req.params.bugId, req.body, req.userId);
    req.app.get('io').to(`project:${req.params.projectId}`).emit('bug_updated', bug);
    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.updateSubtask = async (req, res, next) => {
  try {
    const bug = await BugService.updateSubtask(req.params.bugId, req.params.subtaskId, req.body, req.userId);
    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.deleteSubtask = async (req, res, next) => {
  try {
    const bug = await BugService.deleteSubtask(req.params.bugId, req.params.subtaskId, req.userId);
    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.addWatcher = async (req, res, next) => {
  try {
    const bug = await BugService.addWatcher(req.params.bugId, req.userId);
    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.removeWatcher = async (req, res, next) => {
  try {
    const bug = await BugService.removeWatcher(req.params.bugId, req.userId);
    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.addLabel = async (req, res, next) => {
  try {
    const bug = await BugService.addLabel(req.params.bugId, req.body.label);
    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.removeLabel = async (req, res, next) => {
  try {
    const bug = await BugService.removeLabel(req.params.bugId, req.params.label);
    res.json({ success: true, data: bug });
  } catch (error) {
    next(error);
  }
};

exports.getLabels = async (req, res, next) => {
  try {
    const labels = await BugService.getProjectLabels(req.params.projectId);
    res.json({ success: true, data: labels });
  } catch (error) {
    next(error);
  }
};

exports.getTags = async (req, res, next) => {
  try {
    const tags = await BugService.getProjectTags(req.params.projectId);
    res.json({ success: true, data: tags });
  } catch (error) {
    next(error);
  }
};

exports.bulkUpdate = async (req, res, next) => {
  try {
    const { bugIds, data } = req.body;
    const results = await BugService.bulkUpdate(req.params.projectId, bugIds, data, req.userId);
    req.app.get('io').to(`project:${req.params.projectId}`).emit('bug_bulk_updated', { bugIds, data });
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

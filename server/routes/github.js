const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const GithubIntegration = require('../models/GithubIntegration');
const Bug = require('../models/Bug');
const Project = require('../models/Project');
const { AppError } = require('../utils/errors');
const { encrypt } = require('../utils/encryption');

router.post('/webhook', async (req, res) => {
  try {
    const { action, pull_request } = req.body;

    if (pull_request && action === 'closed' && pull_request.merged) {
      const repoFull = pull_request.base.repo.full_name;
      const integration = await GithubIntegration.findOne({
        repoFullName: repoFull,
        isActive: true,
      });

      if (integration) {
        const prBody = pull_request.body || '';
        const bugIdMatch = prBody.match(/BUG-(\w+)/i) || prBody.match(/#(\w+)/);
        if (bugIdMatch) {
          const bug = await Bug.findById(bugIdMatch[1]);
          if (bug) {
            bug.status = 'resolved';
            bug.githubIssue = {
              ...bug.githubIssue,
              prNumber: pull_request.number,
              prMerged: true,
            };
            await bug.save();
          }
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ success: true });
  }
});

router.use(authenticate);

router.post('/connect', async (req, res, next) => {
  try {
    const { projectId, repoFullName, repoUrl, accessToken } = req.body;
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);

    const integration = await GithubIntegration.create({
      user: req.userId,
      project: projectId,
      repoFullName,
      repoUrl,
      accessToken: encrypt(accessToken),
      isActive: true,
    });

    project.githubRepo = { fullName: repoFullName };
    await project.save();

    res.json({ success: true, data: integration });
  } catch (error) {
    next(error);
  }
});

router.get('/:projectId', async (req, res, next) => {
  try {
    const integration = await GithubIntegration.findOne({
      project: req.params.projectId,
      isActive: true,
    }).select('-accessToken');
    res.json({ success: true, data: integration });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

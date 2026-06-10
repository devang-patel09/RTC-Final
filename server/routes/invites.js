const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const inviteController = require('../controllers/inviteController');

router.post('/accept', authenticate, inviteController.accept);
router.get('/:token', inviteController.getByToken);

module.exports = router;
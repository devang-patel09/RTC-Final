const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createCommentSchema, updateCommentSchema } = require('../validators/comment');
const commentController = require('../controllers/commentController');

router.use(authenticate);

router.route('/')
  .post(validate(createCommentSchema), commentController.create)
  .get(commentController.getByBug);

router.route('/:commentId')
  .patch(validate(updateCommentSchema), commentController.update)
  .delete(commentController.delete);

router.post('/:commentId/reactions', commentController.addReaction);
router.delete('/:commentId/reactions/:emoji', commentController.removeReaction);

module.exports = router;

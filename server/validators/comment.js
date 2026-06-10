const { z } = require('zod');

const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(5000),
  parentComment: z.string().optional(),
  mentions: z.array(z.string()).optional(),
});

const updateCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(5000),
});

module.exports = { createCommentSchema, updateCommentSchema };

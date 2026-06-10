const { z } = require('zod');

const acceptanceCriteriaSchema = z.object({
  description: z.string().min(1),
  satisfied: z.boolean().optional(),
});

const createStorySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee: z.string().optional(),
  sprint: z.string().optional(),
  storyPoints: z.number().min(0).optional(),
  labels: z.array(z.string()).optional(),
  acceptanceCriteria: z.array(acceptanceCriteriaSchema).optional(),
  dependencies: z.array(z.object({
    dependsOn: z.string(),
    type: z.enum(['blocks', 'blocked_by', 'related']).optional(),
  })).optional(),
});

const updateStorySchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee: z.string().nullable().optional(),
  sprint: z.string().nullable().optional(),
  storyPoints: z.number().min(0).optional(),
  labels: z.array(z.string()).optional(),
  acceptanceCriteria: z.array(acceptanceCriteriaSchema).optional(),
  dependencies: z.array(z.object({
    dependsOn: z.string(),
    type: z.enum(['blocks', 'blocked_by', 'related']).optional(),
  })).optional(),
  order: z.number().optional(),
});

module.exports = { createStorySchema, updateStorySchema };
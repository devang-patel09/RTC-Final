const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(['task', 'story', 'subtask']).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  sprint: z.string().optional(),
  parentTask: z.string().optional(),
  storyPoints: z.number().min(0).optional(),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
  order: z.number().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(5000).optional(),
  type: z.enum(['task', 'story', 'subtask']).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assignee: z.string().nullable().optional(),
  assignees: z.array(z.string()).nullable().optional(),
  sprint: z.string().nullable().optional(),
  parentTask: z.string().nullable().optional(),
  storyPoints: z.number().min(0).optional(),
  estimatedHours: z.number().min(0).optional(),
  dueDate: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  order: z.number().optional(),
});

module.exports = { createTaskSchema, updateTaskSchema };
const { z } = require('zod');

const createBugSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  severity: z.enum(['critical', 'major', 'minor', 'trivial']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'resolved', 'closed']).optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  sprint: z.string().optional(),
});

const updateBugSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(5000).optional(),
  stepsToReproduce: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  severity: z.enum(['critical', 'major', 'minor', 'trivial']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'resolved', 'closed']).optional(),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  sprint: z.string().nullable().optional(),
  order: z.number().optional(),
  version: z.number().optional(),
});

module.exports = { createBugSchema, updateBugSchema };

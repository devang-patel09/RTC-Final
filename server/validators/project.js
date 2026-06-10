const { z } = require('zod');

const createProjectSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const updateProjectSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
});

module.exports = { createProjectSchema, updateProjectSchema };

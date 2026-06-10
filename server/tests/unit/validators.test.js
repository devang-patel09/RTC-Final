const { createBugSchema, updateBugSchema } = require('../../validators/bug');
const { createProjectSchema, updateProjectSchema } = require('../../validators/project');
const { createSprintSchema } = require('../../validators/sprint');
const { createTaskSchema } = require('../../validators/task');
const { createStorySchema } = require('../../validators/story');

describe('Bug Validators', () => {
  describe('createBugSchema', () => {
    it('passes with valid data', () => {
      const data = { title: 'Test Bug', description: 'A bug', project: '507f1f77bcf86cd799439011' };
      const result = createBugSchema.parse(data);
      expect(result.title).toBe('Test Bug');
    });

    it('rejects missing title', () => {
      expect(() => createBugSchema.parse({ description: 'No title' })).toThrow();
    });

    it('rejects short titles', () => {
      expect(() => createBugSchema.parse({ title: 'AB', description: 'desc' })).toThrow();
    });

    it('rejects invalid status', () => {
      expect(() => createBugSchema.parse({ title: 'Valid Title', description: 'desc', status: 'invalid_status' })).toThrow();
    });

    it('rejects invalid priority', () => {
      expect(() => createBugSchema.parse({ title: 'Title', description: 'desc', priority: 'urgent' })).toThrow();
    });
  });

  describe('updateBugSchema', () => {
    it('passes with partial data', () => {
      const result = updateBugSchema.parse({ title: 'Updated Title' });
      expect(result.title).toBe('Updated Title');
    });

    it('accepts valid version', () => {
      const result = updateBugSchema.parse({ title: 'Title', version: 2 });
      expect(result.version).toBe(2);
    });

    it('rejects non-numeric version', () => {
      expect(() => updateBugSchema.parse({ version: 'abc' })).toThrow();
    });
  });
});

describe('Project Validators', () => {
  describe('createProjectSchema', () => {
    it('passes with valid data', () => {
      const data = { title: 'My Project', description: 'A project' };
      const result = createProjectSchema.parse(data);
      expect(result.title).toBe('My Project');
    });

    it('rejects missing title', () => {
      expect(() => createProjectSchema.parse({})).toThrow();
    });

    it('rejects short title', () => {
      expect(() => createProjectSchema.parse({ title: 'AB' })).toThrow();
    });
  });

  describe('updateProjectSchema', () => {
    it('passes with partial data', () => {
      const result = updateProjectSchema.parse({ title: 'New Name' });
      expect(result.title).toBe('New Name');
    });
  });
});

describe('Sprint Validators', () => {
  describe('createSprintSchema', () => {
    it('passes with valid data', () => {
      const data = {
        name: 'Sprint 1',
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-01-14T00:00:00Z',
      };
      const result = createSprintSchema.parse(data);
      expect(result.name).toBe('Sprint 1');
    });

    it('rejects endDate before startDate', () => {
      const result = createSprintSchema.safeParse({
        name: 'Sprint 1',
        startDate: '2026-01-14T00:00:00Z',
        endDate: '2026-01-01T00:00:00Z',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Task Validators', () => {
  describe('createTaskSchema', () => {
    it('passes with valid data', () => {
      const data = { title: 'Task 1', description: 'A task' };
      const result = createTaskSchema.parse(data);
      expect(result.title).toBe('Task 1');
    });

    it('rejects invalid status', () => {
      expect(() => createTaskSchema.parse({ title: 'Task', status: 'invalid' })).toThrow();
    });
  });
});

describe('Story Validators', () => {
  describe('createStorySchema', () => {
    it('passes with valid data', () => {
      const data = { title: 'Story 1', description: 'A story' };
      const result = createStorySchema.parse(data);
      expect(result.title).toBe('Story 1');
    });

    it('rejects invalid priority', () => {
      expect(() => createStorySchema.parse({ title: 'Story', priority: 'invalid' })).toThrow();
    });
  });
});
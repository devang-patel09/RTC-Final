jest.mock('../../models/Bug', () => ({
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  isValidTransition: jest.fn(() => true),
}));
jest.mock('../../models/ActivityLog', () => ({ create: jest.fn() }));
jest.mock('../../models/Notification', () => ({ create: jest.fn() }));

const Bug = require('../../models/Bug');
const ActivityLog = require('../../models/ActivityLog');
const BugService = require('../../services/BugService');

describe('BugService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('returns bugs matching project filter', async () => {
      const mockBugs = [{ title: 'Bug 1' }];
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockBugs),
      };
      Bug.find.mockReturnValue(mockQuery);

      const result = await BugService.getAll('proj1', { status: 'open' });

      expect(result).toEqual(mockBugs);
      expect(Bug.find).toHaveBeenCalledWith(
        expect.objectContaining({ project: 'proj1', status: 'open' }),
      );
    });
  });

  describe('getById', () => {
    it('throws 404 when bug not found', async () => {
      Bug.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

      await expect(BugService.getById('nonexistent')).rejects.toThrow('Bug not found');
    });
  });

  describe('create', () => {
    it('creates and returns a new bug', async () => {
      Bug.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ order: 0 }),
      });

      const mockCreated = {
        _id: 'bug1',
        title: 'New Bug',
        reporter: 'user1',
        order: 1,
        populate: jest.fn().mockResolvedValue({ _id: 'bug1', title: 'New Bug' }),
      };
      Bug.create.mockResolvedValue(mockCreated);

      const result = await BugService.create(
        { title: 'New Bug', description: 'Desc', project: 'proj1' },
        'user1',
      );

      expect(result).toBeDefined();
      expect(ActivityLog.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws conflict when versions differ', async () => {
      Bug.findById.mockResolvedValue({ _id: '123', version: 2 });

      await expect(
        BugService.update('123', { title: 'Updated', version: 1 }, 'user1'),
      ).rejects.toThrow(/conflict/i);
    });

    it('updates bug when versions match', async () => {
      const mockBug = {
        _id: '123',
        title: 'Old',
        version: 1,
        assignee: null,
        project: 'proj1',
        status: 'open',
        watchers: [],
        reporter: 'user1',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: '123',
          title: 'Updated',
          version: 2,
        }),
      };
      Bug.findById.mockResolvedValue(mockBug);

      await BugService.update('123', { title: 'Updated', version: 1 }, 'user1');

      expect(mockBug.title).toBe('Updated');
      expect(mockBug.version).toBe(2);
    });
  });

  describe('delete', () => {
    it('deletes a bug and logs activity', async () => {
      Bug.findById.mockResolvedValue({ _id: '123', project: 'proj1', title: 'Bug' });

      await BugService.delete('123', 'user1');
      expect(ActivityLog.create).toHaveBeenCalled();
      expect(Bug.findByIdAndDelete).toHaveBeenCalledWith('123');
    });

    it('throws 404 when bug not found', async () => {
      Bug.findById.mockResolvedValue(null);

      await expect(BugService.delete('123', 'user1')).rejects.toThrow('Bug not found');
    });
  });

  describe('addSubtask', () => {
    it('adds a subtask to the bug', async () => {
      const mockBug = {
        _id: '123',
        subtasks: [],
        project: 'proj1',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue({
          _id: '123',
          subtasks: [{ title: 'Subtask 1', status: 'todo' }],
        }),
      };
      Bug.findById.mockResolvedValue(mockBug);

      const result = await BugService.addSubtask('123', { title: 'Subtask 1' }, 'user1');

      expect(mockBug.subtasks).toHaveLength(1);
      expect(result.subtasks[0].title).toBe('Subtask 1');
    });
  });
});
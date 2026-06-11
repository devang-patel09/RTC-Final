const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const ProjectService = require('../../services/ProjectService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('ProjectService', () => {
  it('should be defined', () => {
    expect(ProjectService).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof ProjectService.create).toBe('function');
    expect(typeof ProjectService.getAll).toBe('function');
    expect(typeof ProjectService.getById).toBe('function');
    expect(typeof ProjectService.update).toBe('function');
    expect(typeof ProjectService.delete).toBe('function');
    expect(typeof ProjectService.inviteMember).toBe('function');
    expect(typeof ProjectService.removeMember).toBe('function');
  });
});

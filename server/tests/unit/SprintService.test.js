const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SprintService = require('../../services/SprintService');

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

describe('SprintService', () => {
  it('should be defined', () => {
    expect(SprintService).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof SprintService.create).toBe('function');
    expect(typeof SprintService.getAll).toBe('function');
    expect(typeof SprintService.getById).toBe('function');
    expect(typeof SprintService.update).toBe('function');
    expect(typeof SprintService.start).toBe('function');
    expect(typeof SprintService.complete).toBe('function');
    expect(typeof SprintService.cancel).toBe('function');
  });
});

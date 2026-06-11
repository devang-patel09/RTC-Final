const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const CommentService = require('../../services/CommentService');

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

describe('CommentService', () => {
  it('should be defined', () => {
    expect(CommentService).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof CommentService.create).toBe('function');
    expect(typeof CommentService.getByBug).toBe('function');
    expect(typeof CommentService.update).toBe('function');
    expect(typeof CommentService.delete).toBe('function');
  });
});

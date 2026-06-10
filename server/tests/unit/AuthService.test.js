const AuthService = require('../../services/AuthService');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');

jest.mock('../../models/User', () => {
  const mockFn = jest.fn();
  mockFn.findOne = jest.fn();
  mockFn.findById = jest.fn();
  mockFn.create = jest.fn();
  return mockFn;
});
jest.mock('../../models/Organization', () => ({ findById: jest.fn() }));
jest.mock('../../models/RefreshToken', () => ({ create: jest.fn(), findOne: jest.fn(), deleteMany: jest.fn() }));
jest.mock('../../utils/helpers', () => ({ generateToken: jest.fn(() => 'mock-token') }));
jest.mock('../../utils/email', () => ({ sendEmail: jest.fn() }));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const mockUser = {
        _id: 'user1',
        email: 'test@example.com',
        password: 'hashed',
        role: 'developer',
        fullName: 'Test User',
        isEmailVerified: true,
        organizationId: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      RefreshToken.create.mockResolvedValue({});

      const result = await AuthService.login('test@example.com', 'password');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('throws error for invalid email', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

      await expect(AuthService.login('wrong@example.com', 'pass')).rejects.toThrow('Invalid email or password');
    });

    it('throws error for wrong password', async () => {
      const mockUser = {
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      await expect(AuthService.login('test@example.com', 'wrong')).rejects.toThrow('Invalid email or password');
    });
  });

  describe('token generation', () => {
    it('generateAccessToken returns a JWT string', () => {
      const token = AuthService.generateAccessToken('user1', 'developer');
      expect(token).toEqual(expect.any(String));
    });

    it('generateRefreshToken returns a hex string', () => {
      const token = AuthService.generateRefreshToken();
      expect(token).toEqual(expect.any(String));
      expect(token.length).toBe(80);
    });
  });
});
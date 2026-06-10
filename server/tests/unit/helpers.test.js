const { generateToken, generateProjectKey, sanitizeHtml, paginateQuery } = require('../../utils/helpers');

describe('generateToken', () => {
  it('returns a hex string of the requested length * 2', () => {
    const token = generateToken(16);
    expect(token).toHaveLength(32);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it('defaults to 32 bytes (64 hex chars)', () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
  });
});

describe('generateProjectKey', () => {
  it('takes first 4 chars for single-word titles', () => {
    expect(generateProjectKey('Test')).toBe('TEST');
    expect(generateProjectKey('Hello')).toBe('HELL');
  });

  it('takes first letter of each word for multi-word titles', () => {
    expect(generateProjectKey('My Project')).toBe('MP');
    expect(generateProjectKey('Bug Tracker App')).toBe('BTA');
  });

  it('limits to 5 chars max', () => {
    expect(generateProjectKey('A Very Long Project Name Here')).toBe('AVLPN');
  });

  it('handles empty strings gracefully', () => {
    expect(generateProjectKey('')).toBe('');
  });
});

describe('sanitizeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('passes through safe strings unchanged', () => {
    expect(sanitizeHtml('Hello, world!')).toBe('Hello, world!');
  });
});

describe('paginateQuery', () => {
  it('returns a query with skip and limit applied', () => {
    const mockQuery = { skip: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis() };
    const result = paginateQuery(mockQuery, 2, 10);
    expect(mockQuery.skip).toHaveBeenCalledWith(10);
    expect(mockQuery.limit).toHaveBeenCalledWith(10);
    expect(result).toBe(mockQuery);
  });

  it('defaults to page 1, limit 20', () => {
    const mockQuery = { skip: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis() };
    paginateQuery(mockQuery);
    expect(mockQuery.skip).toHaveBeenCalledWith(0);
    expect(mockQuery.limit).toHaveBeenCalledWith(20);
  });
});
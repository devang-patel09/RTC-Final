const crypto = require('crypto');

const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateProjectKey = (title) => {
  const words = title.split(' ').filter(w => w.length > 0);
  if (words.length === 1) {
    return words[0].substring(0, 4).toUpperCase();
  }
  return words.map(w => w[0]).join('').substring(0, 5).toUpperCase();
};

const sanitizeHtml = (str) => {
  return str.replace(/[&<>"']/g, (match) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
    return entities[match];
  });
};

const paginateQuery = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

module.exports = { generateToken, generateProjectKey, sanitizeHtml, paginateQuery };

const tokenBlacklist = new Set();

const addToBlacklist = (token) => {
  tokenBlacklist.add(token);
};

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

module.exports = { addToBlacklist, isTokenBlacklisted };

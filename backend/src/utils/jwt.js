const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const signAccessToken = (userId, role) =>
  jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '2d' });

const signRefreshToken = (userId) =>
  jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '2d' });

const verifyAccessToken = (token) =>
  jwt.verify(token, JWT_SECRET);

const verifyRefreshToken = (token) =>
  jwt.verify(token, REFRESH_SECRET);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};

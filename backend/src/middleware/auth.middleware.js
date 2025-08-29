const jwt = require('jsonwebtoken');

const verifyToken = (req) => {
    // console.log("req.headers",req.headers);
    
  const authHeader = req.headers.get('authorization');
  // console.log("authHeader",authHeader)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Authorization token missing or malformed');
    err.status = 401;
    throw err;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.status = 403;
    throw error;
  }
};

module.exports = { verifyToken };

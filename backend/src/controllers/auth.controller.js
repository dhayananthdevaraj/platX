const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const {
  signAccessToken,
  signRefreshToken
} = require('../utils/jwt');

const loginUser = async ({ email, password }) => {
    
  const user = await User.findOne({ email });

  if (!user) throw new Error('Invalid email or password');

  if (!user.isActive) {
  throw new Error('User account is deactivated');
   }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new Error('Invalid email or password');

  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  return {
    message: 'Login successful',
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      instituteId: user.instituteId,
      batchId: user.batchId
    }
  };
};

module.exports = { loginUser };

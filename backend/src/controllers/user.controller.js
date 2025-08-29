const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const XLSX = require('xlsx');
const crypto = require('crypto');
const { sendOnboardingEmail, sendPasswordResetEmail } = require('../utils/emailClient');

// const createUser = async (userData) => {
//   const {
//     name,
//     email,
//     password,
//     role,
//     mobile,
//     permissions,
//     instituteId,
//     batchId,
//     profileImageUrl
//   } = userData;
//   console.log("userData",userData);

//   if (!name || !email || !password || !role || !mobile) {
//     const err = new Error('Missing required fields');
//     err.status = 400;
//     throw err;
//   }

//   if (role === 'student' && (!instituteId || !batchId)) {
//     const err = new Error('instituteId and batchId are required for student role');
//     err.status = 400;
//     throw err;
//   }

//   const existing = await User.findOne({ email });
//   if (existing) {
//     const err = new Error('User with this email already exists');
//     err.status = 409;
//     throw err;
//   }
  

//   const salt = await bcrypt.genSalt(10);
//   const passwordHash = await bcrypt.hash(password, salt);

//   const newUser = new User({
//     name,
//     email,
//     passwordHash,
//     role,
//     mobile,
//     permissions,
//     instituteId: instituteId || null,
//     batchId: batchId || null,
//     profileImageUrl: profileImageUrl || null
//   });

//   await newUser.save();

//   // Send email using utility
//   await sendOnboardingEmail({ toEmail: email, name, role, password });

//   return {
//     message: 'User created and email sent (if possible)',
//     userId: newUser._id
//   };
// };


const createUser = async (userData) => {
  const {
    name,
    email,
    password,
    role,
    mobile,
    permissions,
    instituteId,
    batchId,
    profileImageUrl
  } = userData;

  if (!name || !email || !password || !role || !mobile) {
    const err = new Error('Missing required fields');
    err.status = 400;
    throw err;
  }

  if (role === 'student' && (!instituteId || !batchId)) {
    const err = new Error('instituteId and batchId are required for student role');
    err.status = 400;
    throw err;
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });

  if (existing) {
    // Update existing user
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = role;
    existing.mobile = mobile;
    existing.permissions = permissions;
    existing.instituteId = instituteId || null;
    existing.batchId = batchId || null;
    existing.profileImageUrl = profileImageUrl || null;
    existing.updatedAt = now;
    existing.isActive = true;

    await existing.save();

    setTimeout(() => {
      sendOnboardingEmail({ toEmail: email, name, role, password }).catch(console.error);
    }, 0);

    return {
      message: 'User already existed, updated and email sent',
      userId: existing._id
    };
  }

  // Create new user
  const newUser = new User({
    name,
    email,
    passwordHash,
    role,
    mobile,
    permissions,
    instituteId: instituteId || null,
    batchId: batchId || null,
    profileImageUrl: profileImageUrl || null,
    createdAt: now,
    updatedAt: now,
    isActive: true
  });

  await newUser.save();

  setTimeout(() => {
    sendOnboardingEmail({ toEmail: email, name, role, password }).catch(console.error);
  }, 0);

  return {
    message: 'User created and email sent',
    userId: newUser._id
  };
};

const getAllUsers = async (filterParams = {}) => {
  const { role } = filterParams;
  const query = {};
  if (role) query.role = role;

  const users = await User.find(query).select('-passwordHash');
  return {
    count: users.length,
    users
  };
};
const getUserById = async (id) => {
  const user = await User.findById(id).select('-passwordHash');
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
};
const updateUser = async (id, updateData) => {
  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(updateData.password, salt);
    delete updateData.password;
  }

  const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash');
  if (!updatedUser) {
    const err = new Error('User not found or update failed');
    err.status = 404;
    throw err;
  }
  return updatedUser;
};

const importUsersFromExcel = async (file, { role, password, instituteId, batchId }) => {
  const workbook = XLSX.readFile(file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const users = XLSX.utils.sheet_to_json(sheet);

  if (!users || users.length === 0) {
    throw new Error('No user data found in Excel file');
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 10);

  const newUsers = [];
  const updateOps = [];
  const emailTasks = [];

  for (const { name, email, mobile } of users) {
    if (!name || !email || !mobile) continue;

    const existing = await User.findOne({ email });
    if (existing) {
      updateOps.push({
        updateOne: {
          filter: { email },
          update: {
            $set: {
              name,
              role,
              mobile,
              batchId: batchId || null,
              instituteId: instituteId || null,
              passwordHash,
              updatedAt: now,
              isActive: true
            }
          }
        }
      });
    } else {
      newUsers.push({
        name,
        email,
        passwordHash,
        role,
        mobile,
        batchId,
        instituteId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      });
    }

    // Collect email tasks
    emailTasks.push({ toEmail: email, name, role, password });
  }

  // Perform DB writes
  if (newUsers.length) await User.insertMany(newUsers, { ordered: false });
  if (updateOps.length) await User.bulkWrite(updateOps, { ordered: false });

  // Return early; fire emails later
  setTimeout(() => {
    Promise.allSettled(emailTasks.map(data => sendOnboardingEmail(data)))
      .then(results => console.log('Background email results:', results.length))
      .catch(err => console.error('Email error:', err));
  }, 0);

  return {
    message: 'User import completed',
    createdCount: newUsers.length,
    updatedCount: updateOps.length
  };
};

const forgotPassword = async (email) => {
  if (!email) {
    const err = new Error('Email is required');
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ email });

  // Always return success message to prevent email probing
  const genericResponse = { message: 'If this email exists, a reset link has been sent.' };

  if (!user) return genericResponse;

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 min
  await user.save();
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;  

  await sendPasswordResetEmail({toEmail:email, name:user.name, resetLink});

  return genericResponse;
};

const resetPassword = async (token, password) => {
  if (!token || !password) {
    const err = new Error('Token and new password are required');
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    const err = new Error('Token is invalid or has expired');
    err.status = 400;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);
  user.passwordHash = hashed;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  return { message: 'Password reset successful' };
};

const getStudentsByBatch = async (batchId) => {
  if (!batchId) {
    const err = new Error('Batch ID is required');
    err.status = 400;
    throw err;
  }

  const students = await User.find({ role: 'student', batchId }).select('-passwordHash');
  return {
    count: students.length,
    students
  };
};


module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  importUsersFromExcel,
  forgotPassword,
  resetPassword,
  getStudentsByBatch
};

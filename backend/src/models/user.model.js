const mongoose = require('mongoose');

const ROLE_ENUM = [
  'superadmin',
  'center_admin',
  'trainer',
  'student',
  'content_admin'
];

const PERMISSION_ENUM=[
  "*",
  "content:crud:own",
  "content:view:all",
  "content:crud:all",
]

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Email format is invalid']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  role: {
    type: String,
    enum: {
      values: ROLE_ENUM,
      message: '{VALUE} is not a valid role'
    },
    required: [true, 'Role is required']
  },
  mobile: {
    type: String,
    match: [/^\+91-\d{10}$/, 'Mobile must be in format +91-xxxxxxxxxx'],
    required: [true, 'Mobile number is required']
  },
  instituteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    default: null
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null
  },
  permissions: {
    type: [String],
    enum: {
      values: PERMISSION_ENUM,
      message: '{VALUE} is not a valid permission'
    },
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileImageUrl: {
    type: String,
    match: [/^https?:\/\/.+/, 'Invalid URL format'],
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model('User', userSchema);

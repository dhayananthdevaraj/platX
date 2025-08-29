const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['superadmin', 'contentadmin', 'trainer', 'student', 'centeradmin'],
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
    required: function() {
      return ['student', 'trainer', 'centeradmin'].includes(this.role);
    }
  },
  studentDetails: {
    rollNumber: String,
    class: {
      type: String,
      enum: ['11th', '12th', 'Dropper']
    },
    stream: {
      type: String,
      enum: ['PCM', 'PCB', 'PCMB']
    },
    targetExam: {
      type: String,
      enum: ['JEE', 'NEET', 'Both']
    },
    parentName: String,
    parentPhone: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing passwords:', {
    candidatePassword,
    storedPassword: this.password
  });
  
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
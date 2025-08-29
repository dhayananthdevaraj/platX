const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['JEE', 'NEET', 'Mock', 'Practice'],
    required: true
  },
  subject: {
    type: String,
    enum: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Mixed'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  duration: {
    type: Number,
    required: true // in minutes
  },
  totalMarks: {
    type: Number,
    required: true
  },
  negativeMarking: {
    enabled: {
      type: Boolean,
      default: true
    },
    marks: {
      type: Number,
      default: 0.25
    }
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  instructions: [{
    type: String
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowedCenters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Test', testSchema);
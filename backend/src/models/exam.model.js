const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true,
    unique: true
  },
  examCode: {
    type: String,
    required: [true, 'Exam code is required'],
    trim: true,
    unique: true // 🔒 optional: ensure examCode is unique
  },
  instituteId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);

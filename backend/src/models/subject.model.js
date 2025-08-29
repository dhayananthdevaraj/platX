const mongoose = require('mongoose');
const { Schema } = mongoose;

const subjectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subjectCode: {
    type: String,
    required: true,
    trim: true,
    unique: true // ✅ ensure unique subjectCode
  },
  examId: {
    type: Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  instituteId: [{
    type: Schema.Types.ObjectId,
    ref: 'Institute'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// ✅ Ensure subject name + examId combo is unique
subjectSchema.index({ name: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const testConfigurationSchema = new Schema({
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  durationInMinutes: {
    type: Number,
    required: true
  },
  maxAttempts: {
    type: Number,
    default: 1
  },
  isRetakeAllowed: {
    type: Boolean,
    default: false
  },
  isCopyPasteAllowed: {
    type: Boolean,
    default: false
  },
  isPreparationTest: {
    type: Boolean,
    default: false
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
}, { timestamps: true });

// ✅ Each test has only one config per course
testConfigurationSchema.index({ testId: 1, courseId: 1 }, { unique: true });
// ✅ Optimize lookups by course
testConfigurationSchema.index({ courseId: 1 });

module.exports = mongoose.model('TestConfiguration', testConfigurationSchema);

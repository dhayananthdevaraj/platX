const mongoose = require('mongoose');
const { Schema } = mongoose;

const testConfigurationSchema = new Schema(
  {
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
    isPreparationTest: {
      type: Boolean,
      default: false
    },

    // ✅ Existing advanced fields
    isProctored: {
      type: Boolean,
      default: false
    },
    malpracticeLimit: {
      type: Number,
      default: 3 // e.g. 3 tab switches / violations
    },

    // ✅ New scoring fields
    correctMark: {
      type: Number,
      required: true,
      default: 1 // Marks for each correct answer
    },
    negativeMark: {
      type: Number,
      required: true,
      default: 0 // Marks deducted for wrong answer
    },
    passPercentage: {
      type: Number,
      required: true,
      default: 40, // Minimum pass %
      min: 0,
      max: 100
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
  },
  { timestamps: true }
);

// ✅ Each test has only one config per course
testConfigurationSchema.index({ testId: 1, courseId: 1 }, { unique: true });
// ✅ Optimize lookups by course
testConfigurationSchema.index({ courseId: 1 });

module.exports = mongoose.model('TestConfiguration', testConfigurationSchema);

const mongoose = require('mongoose');
const { Schema } = mongoose;

const testResultSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  answers: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    selectedOptionIndex: { type: Number },
    isCorrect: { type: Boolean }, // optional → backend can evaluate
    marksAwarded: { type: Number, default: 0 }
  }],

  sectionWiseMarks: [{
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    sectionName: { type: String, required: true },
    obtainedMarks: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 }
  }],

  totalMarks: { type: Number, required: true },
  obtainedMarks: { type: Number, required: true },
  percentage: { type: Number },
  status: {
    type: String,
    enum: ['IN_PROGRESS', 'SUBMITTED', 'PASSED', 'FAILED'],
    default: 'IN_PROGRESS'
  },
  remarks: { type: String },
  attemptNumber: { type: Number, default: 1 },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },

  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// ✅ Indexes
testResultSchema.index({ courseId: 1, studentId: 1 });
testResultSchema.index({ testId: 1 });
testResultSchema.index(
  { courseId: 1, testId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('TestResult', testResultSchema);

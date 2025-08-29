const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    selectedAnswer: String,
    isCorrect: Boolean,
    marksObtained: Number,
    timeSpent: Number // in seconds
  }],
  score: {
    total: Number,
    correct: Number,
    incorrect: Number,
    unattempted: Number,
    percentage: Number
  },
  timeTaken: {
    type: Number, // in minutes
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
  status: {
    type: String,
    enum: ['Completed', 'Incomplete', 'Auto-Submitted'],
    default: 'Completed'
  },
  rank: {
    overall: Number,
    centerWise: Number
  },
  subjectWiseScore: [{
    subject: String,
    correct: Number,
    incorrect: Number,
    unattempted: Number,
    marks: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for unique student-test combination
resultSchema.index({ student: 1, test: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
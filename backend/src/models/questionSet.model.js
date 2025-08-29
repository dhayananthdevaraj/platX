const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionSetSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Code is required'],
    unique: true,
    uppercase: true
  },
  examId: {
    type: Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  chapterId: {
    type: Schema.Types.ObjectId,
    ref: 'Chapter',
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
}, { timestamps: true });

questionSetSchema.index({ name: 1, chapterId: 1 }, { unique: true });

module.exports = mongoose.model('QuestionSet', questionSetSchema);

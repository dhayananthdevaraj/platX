const mongoose = require('mongoose');
const { Schema } = mongoose;

const chapterSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  chapterCode: {
    type: String,
    required: true,
    trim: true,
    unique: true // ✅ Ensure unique chapterCode
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

// ✅ Ensure unique combination of name + subjectId
chapterSchema.index({ name: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('Chapter', chapterSchema);

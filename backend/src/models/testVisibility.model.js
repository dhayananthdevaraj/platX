const mongoose = require('mongoose');
const { Schema } = mongoose;

const testVisibilitySchema = new Schema({
  testId: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    unique: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  includeGroups: [{
    type: Schema.Types.ObjectId,
    ref: 'Group'
  }],
  excludeGroups: [{
    type: Schema.Types.ObjectId,
    ref: 'Group'
  }],
  includeCandidates: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  excludeCandidates: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
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

module.exports = mongoose.model('TestVisibility', testVisibilitySchema);

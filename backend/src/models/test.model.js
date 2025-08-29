const mongoose = require('mongoose');
const { Schema } = mongoose;

const testSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
    minlength: [3, 'Test name must be at least 3 characters'],
    maxlength: [200, 'Test name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  // Questions organized by sections
  sections: [{
    sectionName: {
      type: String,
      required: true,
      trim: true
    },
    sectionDescription: {
      type: String,
      trim: true
    },
    questions: [{
      type: Schema.Types.ObjectId,
      ref: 'Question'
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // Audit fields
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

module.exports = mongoose.model('Test', testSchema);
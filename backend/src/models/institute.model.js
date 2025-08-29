const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Institute name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    unique:true
  },
  code:{
    type: String,
    required: [true, 'Code is required'],
    unique: true,
    uppercase: true
  },
   email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Email format is invalid']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^\+91-\d{10}$/, 'Contact must be in format +91-xxxxxxxxxx']
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  subscriptionType: {
    type: String,
    required: [true, 'Subscription type is required']
  },
  capacity: {
    type: Number,
    default: 100
  },
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
    ref: 'User'
  }
}, {
  timestamps: true // adds createdAt, updatedAt
});


module.exports = mongoose.model('Institute', instituteSchema);

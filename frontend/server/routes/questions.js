const express = require('express');
const { body, validationResult } = require('express-validator');
const Question = require('../models/Question');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all questions
router.get('/', auth, authorize('contentadmin', 'trainer', 'superadmin'), async (req, res) => {
  try {
    const { subject, difficulty, topic, page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (topic) query.topic = new RegExp(topic, 'i');

    const questions = await Question.find(query)
      .populate('createdBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(query);

    res.json({
      questions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create question
router.post('/', auth, authorize('contentadmin', 'trainer', 'superadmin'), [
  body('question').trim().isLength({ min: 10 }).withMessage('Question must be at least 10 characters'),
  body('subject').isIn(['Physics', 'Chemistry', 'Mathematics', 'Biology']).withMessage('Invalid subject'),
  body('topic').trim().isLength({ min: 2 }).withMessage('Topic must be at least 2 characters'),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty'),
  body('correctAnswer').trim().isLength({ min: 1 }).withMessage('Correct answer is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const questionData = {
      ...req.body,
      createdBy: req.user._id
    };

    const question = new Question(questionData);
    await question.save();

    res.status(201).json({
      message: 'Question created successfully',
      question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update question
router.put('/:id', auth, authorize('contentadmin', 'trainer', 'superadmin'), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check if user can edit this question
    if (req.user.role === 'trainer' && question.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    res.json({ message: 'Question updated successfully', question: updatedQuestion });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete question
router.delete('/:id', auth, authorize('contentadmin', 'superadmin'), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
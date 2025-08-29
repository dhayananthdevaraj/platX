const express = require('express');
const Result = require('../models/Result');
const Test = require('../models/Test');
const Question = require('../models/Question');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Submit test result
router.post('/submit', auth, authorize('student', 'superadmin'), async (req, res) => {
  try {
    const { testId, answers, timeTaken, startTime, endTime } = req.body;

    // Check if result already exists
    const existingResult = await Result.findOne({
      student: req.user._id,
      test: testId
    });

    if (existingResult) {
      return res.status(400).json({ message: 'Test already submitted' });
    }

    // Get test details
    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Calculate score
    let totalMarks = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unattempted = 0;
    const subjectWiseScore = {};

    const processedAnswers = answers.map(answer => {
      const question = test.questions.find(q => q._id.toString() === answer.questionId);
      if (!question) return null;

      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      let marksObtained = 0;

      if (answer.selectedAnswer) {
        if (isCorrect) {
          marksObtained = question.marks;
          correctAnswers++;
        } else {
          marksObtained = -question.negativeMarks;
          incorrectAnswers++;
        }
      } else {
        unattempted++;
      }

      totalMarks += marksObtained;

      // Subject-wise calculation
      if (!subjectWiseScore[question.subject]) {
        subjectWiseScore[question.subject] = {
          subject: question.subject,
          correct: 0,
          incorrect: 0,
          unattempted: 0,
          marks: 0
        };
      }

      if (answer.selectedAnswer) {
        if (isCorrect) {
          subjectWiseScore[question.subject].correct++;
        } else {
          subjectWiseScore[question.subject].incorrect++;
        }
      } else {
        subjectWiseScore[question.subject].unattempted++;
      }
      subjectWiseScore[question.subject].marks += marksObtained;

      return {
        question: question._id,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        marksObtained,
        timeSpent: answer.timeSpent || 0
      };
    }).filter(Boolean);

    const percentage = (totalMarks / test.totalMarks) * 100;

    // Create result
    const result = new Result({
      student: req.user._id,
      test: testId,
      answers: processedAnswers,
      score: {
        total: totalMarks,
        correct: correctAnswers,
        incorrect: incorrectAnswers,
        unattempted,
        percentage: Math.max(0, percentage)
      },
      timeTaken,
      startTime,
      endTime,
      subjectWiseScore: Object.values(subjectWiseScore)
    });

    await result.save();

    // Calculate rank (simplified - in production, use more efficient ranking)
    const allResults = await Result.find({ test: testId }).sort({ 'score.total': -1 });
    const rank = allResults.findIndex(r => r._id.toString() === result._id.toString()) + 1;
    
    result.rank = { overall: rank };
    await result.save();

    res.status(201).json({
      message: 'Test submitted successfully',
      result
    });
  } catch (error) {
    console.error('Submit result error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student results
router.get('/student/:studentId?', auth, async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user._id;

    // Check permissions
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10 } = req.query;

    const results = await Result.find({ student: studentId })
      .populate('test', 'title type subject duration totalMarks')
      .populate('student', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Result.countDocuments({ student: studentId });

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get test results (for admins/trainers)
router.get('/test/:testId', auth, authorize('contentadmin', 'trainer', 'superadmin', 'centeradmin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const results = await Result.find({ test: req.params.testId })
      .populate('student', 'name email center')
      .populate('test', 'title type subject')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'score.total': -1 });

    const total = await Result.countDocuments({ test: req.params.testId });

    res.json({
      results,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get result analytics
router.get('/analytics/:testId', auth, authorize('contentadmin', 'trainer', 'superadmin', 'centeradmin'), async (req, res) => {
  try {
    const results = await Result.find({ test: req.params.testId })
      .populate('student', 'name center');

    const analytics = {
      totalStudents: results.length,
      averageScore: results.reduce((sum, r) => sum + r.score.total, 0) / results.length || 0,
      averagePercentage: results.reduce((sum, r) => sum + r.score.percentage, 0) / results.length || 0,
      highestScore: Math.max(...results.map(r => r.score.total), 0),
      lowestScore: Math.min(...results.map(r => r.score.total), 0),
      passedStudents: results.filter(r => r.score.percentage >= 40).length,
      scoreDistribution: {
        '90-100': results.filter(r => r.score.percentage >= 90).length,
        '80-89': results.filter(r => r.score.percentage >= 80 && r.score.percentage < 90).length,
        '70-79': results.filter(r => r.score.percentage >= 70 && r.score.percentage < 80).length,
        '60-69': results.filter(r => r.score.percentage >= 60 && r.score.percentage < 70).length,
        '50-59': results.filter(r => r.score.percentage >= 50 && r.score.percentage < 60).length,
        '40-49': results.filter(r => r.score.percentage >= 40 && r.score.percentage < 50).length,
        'Below 40': results.filter(r => r.score.percentage < 40).length
      }
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
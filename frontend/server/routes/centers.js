const express = require('express');
const { body, validationResult } = require('express-validator');
const Center = require('../models/Center');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all centers
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = {};

    // Center admin can only see their own center
    if (req.user.role === 'centeradmin') {
      query._id = req.user.center;
    }

    const centers = await Center.find(query)
      .populate('admin', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Center.countDocuments(query);

    res.json({
      centers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get centers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create center (Super Admin only)
router.post('/', auth, authorize('superadmin'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Code must be at least 2 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const centerData = req.body;
    const center = new Center(centerData);
    await center.save();

    res.status(201).json({
      message: 'Center created successfully',
      center
    });
  } catch (error) {
    console.error('Create center error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Center code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Update center
router.put('/:id', auth, authorize('superadmin', 'centeradmin'), async (req, res) => {
  try {
    const centerId = req.params.id;
    
    // Center admin can only update their own center
    if (req.user.role === 'centeradmin' && req.user.center.toString() !== centerId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const center = await Center.findByIdAndUpdate(
      centerId,
      req.body,
      { new: true, runValidators: true }
    ).populate('admin', 'name email');

    if (!center) {
      return res.status(404).json({ message: 'Center not found' });
    }

    res.json({ message: 'Center updated successfully', center });
  } catch (error) {
    console.error('Update center error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
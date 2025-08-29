const TestVisibility = require('../models/testVisibility.model');

// Create Test Visibility
const createTestVisibility = async (data) => {
  const {
    testId, courseId,
    includeGroups, excludeGroups,
    includeCandidates, excludeCandidates,
    createdBy, lastUpdatedBy
  } = data;

  if (!testId || !courseId || !createdBy) {
    const err = new Error('Missing required fields');
    err.status = 400;
    throw err;
  }

  const newVisibility = new TestVisibility({
    testId,
    courseId,
    includeGroups: includeGroups || [],
    excludeGroups: excludeGroups || [],
    includeCandidates: includeCandidates || [],
    excludeCandidates: excludeCandidates || [],
    createdBy,
    lastUpdatedBy
  });

  await newVisibility.save();

  return {
    message: 'Test visibility created successfully',
    visibilityId: newVisibility._id
  };
};

// Get All
const getAllTestVisibilities = async () => {
  return await TestVisibility.find();
};

// Get By ID
const getTestVisibilityById = async (id) => {
  const visibility = await TestVisibility.findById(id);
  if (!visibility) {
    const err = new Error('Test Visibility not found');
    err.status = 404;
    throw err;
  }
  return visibility;
};

// Update
const updateTestVisibility = async (id, updateData) => {
  updateData.updatedAt = new Date();

  const updated = await TestVisibility.findByIdAndUpdate(id, updateData, {
    new: true
  });

  if (!updated) {
    const err = new Error('Test Visibility not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};

const getTestVisibilityByCourseAndTest = async (courseId, testId) => {
  const visibility = await TestVisibility.findOne({ courseId, testId })
    .populate('includeGroups excludeGroups includeCandidates excludeCandidates'); // optional


  return visibility;
};

module.exports = {
  createTestVisibility,
  getAllTestVisibilities,
  getTestVisibilityById,
  updateTestVisibility,
  getTestVisibilityByCourseAndTest
};

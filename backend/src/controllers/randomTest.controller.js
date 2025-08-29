const RandomTest = require('../models/randomTest.model');

// Create RandomTest
const createRandomTest = async (data) => {
  const { name, code, description, sections, createdBy, lastUpdatedBy } = data;

  if (!name || !createdBy || !code) {
    const err = new Error('Missing required fields: name, code and createdBy are mandatory');
    err.status = 400;
    throw err;
  }

  // Validate sections
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    const err = new Error('Sections must be a non-empty array');
    err.status = 400;
    throw err;
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (!section.sectionName || !section.sectionName.trim()) {
      const err = new Error(`Section ${i + 1} must have a valid sectionName`);
      err.status = 400;
      throw err;
    }

    if (!Array.isArray(section.questionSets) || section.questionSets.length === 0) {
      const err = new Error(`Section ${i + 1} must have at least one questionSet`);
      err.status = 400;
      throw err;
    }

    for (let j = 0; j < section.questionSets.length; j++) {
      const qs = section.questionSets[j];
      if (!qs.questionSet) {
        const err = new Error(`Section ${i + 1}, QuestionSet ${j + 1} must have a valid questionSet`);
        err.status = 400;
        throw err;
      }
      if (!qs.distribution) {
        qs.distribution = { easy: 0, medium: 0, hard: 0 };
      }
    }
  }

  const newRandomTest = new RandomTest({
    code,
    name,
    description,
    sections,
    createdBy,
    lastUpdatedBy: lastUpdatedBy || createdBy
  });

  await newRandomTest.save();

  return {
    message: 'RandomTest created successfully',
    testId: newRandomTest._id,
    code: newRandomTest.code
  };
};

// Get All RandomTests
const getAllRandomTests = async (filters = {}) => {
  const query = {};

  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  if (filters.createdBy) {
    query.createdBy = filters.createdBy;
  }

  return await RandomTest.find(query)
    .populate('createdBy', 'name email')
    .populate('lastUpdatedBy', 'name email')
    .populate('sections.questionSets.questionSet')
    .sort({ createdAt: -1 });
};

// Get RandomTest By ID
const getRandomTestById = async (id) => {
  const test = await RandomTest.findById(id)
    .populate('createdBy', 'name email')
    .populate('lastUpdatedBy', 'name email')
    .populate('sections.questionSets.questionSet');

  if (!test) {
    const err = new Error('RandomTest not found');
    err.status = 404;
    throw err;
  }
// console.log("test",test);
  return test;
};

// Update RandomTest
const updateRandomTest = async (id, updateData, updatedBy) => {
  const { code, createdBy, createdAt, ...allowedUpdates } = updateData;

  allowedUpdates.lastUpdatedBy = updatedBy;
  allowedUpdates.updatedAt = new Date();

  if (allowedUpdates.sections) {
    if (!Array.isArray(allowedUpdates.sections)) {
      const err = new Error('Sections must be an array');
      err.status = 400;
      throw err;
    }

    for (let i = 0; i < allowedUpdates.sections.length; i++) {
      const section = allowedUpdates.sections[i];
      if (!section.sectionName || !section.sectionName.trim()) {
        const err = new Error(`Section ${i + 1} must have a valid sectionName`);
        err.status = 400;
        throw err;
      }

      if (!Array.isArray(section.questionSets)) {
        const err = new Error(`Section ${i + 1} must have a valid questionSets array`);
        err.status = 400;
      }
    }
  }

  const updated = await RandomTest.findByIdAndUpdate(id, allowedUpdates, {
    new: true,
    runValidators: true
  })
    .populate('createdBy', 'name email')
    .populate('lastUpdatedBy', 'name email')
    .populate('sections.questionSets.questionSet');

  if (!updated) {
    const err = new Error('RandomTest not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};

// Soft delete
const deleteRandomTest = async (id, deletedBy) => {
  const updated = await RandomTest.findByIdAndUpdate(
    id,
    {
      isActive: false,
      lastUpdatedBy: deletedBy,
      updatedAt: new Date()
    },
    { new: true }
  );

  if (!updated) {
    const err = new Error('RandomTest not found');
    err.status = 404;
    throw err;
  }

  return {
    message: 'RandomTest deactivated successfully',
    testId: updated._id
  };
};

module.exports = {
  createRandomTest,
  getAllRandomTests,
  getRandomTestById,
  updateRandomTest,
  deleteRandomTest
};

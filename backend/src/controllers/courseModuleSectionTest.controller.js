// 📂 controllers/courseModuleSectionTest.controller.js
const CourseModuleSectionTest = require('../models/courseModuleSectionTest.model');

// ✅ Add Test to Section
const addTestToSection = async (body) => {
  const { sectionId, testId, configurationId, visibilityId, order, createdBy, lastUpdatedBy } = body;

  if (!sectionId || !testId || order === undefined || !createdBy) {
    const err = new Error('Missing required fields: sectionId, testId, order, createdBy');
    err.status = 400;
    throw err;
  }

  const newTest = new CourseModuleSectionTest({
    sectionId,
    testId,
    configurationId,
    visibilityId,
    order,
    createdBy,
    lastUpdatedBy,
  });

  await newTest.save();

  return {
    message: 'Test added to section successfully',
    sectionTestId: newTest._id,
  };
};

// ✅ Get Tests by Section
const getTestsBySection = async (sectionId) => {
  const tests = await CourseModuleSectionTest.find({ sectionId })
    .sort({ order: 1 })
    .populate('testId')
    .populate('configurationId')
    .populate('visibilityId')
    .lean();

  return tests;
};

// ✅ Update Section Test
const updateSectionTest = async (sectionTestId, body) => {
  const updateData = { ...body, updatedAt: new Date() };
  updateData.lastUpdatedBy = updateData.lastUpdatedBy || null;

  const updated = await CourseModuleSectionTest.findByIdAndUpdate(sectionTestId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const err = new Error('Section test not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};

// ✅ Delete Section Test
const deleteSectionTest = async (sectionTestId) => {
  const deleted = await CourseModuleSectionTest.findByIdAndDelete(sectionTestId);
  if (!deleted) {
    const err = new Error('Section test not found or delete failed');
    err.status = 404;
    throw err;
  }

  return { message: 'Section test deleted successfully', sectionTestId };
};

// ✅ Reorder Section Tests (drag & drop)
const reorderSectionTests = async (sectionId, body) => {
  const { testOrder } = body;
  // testOrder = [{ sectionTestId, order }, ...]

  if (!Array.isArray(testOrder)) {
    const err = new Error('Invalid test order format');
    err.status = 400;
    throw err;
  }

  const bulkOps = testOrder.map((test) => ({
    updateOne: {
      filter: { _id: test.sectionTestId, sectionId },
      update: { order: test.order },
    },
  }));

  await CourseModuleSectionTest.bulkWrite(bulkOps);

  return { message: 'Section tests reordered successfully' };
};

module.exports = {
  addTestToSection,
  getTestsBySection,
  updateSectionTest,
  deleteSectionTest,
  reorderSectionTests,
};

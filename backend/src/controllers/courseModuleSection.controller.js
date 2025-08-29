const CourseModuleSection = require('../models/courseModuleSection.model');
const CourseModuleSectionTest = require('../models/courseModuleSectionTest.model');

// ✅ Create Section
const createSection = async (body) => {
  const { moduleId, sectionName, sectionDescription, order, createdBy, lastUpdatedBy } = body;

  if (!moduleId || !sectionName || order === undefined || !createdBy) {
    const err = new Error('Missing required fields: moduleId, sectionName, order, createdBy');
    err.status = 400;
    throw err;
  }

  const newSection = new CourseModuleSection({
    moduleId,
    sectionName,
    sectionDescription,
    order,
    createdBy,
    lastUpdatedBy,
  });

  await newSection.save();

  return {
    message: 'Section created successfully',
    sectionId: newSection._id,
  };
};

// ✅ Get Sections by Module
const getSectionsByModule = async (moduleId) => {
  const sections = await CourseModuleSection.find({ moduleId })
    .sort({ order: 1 })
    .lean();

  for (let sec of sections) {
    sec.tests = await CourseModuleSectionTest.find({ sectionId: sec._id })
      .sort({ order: 1 })
      .populate('testId')
      .populate('configurationId')
      .populate('visibilityId')
      .lean();
  }

  return sections;
};

// ✅ Get Section by ID
const getSectionById = async (sectionId) => {
  const section = await CourseModuleSection.findById(sectionId).lean();
  if (!section) {
    const err = new Error('Section not found');
    err.status = 404;
    throw err;
  }

  section.tests = await CourseModuleSectionTest.find({ sectionId })
    .sort({ order: 1 })
    .populate('testId')
    .populate('configurationId')
    .populate('visibilityId')
    .lean();

  return section;
};

// ✅ Update Section
const updateSection = async (sectionId, body) => {
  const updateData = { ...body, updatedAt: new Date() };

  const updated = await CourseModuleSection.findByIdAndUpdate(sectionId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const err = new Error('Section not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};

// ✅ Delete Section (cascade delete)
const deleteSection = async (sectionId) => {
  const deleted = await CourseModuleSection.findByIdAndDelete(sectionId);
  if (!deleted) {
    const err = new Error('Section not found or delete failed');
    err.status = 404;
    throw err;
  }

  await CourseModuleSectionTest.deleteMany({ sectionId });

  return { message: 'Section and related tests deleted successfully', sectionId };
};

// ✅ Reorder Sections
const reorderSections = async (moduleId, body) => {
  const { sectionOrder } = body;
  if (!Array.isArray(sectionOrder)) {
    const err = new Error('Invalid section order format');
    err.status = 400;
    throw err;
  }

  const bulkOps = sectionOrder.map((sec) => ({
    updateOne: {
      filter: { _id: sec.sectionId, moduleId },
      update: { order: sec.order },
    },
  }));

  await CourseModuleSection.bulkWrite(bulkOps);

  return { message: 'Sections reordered successfully' };
};

module.exports = {
  createSection,
  getSectionsByModule,
  getSectionById,
  updateSection,
  deleteSection,
  reorderSections,
};

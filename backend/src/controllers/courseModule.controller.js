const CourseModule = require('../models/courseModule.model');
const ModuleSection = require('../models/courseModuleSection.model');
const SectionTest = require('../models/courseModuleSectionTest.model');

// ✅ Create Module
const createModule = async ({ courseId, moduleName, moduleDescription, order, createdBy, lastUpdatedBy }) => {
  if (!courseId || !moduleName || order === undefined || !createdBy) {
    const err = new Error('Missing required fields: courseId, moduleName, order, createdBy');
    err.status = 400;
    throw err;
  }

  const newModule = new CourseModule({
    courseId,
    moduleName,
    moduleDescription,
    order,
    createdBy,
    lastUpdatedBy,
  });

  await newModule.save();

  return {
    message: 'Module created successfully',
    moduleId: newModule._id,
  };
};

// ✅ Get All Modules for a Course
const getModulesByCourse = async (courseId) => {
  const modules = await CourseModule.find({ courseId })
    .sort({ order: 1 })
    .lean();

  for (let mod of modules) {
    const sections = await ModuleSection.find({ moduleId: mod._id })
      .sort({ order: 1 })
      .lean();

    for (let sec of sections) {
      sec.tests = await SectionTest.find({ sectionId: sec._id })
        .sort({ order: 1 })
        // .populate('testId')
        .populate('configurationId')
        .populate('visibilityId')
        .lean();
    }

    mod.sections = sections;
  }

  return modules;
};

// ✅ Get Single Module by ID
const getModuleById = async (moduleId) => {
  const module = await CourseModule.findById(moduleId).lean();
  if (!module) {
    const err = new Error('Module not found');
    err.status = 404;
    throw err;
  }

  const sections = await ModuleSection.find({ moduleId })
    .sort({ order: 1 })
    .lean();

  for (let sec of sections) {
    sec.tests = await SectionTest.find({ sectionId: sec._id })
      .sort({ order: 1 })
      .populate('testId')
      .populate('configurationId')
      .populate('visibilityId')
      .lean();
  }

  module.sections = sections;
  return module;
};

// ✅ Update Module
const updateModule = async (moduleId, updateData) => {
  updateData.lastUpdatedBy = updateData.lastUpdatedBy || null;
  updateData.updatedAt = new Date();

  const updated = await CourseModule.findByIdAndUpdate(moduleId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const err = new Error('Module not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};

// ✅ Delete Module
const deleteModule = async (moduleId) => {
  const deleted = await CourseModule.findByIdAndDelete(moduleId);
  if (!deleted) {
    const err = new Error('Module not found or delete failed');
    err.status = 404;
    throw err;
  }

  return { message: 'Module deleted successfully', moduleId };
};

// ✅ Reorder Modules
const reorderModules = async (courseId, moduleOrder) => {
  if (!Array.isArray(moduleOrder)) {
    const err = new Error('Invalid module order format');
    err.status = 400;
    throw err;
  }

  const bulkOps = moduleOrder.map((mod) => ({
    updateOne: {
      filter: { _id: mod.moduleId, courseId },
      update: { order: mod.order },
    },
  }));

  await CourseModule.bulkWrite(bulkOps);

  return { message: 'Modules reordered successfully' };
};

module.exports = {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  deleteModule,
  reorderModules,
};

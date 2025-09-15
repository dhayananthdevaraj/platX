const CourseModuleSection = require('../models/courseModuleSection.model');
const CourseModuleSectionTest = require('../models/courseModuleSectionTest.model');
const TestVisibility = require('../models/testVisibility.model');
const Group = require('../models/group.model');
const mongoose = require("mongoose");

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
// const getSectionsByModule = async (moduleId) => {
//   const sections = await CourseModuleSection.find({ moduleId })
//     .sort({ order: 1 })
//     .lean();

//   for (let sec of sections) {
//     sec.tests = await CourseModuleSectionTest.find({ sectionId: sec._id })
//       .sort({ order: 1 })
//       .populate('testId')
//       .populate('configurationId')
//       .populate('visibilityId')
//       .lean();
//   }

//   return sections;
// };

// const getSectionsByModule = async (moduleId) => {
//   // get all sections of the module
//   const sections = await CourseModuleSection.find({ moduleId })
//     .sort({ order: 1 })
//     .lean();

//   if (!sections.length) return [];

//   // get all tests for these sections
//   const sectionIds = sections.map(sec => sec._id);

//   const tests = await CourseModuleSectionTest.find({ sectionId: { $in: sectionIds } })
//     .sort({ order: 1 })
//     .populate({
//       path: "testId",
//       select: "_id code name description" // ✅ only pick lightweight fields
//     })
//     .populate("configurationId") // keep if you need
//     .populate("visibilityId")    // keep if you need
//     .lean();

//   // attach tests to sections
//   const sectionMap = sections.map(sec => ({
//     ...sec,
//     tests: tests.filter(t => String(t.sectionId) === String(sec._id))
//   }));

//   return sectionMap;
// };
// const getSectionsByModule = async (moduleId, courseId, userId) => {
//   // 1️⃣ Fetch sections for the module
//   const sections = await CourseModuleSection.find({ moduleId })
//     .sort({ order: 1 })
//     .lean();

//   if (!sections.length) return [];

//   const sectionIds = sections.map(sec => sec._id);

//   // 2️⃣ Fetch all tests for these sections
//   const tests = await CourseModuleSectionTest.find({ sectionId: { $in: sectionIds } })
//     .sort({ order: 1 })
//     .populate({
//       path: 'testId',
//       select: '_id code name description courseId',
//     })
//     .populate('configurationId')
//     .populate('visibilityId')
//     .lean();

//   if (!tests.length) return sections.map(sec => ({ ...sec, tests: [] }));

//   const testIds = tests.map(t => t.testId._id);

//   // 3️⃣ Fetch all TestVisibility docs for these tests & the course
//   const visibilities = await TestVisibility.find({
//     courseId,
//     testId: { $in: testIds },
//   }).lean();

//   // If no visibility exists, return all tests as is
//   if (!visibilities.length) {
//     return sections.map(sec => ({
//       ...sec,
//       tests: tests.filter(t => String(t.sectionId) === String(sec._id)),
//     }));
//   }

//   // 4️⃣ Fetch all groups that include this user
//   const userGroups = await Group.find({ candidateIds: userId }).lean();
//   const userGroupIds = userGroups.map(g => String(g._id));

//   // 5️⃣ Filter tests based on visibility rules
//   const filteredTests = tests.filter((t) => {
//     const visibility = visibilities.find(v => String(v.testId) === String(t.testId._id));

//     // If no visibility is set for this test, allow test by default
//     if (!visibility) return true;

//     const includedCandidates = (visibility.includeCandidates || []).map(String);
//     const excludedCandidates = (visibility.excludeCandidates || []).map(String);
//     const includedGroups = (visibility.includeGroups || []).map(String);
//     const excludedGroups = (visibility.excludeGroups || []).map(String);

//     let canSee = false;

//     // ✅ Direct inclusion
//     if (includedCandidates.includes(String(userId))) canSee = true;

//     // ✅ Inclusion via groups
//     if (!canSee && includedGroups.some(gId => userGroupIds.includes(gId))) canSee = true;

//     // ❌ Exclusion overrides everything
//     if (excludedCandidates.includes(String(userId))) canSee = false;
//     if (excludedGroups.some(gId => userGroupIds.includes(gId))) canSee = false;

//     return canSee;
//   });

//   // 6️⃣ Map filtered tests to their sections
//   const sectionMap = sections.map(sec => ({
//     ...sec,
//     tests: filteredTests.filter(t => String(t.sectionId) === String(sec._id)),
//   }));

//   return sectionMap;
// };
// const getSectionsByModule = async (moduleId, courseId, userId) => {
//   // 1️⃣ Fetch sections for the module
//   const sections = await CourseModuleSection.find({ moduleId })
//     .sort({ order: 1 })
//     .lean();

//   if (!sections.length) return [];
//   console.log("sections",sections);


//   const sectionIds = sections.map(sec => sec._id);

//   // 2️⃣ Fetch all tests for these sections
//   const tests = await CourseModuleSectionTest.find({ sectionId: { $in: sectionIds } })
//     .sort({ order: 1 })
//     .populate({
//       path: 'testId',
//       select: '_id code name description courseId',
//     })
//     .populate('configurationId')
//     .populate('visibilityId')
//     .lean();

//   if (!tests.length) return sections.map(sec => ({ ...sec, tests: [] }));

//   const testIds = tests.map(t => t.testId._id);

//   // 3️⃣ Fetch all TestVisibility docs for these tests & the course
//   const visibilities = await TestVisibility.find({
//     courseId,
//     testId: { $in: testIds },
//   }).lean();

//   // 4️⃣ Fetch all groups that include this user
//   const userGroups = await Group.find({ candidateIds: userId }).lean();
//   const userGroupIds = userGroups.map(g => String(g._id));

//   // 5️⃣ Filter tests based on visibility rules
//   const filteredTests = tests.filter((t) => {
//     const visibility = visibilities.find(v => String(v.testId) === String(t.testId._id));

//     // ✅ Case 1: If no visibility is defined → allow everyone
//     if (!visibility) return true;

//     const includedCandidates = (visibility.includeCandidates || []).map(String);
//     const excludedCandidates = (visibility.excludeCandidates || []).map(String);
//     const includedGroups = (visibility.includeGroups || []).map(String);
//     const excludedGroups = (visibility.excludeGroups || []).map(String);

//     const hasIncludes = includedCandidates.length > 0 || includedGroups.length > 0;
//     const hasExcludes = excludedCandidates.length > 0 || excludedGroups.length > 0;

//     // ✅ Case 2: If includes exist → allow ONLY those included
//     if (hasIncludes) {
//       const isIncluded =
//         includedCandidates.includes(String(userId)) ||
//         includedGroups.some(gId => userGroupIds.includes(gId));
//       return isIncluded; // ✅ Allow only if in include list
//     }

//     // ✅ Case 3: If only excludes exist → allow everyone except excluded
//     if (hasExcludes) {
//       const isExcluded =
//         excludedCandidates.includes(String(userId)) ||
//         excludedGroups.some(gId => userGroupIds.includes(gId));
//       return !isExcluded; // ✅ Block excluded users/groups
//     }

//     // ✅ Case 4: If neither includes nor excludes exist → allow everyone
//     return true;
//   });

//   // 6️⃣ Map filtered tests to their sections
//   const sectionMap = sections.map(sec => ({
//     ...sec,
//     tests: filteredTests.filter(t => String(t.sectionId) === String(sec._id)),
//   }));
// console.log("sectionMap",sectionMap);

//   return sectionMap;
// };

const getSectionsByModule = async (moduleId, courseId, userId) => {
  // 1️⃣ Fetch sections for the module
  const sections = await CourseModuleSection.find({ moduleId })
    .sort({ order: 1 })
    .lean();

  if (!sections.length) return [];

  const sectionIds = sections.map(sec => sec._id);

  // 2️⃣ Fetch all tests for these sections
  const tests = await CourseModuleSectionTest.find({ sectionId: { $in: sectionIds } })
    .sort({ order: 1 })
    .populate('configurationId')
    .populate('visibilityId')
    .lean();

  if (!tests.length) return sections.map(sec => ({ ...sec, tests: [] }));

  // 3️⃣ Populate testId dynamically based on type
  const populatedTests = await Promise.all(
    tests.map(async (t) => {
      const modelName = t.type === 'normal' ? 'Test' : 'RandomTest';
      t.testId = await mongoose.model(modelName).findById(t.testId)
        .select('_id code name description courseId')
        .lean();
      return t;
    })
  );

  const testIds = populatedTests.map(t => t.testId._id);

  // 4️⃣ Fetch all TestVisibility docs for these tests & the course
  const visibilities = await TestVisibility.find({
    courseId,
    testId: { $in: testIds },
  }).lean();

  // 5️⃣ Fetch all groups that include this user
  const userGroups = await Group.find({ candidateIds: userId }).lean();
  const userGroupIds = userGroups.map(g => String(g._id));

  // 6️⃣ Filter tests based on visibility rules
  const filteredTests = populatedTests.filter((t) => {
    const visibility = visibilities.find(v => String(v.testId) === String(t.testId._id));

    if (!visibility) return true; // allow if no visibility

    const includedCandidates = (visibility.includeCandidates || []).map(String);
    const excludedCandidates = (visibility.excludeCandidates || []).map(String);
    const includedGroups = (visibility.includeGroups || []).map(String);
    const excludedGroups = (visibility.excludeGroups || []).map(String);

    const hasIncludes = includedCandidates.length > 0 || includedGroups.length > 0;
    const hasExcludes = excludedCandidates.length > 0 || excludedGroups.length > 0;

    // Includes take priority
    if (hasIncludes) {
      return includedCandidates.includes(String(userId)) ||
        includedGroups.some(gId => userGroupIds.includes(gId));
    }

    // Only excludes exist → allow everyone except excluded
    if (hasExcludes) {
      return !excludedCandidates.includes(String(userId)) &&
        !excludedGroups.some(gId => userGroupIds.includes(gId));
    }

    return true; // neither includes nor excludes → allow all
  });

  // 7️⃣ Map filtered tests to their sections
  const sectionMap = sections.map(sec => ({
    ...sec,
    tests: filteredTests.filter(t => String(t.sectionId) === String(sec._id)),
  }));

  return sectionMap;
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

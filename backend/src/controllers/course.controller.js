const Course = require("../models/course.model");
const CourseModule = require("../models/courseModule.model");
const CourseModuleSection = require("../models/courseModuleSection.model");
const CourseModuleSectionTest = require("../models/courseModuleSectionTest.model");
const TestConfiguration = require("../models/testConfiguration.model");
const TestVisibility = require("../models/testVisibility.model");
const mongoose = require("mongoose");

// ✅ Create Course (no change)
const createCourse = async (data) => {
  const { courseCode, name, createdBy, lastUpdatedBy } = data;

  if (!courseCode || !name || !createdBy) {
    const err = new Error("Missing required fields: courseCode, name, createdBy");
    err.status = 400;
    throw err;
  }

  const newCourse = new Course({
    courseCode,
    name,
    createdBy,
    lastUpdatedBy,
  });

  await newCourse.save();
  return { message: "Course created successfully", courseId: newCourse._id };
};

// ✅ Get all courses (FAST version)
const getAllCourses = async () => {
  return await Course.find()
    .select("courseCode name isActive createdBy lastUpdatedBy createdAt updatedAt") // only needed fields
    .sort({ createdAt: -1 })
    .lean(); // ⚡ MUCH faster
};

// ✅ Get Course By ID (FAST version)
const getCourseById = async (id) => {
  const course = await Course.findById(id)
    .select("courseCode name isActive createdBy lastUpdatedBy createdAt updatedAt") // no big arrays
    .lean(); // ⚡ plain object

  if (!course) {
    const err = new Error("Course not found");
    err.status = 404;
    throw err;
  }

  return course;
};

// ✅ Update Course
const updateCourse = async (id, updateData) => {
  updateData.lastUpdatedBy = updateData.lastUpdatedBy || null;
  updateData.updatedAt = new Date();

  const updated = await Course.findByIdAndUpdate(id, updateData, { new: true })
    .select("courseCode name isActive createdBy lastUpdatedBy createdAt updatedAt")
    .lean();

  if (!updated) {
    const err = new Error("Course not found or update failed");
    err.status = 404;
    throw err;
  }

  return updated;
};

// ✅ Soft delete (deactivate)
const deactivateCourse = async (id, userId) => {
  const updated = await Course.findByIdAndUpdate(
    id,
    { isActive: false, lastUpdatedBy: userId, updatedAt: new Date() },
    { new: true }
  )
    .select("_id isActive")
    .lean();

  if (!updated) {
    const err = new Error("Course not found or deactivate failed");
    err.status = 404;
    throw err;
  }

  return { message: "Course deactivated successfully", courseId: updated._id };
};

// const saveCourseModules = async (data) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   const { modules, userId, courseId } = data;

//   for (let module of modules) {
//     let moduleId = module.id || module._id;

//     // 🔹 Delete module
//     if (module.isDeleted && moduleId) {
//       // Cascading delete: sections & tests
//       const sections = await CourseModuleSection.find({ moduleId }).session(session);
//       for (let section of sections) {
//         await CourseModuleSectionTest.deleteMany({ sectionId: section._id }).session(session);
//       }
//       await CourseModuleSection.deleteMany({ moduleId }).session(session);
//       await CourseModule.deleteOne({ _id: moduleId }).session(session);
//       continue;
//     }

//     // 🔹 Create or Update Module
//     if (module.isNew) {
//       const newModule = new CourseModule({
//         courseId,
//         moduleName: module.moduleName,
//         moduleDescription: module.moduleDescription,
//         order: module.order,
//         createdBy: userId,
//         lastUpdatedBy: userId,
//       });
//       await newModule.save({ session });
//       moduleId = newModule._id;
//       module._id = moduleId; // ✅ replace temp id
//     } else if (module.isUpdated) {
//       await CourseModule.updateOne(
//         { _id: moduleId },
//         {
//           $set: {
//             moduleName: module.moduleName,
//             moduleDescription: module.moduleDescription,
//             order: module.order,
//             lastUpdatedBy: userId,
//           },
//         },
//         { session }
//       );
//     }

//     // 🔹 Handle Sections
//     for (let section of module.sections) {
//       let sectionId = section.id || section._id;

//       if (section.isDeleted && sectionId) {
//         await CourseModuleSectionTest.deleteMany({ sectionId }).session(session);
//         await CourseModuleSection.deleteOne({ _id: sectionId }).session(session);
//         continue;
//       }

//       if (section.isNew) {
//         const newSection = new CourseModuleSection({
//           moduleId,
//           sectionName: section.sectionName,
//           sectionDescription: section.sectionDescription,
//           order: section.order,
//           createdBy: userId,
//           lastUpdatedBy: userId,
//         });
//         await newSection.save({ session });
//         sectionId = newSection._id;
//         section._id = sectionId; // ✅ replace temp id
//       } else if (section.isUpdated) {
//         await CourseModuleSection.updateOne(
//           { _id: sectionId },
//           {
//             $set: {
//               sectionName: section.sectionName,
//               sectionDescription: section.sectionDescription,
//               order: section.order,
//               lastUpdatedBy: userId,
//             },
//           },
//           { session }
//         );
//       }

//       // 🔹 Handle Tests
//       for (let test of section.tests) {
//         let testId = test.id || test._id;

//         // ✅ Handle deletion
//         if (test.isDeleted && testId) {
//           const testRecord = await CourseModuleSectionTest.findOne({
//             courseId,
//             testId: test.testId,
//           }).session(session);

//           if (testRecord) {
//             if (testRecord.configurationId) {
//               await TestConfiguration.deleteOne({ _id: testRecord.configurationId }).session(session);
//             }
//             if (testRecord.visibilityId) {
//               await TestVisibility.deleteOne({ _id: testRecord.visibilityId }).session(session);
//             }

//             await CourseModuleSectionTest.deleteOne({
//               _id: testRecord._id,
//             }).session(session);
//           }

//           continue;
//         }

//         // ✅ Handle creation
//         if (test.isNew) {
//           const newTest = new CourseModuleSectionTest({
//             courseId, // 🔹 include courseId
//             sectionId,
//             testId: test.testId,
//             type: test.type,
//             configurationId: test.configurationId,
//             visibilityId: test.visibilityId,
//             order: test.order,
//             createdBy: userId,
//             lastUpdatedBy: userId,
//           });
//           await newTest.save({ session });
//           testId = newTest._id;
//           test._id = testId;
//         }

//         // ✅ Handle update
//         else if (test.isUpdated) {
//           await CourseModuleSectionTest.updateOne(
//             { _id: testId },
//             {
//               $set: {
//                 type: test.type,
//                 order: test.order,
//                 lastUpdatedBy: userId,
//               },
//             },
//             { session }
//           );
//         }
//       }
//     }
//   }

//   await session.commitTransaction();
//   session.endSession();

//   // 🔹 Fetch updated structure with proper population
//   const updatedModules = await CourseModule.find({ courseId })
//     .sort({ order: 1 })
//     .populate({
//       path: "sections",
//       options: { sort: { order: 1 } },
//       populate: {
//         path: "tests",
//         options: { sort: { order: 1 } },
//         populate: [{ path: "configuration" }, { path: "visibility" }],
//       },
//     })
//     .lean();

//   return { message: "Course saved successfully", modules: updatedModules };
// };

const saveCourseModules = async (data) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { modules, userId, courseId } = data;

  for (let module of modules) {
    let moduleId = module.id || module._id;

    // 🔹 Delete module
    if (module.isDeleted && moduleId) {
      // Cascading delete: sections & tests
      const sections = await CourseModuleSection.find({ moduleId }).session(session);
      for (let section of sections) {
        // 🔹 Delete test configurations and visibility for all tests in this section
        const tests = await CourseModuleSectionTest.find({ sectionId: section._id }).session(session);
        for (let test of tests) {
          // Delete TestConfiguration
          await TestConfiguration.deleteMany({
            testId: test.testId,
            courseId
          }).session(session);

          // Delete TestVisibility
          await TestVisibility.deleteMany({
            testId: test.testId,
            courseId
          }).session(session);
        }

        await CourseModuleSectionTest.deleteMany({ sectionId: section._id }).session(session);
      }
      await CourseModuleSection.deleteMany({ moduleId }).session(session);
      await CourseModule.deleteOne({ _id: moduleId }).session(session);
      continue;
    }

    // 🔹 Create or Update Module
    if (module.isNew) {
      const newModule = new CourseModule({
        courseId,
        moduleName: module.moduleName,
        moduleDescription: module.moduleDescription,
        order: module.order,
        createdBy: userId,
        lastUpdatedBy: userId,
      });
      await newModule.save({ session });
      moduleId = newModule._id;
      module._id = moduleId; // ✅ replace temp id
    } else if (module.isUpdated) {
      await CourseModule.updateOne(
        { _id: moduleId },
        {
          $set: {
            moduleName: module.moduleName,
            moduleDescription: module.moduleDescription,
            order: module.order,
            lastUpdatedBy: userId,
          },
        },
        { session }
      );
    }

    // 🔹 Handle Sections
    for (let section of module.sections) {
      let sectionId = section.id || section._id;

      if (section.isDeleted && sectionId) {
        // 🔹 Delete test configurations and visibility for all tests in this section
        const tests = await CourseModuleSectionTest.find({ sectionId }).session(session);
        for (let test of tests) {
          // Delete TestConfiguration
          await TestConfiguration.deleteMany({
            testId: test.testId,
            courseId
          }).session(session);

          // Delete TestVisibility
          await TestVisibility.deleteMany({
            testId: test.testId,
            courseId
          }).session(session);
        }

        await CourseModuleSectionTest.deleteMany({ sectionId }).session(session);
        await CourseModuleSection.deleteOne({ _id: sectionId }).session(session);
        continue;
      }

      if (section.isNew) {
        const newSection = new CourseModuleSection({
          moduleId,
          sectionName: section.sectionName,
          sectionDescription: section.sectionDescription,
          order: section.order,
          createdBy: userId,
          lastUpdatedBy: userId,
        });
        await newSection.save({ session });
        sectionId = newSection._id;
        section._id = sectionId; // ✅ replace temp id
      } else if (section.isUpdated) {
        await CourseModuleSection.updateOne(
          { _id: sectionId },
          {
            $set: {
              sectionName: section.sectionName,
              sectionDescription: section.sectionDescription,
              order: section.order,
              lastUpdatedBy: userId,
            },
          },
          { session }
        );
      }

      // 🔹 Handle Tests
      for (let test of section.tests) {
        let testId = test.id || test._id;

        // ✅ Handle deletion - FIXED LOGIC
        if (test.isDeleted && testId) {
          // Find the test record to be deleted
          const testRecord = await CourseModuleSectionTest.findOne({
            _id: testId // Use the actual testRecord _id, not testId field
          }).session(session);

          if (testRecord) {
            // Delete TestConfiguration using testId and courseId
            await TestConfiguration.deleteMany({
              testId: testRecord.testId, // Use testRecord.testId (the actual test reference)
              courseId
            }).session(session);

            // Delete TestVisibility using testId and courseId
            await TestVisibility.deleteMany({
              testId: testRecord.testId, // Use testRecord.testId (the actual test reference)
              courseId
            }).session(session);

            // Delete the CourseModuleSectionTest record
            await CourseModuleSectionTest.deleteOne({
              _id: testRecord._id
            }).session(session);
          }

          continue;
        }

        // ✅ Handle creation
        if (test.isNew) {
          const newTest = new CourseModuleSectionTest({
            courseId, // 🔹 include courseId
            sectionId,
            testId: test.testId,
            type: test.type,
            configurationId: test.configurationId,
            visibilityId: test.visibilityId,
            order: test.order,
            createdBy: userId,
            lastUpdatedBy: userId,
          });
          await newTest.save({ session });
          testId = newTest._id;
          test._id = testId;
        }

        // ✅ Handle update
        else if (test.isUpdated) {
          await CourseModuleSectionTest.updateOne(
            { _id: testId },
            {
              $set: {
                type: test.type,
                order: test.order,
                lastUpdatedBy: userId,
              },
            },
            { session }
          );
        }
      }
    }
  }

  await session.commitTransaction();
  session.endSession();

  // 🔹 Fetch updated structure with proper population
  const updatedModules = await CourseModule.find({ courseId })
    .sort({ order: 1 })
    .populate({
      path: "sections",
      options: { sort: { order: 1 } },
      populate: {
        path: "tests",
        options: { sort: { order: 1 } },
        populate: [{ path: "configuration" }, { path: "visibility" }],
      },
    })
    .lean();

  return { message: "Course saved successfully", modules: updatedModules };
};


module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deactivateCourse,
  saveCourseModules
};

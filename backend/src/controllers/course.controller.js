const Course = require("../models/course.model");

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

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deactivateCourse,
};

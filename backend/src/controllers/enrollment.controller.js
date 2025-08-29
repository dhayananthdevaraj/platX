const Enrollment = require('../models/enrollment.model');

// Create Enrollment
const createEnrollment = async (data) => {
  const { batchId, courseId, createdBy, lastUpdatedBy } = data;

  if (!batchId || !courseId || !createdBy) {
    const err = new Error('Missing required fields');
    err.status = 400;
    throw err;
  }

  const enrollment = new Enrollment({
    batchId,
    courseId,
    createdBy,
    lastUpdatedBy
  });

  await enrollment.save();

  return {
    message: 'Enrollment created successfully',
    enrollmentId: enrollment._id
  };
};

// Get All Enrollments
// ✅ Get All Enrollments (with Batch + Institute + User details)
const getAllEnrollments = async () => {
  return await Enrollment.find()
    .populate({
      path: 'batchId',
      populate: { path: 'instituteId' } // 🟢 Institute inside Batch
    })
    .populate('courseId') // course basic details
    .populate('createdBy', 'name email role')
    .populate('lastUpdatedBy', 'name email role');
};

// Get Enrollment by ID
const getEnrollmentById = async (id) => {
  const enrollment = await Enrollment.findById(id);
  if (!enrollment) {
    const err = new Error('Enrollment not found');
    err.status = 404;
    throw err;
  }
  return enrollment;
};

// Update Enrollment
const updateEnrollment = async (id, updateData) => {
  updateData.updatedAt = new Date();

  const updated = await Enrollment.findByIdAndUpdate(id, updateData, {
    new: true
  });

  if (!updated) { 
    const err = new Error('Enrollment not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};
// ✅ Get Enrollments by Course ID
const getEnrollmentsByCourseId = async (courseId) => {
  const enrollments = await Enrollment.find({ courseId })
    .populate({
      path: 'batchId',
      populate: { path: 'instituteId' } // 🟢 include institute details inside batch
    })
    .populate('courseId') // course details
    .populate('createdBy', 'name email role')
    .populate('lastUpdatedBy', 'name email role');

  // if (!enrollments || enrollments.length === 0) {
  //   const err = new Error('No enrollments found for this course');
  //   err.status = 404;
  //   throw err;
  // }

  return enrollments;
};

module.exports = {
  createEnrollment,
  getAllEnrollments,
  getEnrollmentById,
  updateEnrollment,
  getEnrollmentsByCourseId
};

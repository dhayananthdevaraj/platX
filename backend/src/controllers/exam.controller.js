const Exam = require('../models/exam.model');

// Create a new exam
const createExam = async (data) => {
  const { name, examCode, instituteId, createdBy, lastUpdatedBy } = data;

  if (!name || !examCode || !createdBy) {
    const err = new Error('Missing required fields: name, examCode, or createdBy');
    err.status = 400;
    throw err;
  }

  const exam = new Exam({
    name,
    examCode,
    instituteId: instituteId || [],
    createdBy,
    lastUpdatedBy
  });

  await exam.save();

  return {
    message: 'Exam created successfully',
    examId: exam._id
  };
};

// Get all exams
const getAllExams = async () => {
  const exams = await Exam.find();
  return exams;
};

// Get a single exam by ID
const getExamById = async (id) => {
  const exam = await Exam.findById(id);
  if (!exam) {
    const err = new Error('Exam not found');
    err.status = 404;
    throw err;
  }
  return exam;
};

// Update an exam
const updateExam = async (id, updateData) => {
  updateData.updatedAt = new Date();

  const updatedExam = await Exam.findByIdAndUpdate(id, updateData, { new: true });
  if (!updatedExam) {
    const err = new Error('Exam not found or update failed');
    err.status = 404;
    throw err;
  }
  return updatedExam;
};

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam
};

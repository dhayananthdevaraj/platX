const Question = require('../models/question.model');
const XLSX = require('xlsx');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

// Create Question
const createQuestion = async (data) => {
  const {
    text,
    options,
    correctAnswerIndex,
    explanation,
    questionSetId,
    createdBy,
    lastUpdatedBy,
    difficulty,
    tags
  } = data;

  if (
    !text ||
    !options ||
    options.length < 2 ||
    correctAnswerIndex === undefined ||
    !questionSetId ||
    createdBy === undefined
  ) {
    const err = new Error('Missing or invalid required fields');
    err.status = 400;
    throw err;
  }

  const newQuestion = new Question({
    text,
    options,
    correctAnswerIndex,
    explanation,
    questionSetId,
    createdBy,
    lastUpdatedBy,
    difficulty,  // ✅ new
    tags         // ✅ new
  });

  await newQuestion.save();

  return {
    message: 'Question created successfully',
    questionId: newQuestion._id
  };
};

// Get All Questions
const getAllQuestions = async () => {
  return await Question.find();
};

const getQuestionsByQuestionSetId = async (questionSetId) => {
  try {
    const questions = await Question.find({ questionSetId }).populate("questionSetId", "name"); // ✅ only populate name field
    ;
    if (!questions || questions.length === 0) {
      const err = new Error('No questions found for this Question Set');
      err.status = 404;
      throw err;
    }
    return questions;
  } catch (err) {
    console.error('Error fetching questions by QuestionSetId:', err);
    throw err;
  }
};

// Get Question By ID
const getQuestionById = async (id) => {
  const question = await Question.findById(id);
  if (!question) {
    const err = new Error('Question not found');
    err.status = 404;
    throw err;
  }
  return question;
};

// Update Question
const updateQuestion = async (id, updateData) => {
  updateData.updatedAt = new Date();

  const updated = await Question.findByIdAndUpdate(id, updateData, {
    new: true
  });

  if (!updated) {
    const err = new Error('Question not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};

// Import Questions from Excel
const importQuestionsFromExcel = async (file, { questionSetId, createdBy }) => {
  const workbook = XLSX.readFile(file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  if (!rows || rows.length === 0) {
    throw new Error('No question data found in Excel file');
  }

  const now = new Date();
  const questions = [];

  for (const row of rows) {
    const {
      text,
      option1, option2, option3, option4,
      correctAnswerIndex,
      explanation = '',
      difficulty = 'Medium',   // ✅ new
      tags = ''                // ✅ new (comma-separated in Excel)
    } = row;

    if (!text || correctAnswerIndex === undefined || !option1 || !option2) continue;

    const options = [option1, option2];
    if (option3) options.push(option3);
    if (option4) options.push(option4);

    questions.push({
      text: text.trim(),
      options,
      correctAnswerIndex: Number(correctAnswerIndex),
      explanation,
      questionSetId,
      createdBy,
      lastUpdatedBy: createdBy,
      difficulty,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean), // ✅ convert string -> array
      createdAt: now,
      updatedAt: now,
      isActive: true
    });
  }

  try {
    const inserted = await Question.insertMany(questions, { ordered: false });
    return {
      message: 'Questions import completed',
      createdCount: inserted.length,
      skipped: questions.length - inserted.length
    };
  } catch (err) {
    if (err.code === 11000 || err.writeErrors) {
      const insertedCount = err.result?.nInserted || 0;
      return {
        message: 'Questions import partially completed',
        createdCount: insertedCount,
        skipped: questions.length - insertedCount,
        error: 'Some duplicate questions were skipped'
      };
    }
    throw err;
  }
};

const cloneQuestions = async (questionIds, createdBy) => {
  if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
    const err = new Error('questionIds (array) are required');
    err.status = 400;
    throw err;
  }

  // Fetch original questions
  const originalQuestions = await Question.find({ _id: { $in: questionIds } });

  if (!originalQuestions || originalQuestions.length === 0) {
    const err = new Error('No questions found to clone');
    err.status = 404;
    throw err;
  }

  const now = new Date();

  // Prepare clones
  const clonedQuestions = originalQuestions.map(q => {
    const cloned = q.toObject(); // convert Mongoose doc to plain object
    delete cloned._id;           // remove _id so MongoDB can generate new one
    cloned.createdAt = now;
    cloned.updatedAt = now;
    cloned.createdBy = createdBy || q.createdBy;
    cloned.lastUpdatedBy = createdBy || q.lastUpdatedBy;
    return cloned;
  });

  // Insert cloned docs
  const inserted = await Question.insertMany(clonedQuestions);

  return {
    message: `${inserted.length} questions cloned successfully`,
    clonedCount: inserted.length,
    questionIds: inserted.map(q => q._id)
  };
};

// Move questions to another Question Set
const moveQuestionsToAnotherSet = async (questionIds, targetQuestionSetId) => {
  if (!questionIds || !Array.isArray(questionIds) || !targetQuestionSetId) {
    const err = new Error('questionIds and targetQuestionSetId are required');
    err.status = 400;
    throw err;
  }

  const result = await Question.updateMany(
    { _id: { $in: questionIds } },
    { $set: { questionSetId: targetQuestionSetId, updatedAt: new Date() } }
  );

  return { message: `${result.modifiedCount} questions moved successfully`, modifiedCount: result.modifiedCount };
};

const moveQuestions = async (data) => {
  const { questionIds, targetQuestionSetId } = data;

  if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0 || !targetQuestionSetId) {
    const err = new Error('questionIds (array) and targetQuestionSetId are required');
    err.status = 400;
    throw err;
  }

  const result = await Question.updateMany(
    { _id: { $in: questionIds } },
    { $set: { questionSetId: targetQuestionSetId, updatedAt: new Date() } }
  );

  return {
    message: `${result.modifiedCount} questions moved successfully`,
    modifiedCount: result.modifiedCount
  };
};


module.exports = {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  importQuestionsFromExcel,
  getQuestionsByQuestionSetId,
  moveQuestions,
  cloneQuestions
};
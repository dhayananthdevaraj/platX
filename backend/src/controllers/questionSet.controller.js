const QuestionSet = require('../models/questionSet.model');
const Question = require('../models/question.model');
const XLSX = require('xlsx');

// Create QuestionSet
const createQuestionSet = async (data) => {
  const { name, code, examId, subjectId, chapterId, instituteId, createdBy, lastUpdatedBy } = data;

  if (!name || !code || !examId || !subjectId || !chapterId || !createdBy) {
    const err = new Error('Missing required fields');
    err.status = 400;
    throw err;
  }

  const newSet = new QuestionSet({
    name,
    code,
    examId,
    subjectId,
    chapterId,
    instituteId: instituteId || [],
    createdBy,
    lastUpdatedBy
  });

  await newSet.save();

  return {
    message: 'Question Set created successfully',
    questionSetId: newSet._id
  };
};


// Get All Question Sets with populated references
const getAllQuestionSets = async () => {
  return await QuestionSet.find()
    .populate("examId", "name examCode") // only exam name & code
    .populate("subjectId", "name subjectCode") // only subject details
    .populate("chapterId", "name chapterCode") // only chapter details
    .populate("instituteId", "name code") // array of institutes → only name & code
    .populate("createdBy", "name email") // optional: user who created
    .populate("lastUpdatedBy", "name email"); // optional: user who last updated
};


// Get Question Set By ID
const getQuestionSetById = async (id) => {
  const questionSet = await QuestionSet.findById(id)
    .populate("examId", "name examCode")
    .populate("subjectId", "name subjectCode")
    .populate("chapterId", "name chapterCode")
    .populate("instituteId", "name code")
    .populate("createdBy", "name email")
    .populate("lastUpdatedBy", "name email");

  if (!questionSet) {
    const err = new Error('Question Set not found');
    err.status = 404;
    throw err;
  }
  return questionSet;
};

// Update Question Set
const updateQuestionSet = async (id, updateData) => {
  updateData.updatedAt = new Date();

  const updated = await QuestionSet.findByIdAndUpdate(id, updateData, {
    new: true
  });

  if (!updated) {
    const err = new Error('Question Set not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};

const importQuestionSetsFromExcel = async (file, { examId, subjectId, chapterId, instituteIds = [], createdBy }) => {
  const workbook = XLSX.readFile(file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const sets = XLSX.utils.sheet_to_json(sheet);

  if (!sets || sets.length === 0) {
    throw new Error('No question set data found in Excel file');
  }

  const now = new Date();
  const newSets = [];

  for (const { name, code } of sets) {
    if (!name || !code) continue;
  
    newSets.push({
      name: name.trim(),
      code: code.trim(),
      examId,
      subjectId,
      chapterId,
      instituteId: instituteIds,
      createdBy,
      lastUpdatedBy: createdBy,
      createdAt: now,
      updatedAt: now,
      isActive: true
    });
  }

  try {
    const inserted = await QuestionSet.insertMany(newSets, { ordered: false });
    return {
      message: 'Question set import completed',
      createdCount: inserted.length,
      skipped: newSets.length - inserted.length
    };
  } catch (err) {
    if (err.code === 11000) {
      return {
        message: 'Question set import partially completed',
        createdCount: err.result?.nInserted || 0,
        skipped: newSets.length - (err.result?.nInserted || 0),
        error: 'Some duplicate entries were skipped'
      };
    }
    throw err;
  }
};

const cloneQuestionSets = async (questionSetIds, createdBy, name, code) => {
  if (!questionSetIds || !Array.isArray(questionSetIds) || questionSetIds.length === 0) {
    const err = new Error('questionSetIds (array) are required');
    err.status = 400;
    throw err;
  }

  const originalSets = await QuestionSet.find({ _id: { $in: questionSetIds } });

  if (!originalSets || originalSets.length === 0) {
    const err = new Error('No Question Sets found to clone');
    err.status = 404;
    throw err;
  }

  const now = new Date();

  // step 1: clone question sets
  const clonedSetsData = originalSets.map((set, index) => {
    const cloned = set.toObject();
    delete cloned._id;

    // 🔑 If name/code provided from frontend, use them for the FIRST clone only
    // If multiple sets, suffix them to avoid duplicates
    if (name && code) {
      cloned.name = index === 0 ? name : `${name} (${index + 1})`;
      cloned.code = index === 0 ? code : `${code}_${index + 1}`;
    } else {
      cloned.name = `${cloned.name} (Copy)`;
      cloned.code = `${cloned.code}_${Date.now()}_${index}`;
    }

    cloned.createdAt = now;
    cloned.updatedAt = now;
    cloned.createdBy = createdBy || set.createdBy;
    cloned.lastUpdatedBy = createdBy || set.lastUpdatedBy;

    return cloned;
  });

  const insertedSets = await QuestionSet.insertMany(clonedSetsData);

  // step 2: clone questions
  let totalClonedQuestions = 0;

  for (let i = 0; i < originalSets.length; i++) {
    const originalSet = originalSets[i];
    const clonedSet = insertedSets[i];

    const questions = await Question.find({ questionSetId: originalSet._id });

    if (questions.length > 0) {
      const clonedQuestions = questions.map(q => {
        const obj = q.toObject();
        delete obj._id;
        obj.questionSetId = clonedSet._id;
        obj.createdAt = now;
        obj.updatedAt = now;
        obj.createdBy = createdBy || q.createdBy;
        obj.lastUpdatedBy = createdBy || q.lastUpdatedBy;
        return obj;
      });

      const insertedQuestions = await Question.insertMany(clonedQuestions);
      totalClonedQuestions += insertedQuestions.length;
    }
  }

  return {
    message: `${insertedSets.length} Question Sets cloned successfully with ${totalClonedQuestions} Questions`,
    clonedSets: insertedSets.map(s => ({ id: s._id, name: s.name, code: s.code })),
    clonedQuestions: totalClonedQuestions
  };
};

module.exports = {
  createQuestionSet,
  getAllQuestionSets,
  getQuestionSetById,
  updateQuestionSet,
  importQuestionSetsFromExcel,
  cloneQuestionSets
};

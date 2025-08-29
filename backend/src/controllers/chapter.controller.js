const Chapter = require('../models/chapter.model');
const XLSX = require('xlsx');

// Create Chapter
const createChapter = async (data) => {
  const { name, chapterCode, examId, subjectId, instituteId, createdBy, lastUpdatedBy } = data;

  if (!name || !chapterCode || !examId || !subjectId || !createdBy) {
    const err = new Error('Missing required fields');
    err.status = 400;
    throw err;
  }

  const newChapter = new Chapter({
    name,
    chapterCode,
    examId,
    subjectId,
    instituteId: instituteId || [],
    createdBy,
    lastUpdatedBy
  });

  await newChapter.save();

  return {
    message: 'Chapter created successfully',
    chapterId: newChapter._id
  };
};

const getAllChapters = async () => {
  try {
    const chapters = await Chapter.find()
      .populate({
        path: 'examId',
        select: 'name examCode isActive' // ✅ Include only required fields from Exam
      })
      .populate({
        path: 'subjectId',
        select: 'name code isActive' // ✅ Include only required fields from Subject
      })
      .populate({
        path: 'instituteId',
        select: 'name code isActive' // ✅ Include only required fields from Institute
      })
      .populate({
        path: 'createdBy',
        select: 'firstName lastName email' // Optional, to show who created the chapter
      })
      .populate({
        path: 'lastUpdatedBy',
        select: 'firstName lastName email' // Optional, to show last editor
      })
      .sort({ createdAt: -1 }); // ✅ Sort by latest created

    return chapters;
  } catch (error) {
    console.error('Error fetching chapters:', error);
    throw new Error('Failed to fetch chapters');
  }
};
// Get Chapter By ID
const getChapterById = async (id) => {
  const chapter = await Chapter.findById(id);
  if (!chapter) {
    const err = new Error('Chapter not found');
    err.status = 404;
    throw err;
  }
  return chapter;
};

// Update Chapter
const updateChapter = async (id, updateData) => {
  updateData.updatedAt = new Date();

  const updatedChapter = await Chapter.findByIdAndUpdate(id, updateData, {
    new: true
  });

  if (!updatedChapter) {
    const err = new Error('Chapter not found or update failed');
    err.status = 404;
    throw err;
  }

  return updatedChapter;
};

// Import Chapters From Excel
const importChaptersFromExcel = async (file, { examId, subjectId, createdBy }) => {
  const workbook = XLSX.readFile(file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  if (!rows || rows.length === 0) {
    throw new Error('No chapter data found in Excel file');
  }

  const now = new Date();
  const newChapters = [];

  for (const { name, chapterCode } of rows) {
    if (!name || !chapterCode) continue;

    newChapters.push({
      name: name.trim(),
      chapterCode: chapterCode.trim(),
      examId,
      subjectId,
      createdBy,
      lastUpdatedBy: createdBy,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }

  try {
    const inserted = await Chapter.insertMany(newChapters, { ordered: false });
    return {
      message: 'Chapter import completed',
      createdCount: inserted.length,
      skipped: newChapters.length - inserted.length
    };
  } catch (err) {
    if (err.code === 11000) {
      return {
        message: 'Chapter import partially completed',
        createdCount: err.result?.nInserted || 0,
        error: 'Some duplicate entries were skipped'
      };
    }
    throw err;
  }
};

module.exports = {
  createChapter,
  getAllChapters,
  getChapterById,
  updateChapter,
  importChaptersFromExcel
};

const Question = require('../models/question.model');
const XLSX = require('xlsx');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');


const { BlobServiceClient } = require('@azure/storage-blob');
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "question-images"; // your container name


const uploadImagesToBlob = async (files) => {
  if (!files || files.length === 0) return [];

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

  const urls = [];

  for (const file of files) {
    // Generate unique blob name
    const fileExtension = file.filename ? file.filename.split('.').pop() : 'jpg';
    const blobName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload file buffer
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    urls.push(blockBlobClient.url);
  }

  return urls;
};

const deleteImagesFromBlob = async (urls = []) => {
  if (!urls.length) return;

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

  for (const url of urls) {
    try {
      // Parse the URL to extract blob name more reliably
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Remove container name from path if present
      // Azure blob URLs typically follow: https://account.blob.core.windows.net/container/blobname
      const pathParts = pathname.split('/').filter(part => part); // Remove empty parts
      const blobName = pathParts.length > 1 ? pathParts.slice(1).join('/') : pathParts[0];

      if (!blobName) {
        console.error("Could not extract blob name from URL:", url);
        continue;
      }

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const deleteResponse = await blockBlobClient.deleteIfExists();

      if (deleteResponse.succeeded) {
        console.log(`Successfully deleted blob: ${blobName}`);
      } else {
        console.log(`Blob not found (already deleted?): ${blobName}`);
      }
    } catch (err) {
      console.error(`Error deleting blob from URL ${url}:`, err.message);
    }
  }
};

const createQuestion = async (data, files = []) => {
  let {
    text,
    options,
    correctAnswerIndex,
    explanation,
    questionSetId,
    createdBy,
    lastUpdatedBy,
    difficulty,
    tags,
    isActive
  } = data;

  console.log("raw data", data);

  // 🛠 Normalize fields (since form-data sends them as strings)
  try {
    if (typeof options === 'string') options = JSON.parse(options);
  } catch {
    options = [options];
  }

  try {
    if (typeof tags === 'string') tags = JSON.parse(tags);
  } catch {
    tags = [tags];
  }


  if (typeof correctAnswerIndex === 'string') {
    correctAnswerIndex = parseInt(correctAnswerIndex, 10);
  }

  if (typeof isActive === 'string') {
    isActive = isActive === 'true';
  }

  if (
    !text ||
    !options ||
    options.length < 2 ||
    correctAnswerIndex === undefined ||
    !questionSetId ||
    !createdBy
  ) {
    const err = new Error('Missing or invalid required fields');
    err.status = 400;
    throw err;
  }

  // Separate regular images from Quill images
  const quillImages = files.filter(f => f.fieldname === 'quillImages');

  // Upload all images to blob storage
  const [quillImageUrls] = await Promise.all([
    uploadImagesToBlob(quillImages)
  ]);

  // Process question text to replace dummy URLs with actual blob URLs
  let processedText = text;
  quillImageUrls.forEach((url, index) => {
    const dummyUrl = `temp-image-${index}`;
    processedText = processedText.replace(new RegExp(dummyUrl, 'g'), url);
  });



  const newQuestion = new Question({
    text: processedText, // Contains embedded Quill images with real URLs
    options,
    correctAnswerIndex,
    explanation,
    questionSetId,
    createdBy,
    lastUpdatedBy,
    difficulty,
    tags,
    isActive
  });

  console.log("newQuestion", newQuestion);
  await newQuestion.save();

  return {
    message: 'Question created successfully',
    questionId: newQuestion._id
  };
};

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


const updateQuestion = async (id, updateData, files = []) => {
  updateData.updatedAt = new Date();

  // Normalize incoming fields
  const parseJSON = (val, fallback) => {
    try {
      return typeof val === "string" ? JSON.parse(val) : val;
    } catch {
      return fallback;
    }
  };

  updateData.options = parseJSON(updateData.options, [updateData.options]);
  updateData.tags = parseJSON(updateData.tags, [updateData.tags]);
  if (typeof updateData.correctAnswerIndex === "string")
    updateData.correctAnswerIndex = parseInt(updateData.correctAnswerIndex, 10);
  if (typeof updateData.isActive === "string")
    updateData.isActive = updateData.isActive === "true";

  // ✅ Fetch current record
  const existing = await Question.findById(id);
  if (!existing) {
    const err = new Error("Question not found");
    err.status = 404;
    throw err;
  }

  // Quill embedded difference
  const oldQuillUrls_delete = extractImageUrls(existing.text || "");
  const newQuillUrls_delete = extractImageUrls(updateData.text || existing.text);
  const removedQuill = oldQuillUrls_delete.filter(u => !newQuillUrls_delete.includes(u));

  // Delete all removed blobs
  await deleteImagesFromBlob(removedQuill);

  const quillImages = files.filter(f => f.fieldname === "quillImages");

  const newQuillUrls = await uploadImagesToBlob(quillImages)

  // Replace any temporary placeholders in the text with actual blob URLs
  let processedText = updateData.text || existing.text;
  newQuillUrls.forEach((url, idx) => {
    const dummy = `temp-image-${idx}`;
    processedText = processedText.replace(new RegExp(dummy, "g"), url);
  });
  updateData.text = processedText;

  // ✅ Update DB
  const updated = await Question.findByIdAndUpdate(id, updateData, { new: true });
  if (!updated) {
    const err = new Error("Update failed");
    err.status = 404;
    throw err;
  }

  return {
    message: "Question updated successfully",
    questionId: updated._id
  };
};


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

function extractImageUrls(html) {
  if (!html || typeof html !== "string") return [];
  const regex = /<img[^>]+src="([^">]+)"/g;
  const urls = [];
  let match;
  while ((match = regex.exec(html))) {
    urls.push(match[1]);
  }
  return urls;
}
function collectAllImageUrls(questionDoc) {
  const urls = [];

  // Quill or CKEditor HTML field (optional)
  if (questionDoc.text) {
    urls.push(...extractImageUrls(questionDoc.text));
  }

  // Optional images array
  if (questionDoc.images && Array.isArray(questionDoc.images)) {
    urls.push(...questionDoc.images);
  }

  return urls; // [] if nothing found
}

const deleteQuestions = async (ids) => {
  const questionIds = Array.isArray(ids) ? ids : [ids];

  const questions = await Question.find({ _id: { $in: questionIds } });
  if (!questions || questions.length === 0) {
    const err = new Error("No questions found for deletion");
    err.status = 404;
    throw err;
  }

  // ✅ Collect all image URLs (optional)
  let urlsToDelete = [];
  for (const q of questions) {
    urlsToDelete.push(...collectAllImageUrls(q));
  }

  // ✅ Delete blobs if any exist
  if (urlsToDelete.length > 0) {
    await deleteImagesFromBlob(urlsToDelete);
  }

  // ✅ Delete DB docs
  await Question.deleteMany({ _id: { $in: questionIds } });

  return {
    message: `${questions.length} question(s) deleted permanently`,
    deletedCount: questions.length,
    deletedIds: questionIds
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
  cloneQuestions,
  deleteQuestions
};
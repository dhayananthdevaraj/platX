const Batch = require('../models/batch.model');
const XLSX = require('xlsx');
const { countDocuments } = require('../models/subject.model');

// Create a new batch
const createBatch = async (data) => {
  const { name, instituteId,code, year, createdBy } = data;

  if (!name || !instituteId || !year||!code) {
    const err = new Error('Missing required fields: name, instituteId, or year');
    err.status = 400;
    throw err;
  }

  const batch = new Batch({
    name,
    code,
    instituteId,
    year,
    createdBy
  });

  await batch.save();

  return {
    message: 'Batch created successfully',
    batchId: batch._id
  };
};

// Get all batches (active and inactive)
const getAllBatches = async () => {
  const batches = await Batch.find(); // returns all including inactive
  return batches;
};

// Get a specific batch by ID
const getBatchById = async (id) => {
  const batch = await Batch.findById(id);
  if (!batch) {
    const err = new Error('Batch not found');
    err.status = 404;
    throw err;
  }
  return batch;
};

// Update a batch (including activating/deactivating via isActive)
const updateBatch = async (id, updateData) => {
  updateData.updatedAt = new Date();

  const updatedBatch = await Batch.findByIdAndUpdate(id, updateData, { new: true });
  if (!updatedBatch) {
    const err = new Error('Batch not found or update failed');
    err.status = 404;
    throw err;
  }

  return updatedBatch;
};


const importBatchesFromExcel = async (file, { instituteId, createdBy }) => {
  const workbook = XLSX.readFile(file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const batches = XLSX.utils.sheet_to_json(sheet);

  if (!batches || batches.length === 0) {
    throw new Error('No batch data found in Excel file');
  }

  const now = new Date();
  const newBatches = [];

  for (const { name, year,code } of batches) {
    if (!name || !year || !code) continue;

    newBatches.push({
      name: name.trim(),
      year,
      code,
      instituteId,
      createdBy,
      lastUpdatedBy: createdBy,
      createdAt: now,
      updatedAt: now,
      isActive: true
    });
  }

  try {
    const inserted = await Batch.insertMany(newBatches, { ordered: false });
    return {
      message: 'Batch import completed',
      createdCount: inserted.length,
      skipped: newBatches.length - inserted.length
    };
  } catch (err) {
    if (err.code === 11000) {
      return {
        message: 'Batch import partially completed',
        createdCount: err.result?.nInserted || 0,
        skipped: newBatches.length - (err.result?.nInserted || 0),
        error: 'Some duplicate entries were skipped'
      };
    }
    throw err;
  }
};



const getBatchesByInstituteId = async (instituteId) => {
  if (!instituteId) {
    throw new Error('instituteId is required');
  }
    return await Batch.find({ instituteId })
    .populate('instituteId', 'name code')       // Only fetch institute name & code
    .populate('createdBy', 'name email')        // User details of creator
    .populate('lastUpdatedBy', 'name email'); 
};

module.exports = {
  createBatch,
  getAllBatches,
  getBatchById,
  updateBatch,
  getBatchesByInstituteId,
  importBatchesFromExcel
};

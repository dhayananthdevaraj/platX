const Institute = require('../models/institute.model');

// Create a new institute
const createInstitute = async (data) => {
  const {
    name,
    code,
    email,
    address,
    contact,
    location,
    subscriptionType,
    capacity,
    createdBy,
    lastUpdatedBy
  } = data;

  if (
    !name || !code || !email || !address ||
    !contact || !location || !subscriptionType || !createdBy
  ) {
    const err = new Error('Missing required fields');
    err.status = 400;
    throw err;
  }

  const newInstitute = new Institute({
    name,
    code,
    email,
    address,
    contact,
    location,
    subscriptionType,
    capacity,
    createdBy,
    lastUpdatedBy
  });

  await newInstitute.save();

  return {
    message: 'Institute created successfully',
    instituteId: newInstitute._id
  };
};

// Get all institutes (active and inactive)
const getAllInstitutes = async () => {
  const institutes = await Institute.find();
  return institutes;
};

// Get one institute by ID
const getInstituteById = async (id) => {
  const institute = await Institute.findById(id);
  if (!institute) {
    const err = new Error('Institute not found');
    err.status = 404;
    throw err;
  }
  return institute;
};

// Update institute
const updateInstitute = async (id, updateData) => {
  updateData.updatedAt = new Date();

  const updatedInstitute = await Institute.findByIdAndUpdate(id, updateData, { new: true });
  if (!updatedInstitute) {
    const err = new Error('Institute not found or update failed');
    err.status = 404;
    throw err;
  }

  return updatedInstitute;
};

module.exports = {
  createInstitute,
  getAllInstitutes,
  getInstituteById,
  updateInstitute
};

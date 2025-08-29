const Test = require('../models/test.model');



// Create Test
const createTest = async (data) => {
  const { name,code, description, sections, createdBy, lastUpdatedBy } = data;

  console.log("data",data);
  // Validate required fields
  if (!name || !createdBy || !code) {
    const err = new Error('Missing required fields: name, code and createdBy are mandatory');
    err.status = 400;
    throw err;
  }

  // Validate sections if provided
  if (sections) {
    if (!Array.isArray(sections) || sections.length === 0) {
      const err = new Error('Sections must be a non-empty array if provided');
      err.status = 400;
      throw err;
    }

    // Validate each section
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section.sectionName || !section.sectionName.trim()) {
        const err = new Error(`Section ${i + 1} must have a valid sectionName`);
        err.status = 400;
        throw err;
      }
      
      if (section.questions && !Array.isArray(section.questions)) {
        const err = new Error(`Section ${i + 1} questions must be an array`);
        err.status = 400;
        throw err;
      }
    }
  }

  // Generate unique code

  const newTest = new Test({
    code,
    name,
    description,
    sections: sections || [],
    createdBy,
    lastUpdatedBy: lastUpdatedBy || createdBy
  });

  await newTest.save();

  return {
    message: 'Test created successfully',
    testId: newTest._id,
    code: newTest.code
  };
};

// Get All Tests
const getAllTests = async (filters = {}) => {
  const query = {};
  
  // Add filters if provided
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  
  if (filters.createdBy) {
    query.createdBy = filters.createdBy;
  }

  return await Test.find(query)
    .populate('createdBy', 'name email')
    .populate('lastUpdatedBy', 'name email')
    .populate('sections.questions')
    .sort({ createdAt: -1 });
};

// Get Test By ID
const getTestById = async (id) => {
  const test = await Test.findById(id)
    .populate('createdBy', 'name email')
    .populate('lastUpdatedBy', 'name email')
    .populate('sections.questions');
    
  if (!test) {
    const err = new Error('Test not found');
    err.status = 404;
    throw err;
  }
  
  return test;
};


// Update Test
const updateTest = async (id, updateData, updatedBy) => {
  // Remove fields that shouldn't be updated directly
  const { code, createdBy, createdAt, ...allowedUpdates } = updateData;
  
  // Set audit fields
  allowedUpdates.lastUpdatedBy = updatedBy;
  allowedUpdates.updatedAt = new Date();

  // Validate sections if being updated
  if (allowedUpdates.sections) {
    if (!Array.isArray(allowedUpdates.sections)) {
      const err = new Error('Sections must be an array');
      err.status = 400;
      throw err;
    }

    for (let i = 0; i < allowedUpdates.sections.length; i++) {
      const section = allowedUpdates.sections[i];
      if (!section.sectionName || !section.sectionName.trim()) {
        const err = new Error(`Section ${i + 1} must have a valid sectionName`);
        err.status = 400;
        throw err;
      }
      
      if (section.questions && !Array.isArray(section.questions)) {
        const err = new Error(`Section ${i + 1} questions must be an array`);
        err.status = 400;
        throw err;
      }
    }
  }

  const updated = await Test.findByIdAndUpdate(id, allowedUpdates, {
    new: true,
    runValidators: true
  })
    .populate('createdBy', 'name email')
    .populate('lastUpdatedBy', 'name email')
    .populate('sections.questions');

  if (!updated) {
    const err = new Error('Test not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};

// // Delete Test (Soft delete by setting isActive to false)
// const deleteTest = async (id, deletedBy) => {
//   const updated = await Test.findByIdAndUpdate(
//     id, 
//     { 
//       isActive: false, 
//       lastUpdatedBy: deletedBy,
//       updatedAt: new Date()
//     },
//     { new: true }
//   );

//   if (!updated) {
//     const err = new Error('Test not found');
//     err.status = 404;
//     throw err;
//   }

//   return {
//     message: 'Test deactivated successfully',
//     testId: updated._id
//   };
// };

module.exports = {
  createTest,
  getAllTests,
  getTestById,
  updateTest,
  // deleteTest
};
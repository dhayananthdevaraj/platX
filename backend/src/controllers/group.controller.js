const Group = require('../models/group.model');

// Create Group
const createGroup = async (data) => {
  const { name, batchId, candidateIds, createdBy, lastUpdatedBy } = data;

  if (!name || !batchId || !createdBy) {
    const err = new Error('Missing required fields');
    err.status = 400;
    throw err;
  }

  const group = new Group({
    name,
    batchId,
    candidateIds: candidateIds || [],
    isActive: true,
    createdBy,
    lastUpdatedBy
  });

  await group.save();

  return {
    message: 'Group created successfully',
    groupId: group._id
  };
};

// Get All Groups
const getAllGroups = async () => {
  return await Group.find()
    .populate({
      path: 'candidateIds',
      select: 'name email mobile role isActive profileImageUrl', // Select only needed fields
      match: { isActive: true } // Optional: only populate active users
    })
    .populate({
      path: 'batchId',
      select: 'name' // Include batch name if needed
    })
    .populate({
      path: 'createdBy',
      select: 'name email' // Include creator details if needed
    })
    .populate({
      path: 'lastUpdatedBy',
      select: 'name email' // Include last updater details if needed
    });
};
// Get Group by ID
const getGroupById = async (id) => {
  const group = await Group.findById(id);
  if (!group) {
    const err = new Error('Group not found');
    err.status = 404;
    throw err;
  }
  return group;
};

// Update Group
const updateGroup = async (id, updateData) => {
  updateData.updatedAt = new Date();

  const updatedGroup = await Group.findByIdAndUpdate(id, updateData, { new: true });
  if (!updatedGroup) {
    const err = new Error('Group not found or update failed');
    err.status = 404;
    throw err;
  }

  return updatedGroup;
};

const getGroupsByBatchId = async (batchId) => {
  if (!batchId) {
    const err = new Error('Batch ID is required');
    err.status = 400;
    throw err;
  }

  const groups = await Group.find({ batchId, isActive: true })
    .populate({
      path: 'candidateIds',
      select: 'name email mobile role isActive profileImageUrl',
      match: { isActive: true }
    })
    .populate({ path: 'batchId', select: 'name' })
    .populate({ path: 'createdBy', select: 'name email' })
    .populate({ path: 'lastUpdatedBy', select: 'name email' });

  if (!groups || groups.length === 0) {
    const err = new Error('No groups found for this batch');
    err.status = 404;
    throw err;
  }

  return groups;
};

module.exports = {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  getGroupsByBatchId
};

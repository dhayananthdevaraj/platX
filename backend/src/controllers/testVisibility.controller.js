// const TestVisibility = require('../models/testVisibility.model');

// // Create Test Visibility
// const isEmptyArray = (arr) => !Array.isArray(arr) || arr.length === 0;

// const createTestVisibility = async (data) => {
//   const {
//     testId,
//     courseId,
//     includeGroups,
//     excludeGroups,
//     includeCandidates,
//     excludeCandidates,
//     createdBy,
//     lastUpdatedBy,
//   } = data;

//   if (!testId || !courseId || !createdBy) {
//     const err = new Error("Missing required fields");
//     err.status = 400;
//     throw err;
//   }

//   const allEmpty =
//     isEmptyArray(includeGroups) &&
//     isEmptyArray(excludeGroups) &&
//     isEmptyArray(includeCandidates) &&
//     isEmptyArray(excludeCandidates);

//   if (allEmpty) {
//     // Delete existing visibility if exists
//     const deleted = await TestVisibility.findOneAndDelete({ testId, courseId });
//     if (deleted) {
//       return { message: "Existing test visibility deleted", visibilityId: deleted._id };
//     } else {
//       return { message: "No visibility to delete" };
//     }
//   }

//   // Otherwise, create or update only if at least one array has data
//   const visibility = await TestVisibility.findOneAndUpdate(
//     { testId, courseId },
//     {
//       $set: {
//         includeGroups: includeGroups || [],
//         excludeGroups: excludeGroups || [],
//         includeCandidates: includeCandidates || [],
//         excludeCandidates: excludeCandidates || [],
//         lastUpdatedBy: lastUpdatedBy || createdBy,
//       },
//       $setOnInsert: {
//         createdBy,
//       },
//     },
//     { new: true, upsert: true }
//   );

//   return {
//     message:
//       visibility.createdAt === visibility.updatedAt
//         ? "Test visibility created successfully"
//         : "Test visibility updated successfully",
//     visibilityId: visibility._id,
//   };
// };



// // Get All
// const getAllTestVisibilities = async () => {
//   return await TestVisibility.find();
// };

// // Get By ID
// const getTestVisibilityById = async (id) => {
//   const visibility = await TestVisibility.findById(id);
//   if (!visibility) {
//     const err = new Error('Test Visibility not found');
//     err.status = 404;
//     throw err;
//   }
//   return visibility;
// };

// // Update
// const updateTestVisibility = async (id, updateData) => {
//   updateData.updatedAt = new Date();

//   const updated = await TestVisibility.findByIdAndUpdate(id, updateData, {
//     new: true
//   });

//   if (!updated) {
//     const err = new Error('Test Visibility not found or update failed');
//     err.status = 404;
//     throw err;
//   }

//   return updated;
// };

// const getTestVisibilityByCourseAndTest = async (courseId, testId) => {
//   const visibility = await TestVisibility.findOne({ courseId, testId })
//     .populate('includeGroups excludeGroups includeCandidates excludeCandidates'); // optional


//   return visibility;
// };

// module.exports = {
//   createTestVisibility,
//   getAllTestVisibilities,
//   getTestVisibilityById,
//   updateTestVisibility,
//   getTestVisibilityByCourseAndTest
// };


// controllers/testVisibility.controller.js

const TestVisibility = require('../models/testVisibility.model');

/* --------------------------- helpers --------------------------- */
const required = (obj, keys) => {
  for (const k of keys) {
    if (obj[k] === undefined || obj[k] === null || obj[k] === '') {
      const err = new Error(`Missing required field: ${k}`);
      err.status = 400;
      throw err;
    }
  }
};

const normalizePayload = (data = {}) => {
  const out = { ...data };

  out.includeGroups = Array.isArray(out.includeGroups) ? out.includeGroups : [];
  out.excludeGroups = Array.isArray(out.excludeGroups) ? out.excludeGroups : [];
  out.includeCandidates = Array.isArray(out.includeCandidates)
    ? out.includeCandidates
    : [];
  out.excludeCandidates = Array.isArray(out.excludeCandidates)
    ? out.excludeCandidates
    : [];

  return out;
};

const isEmptyArrays = (obj) => {
  return (
    (!Array.isArray(obj.includeGroups) || obj.includeGroups.length === 0) &&
    (!Array.isArray(obj.excludeGroups) || obj.excludeGroups.length === 0) &&
    (!Array.isArray(obj.includeCandidates) || obj.includeCandidates.length === 0) &&
    (!Array.isArray(obj.excludeCandidates) || obj.excludeCandidates.length === 0)
  );
};

/* ---------------------------- create --------------------------- */
const createTestVisibility = async (data) => {
  const payload = normalizePayload(data);
  required(payload, ['testId', 'courseId', 'createdBy']);

  // If all arrays empty -> delete existing visibility (if any)
  if (isEmptyArrays(payload)) {
    const deleted = await TestVisibility.findOneAndDelete({
      testId: payload.testId,
      courseId: payload.courseId,
    });
    if (deleted) {
      return {
        message: 'Existing test visibility deleted (empty payload)',
        visibilityId: deleted._id,
        deleted: true,
      };
    }
    return { message: 'No visibility to delete (empty payload)', deleted: false };
  }

  const visibility = await TestVisibility.findOneAndUpdate(
    { testId: payload.testId, courseId: payload.courseId },
    {
      $set: {
        includeGroups: payload.includeGroups,
        excludeGroups: payload.excludeGroups,
        includeCandidates: payload.includeCandidates,
        excludeCandidates: payload.excludeCandidates,
        lastUpdatedBy: payload.lastUpdatedBy || payload.createdBy,
      },
      $setOnInsert: {
        createdBy: payload.createdBy,
      },
    },
    { new: true, upsert: true }
  );

  return {
    message:
      visibility.createdAt && visibility.updatedAt && visibility.createdAt.getTime() === visibility.updatedAt.getTime()
        ? 'Test visibility created successfully'
        : 'Test visibility updated successfully',
    visibilityId: visibility._id,
    visibility: visibility.toObject(),
  };
};

/* ----------------------------- read ---------------------------- */
const getAllTestVisibilities = async () => {
  return await TestVisibility.find();
};

const getTestVisibilityById = async (id) => {
  const visibility = await TestVisibility.findById(id);
  if (!visibility) {
    const err = new Error('Test Visibility not found');
    err.status = 404;
    throw err;
  }
  return visibility;
};

const getTestVisibilityByCourseAndTest = async (courseId, testId) => {
  const visibility = await TestVisibility.findOne({ courseId, testId }).populate(
    'includeGroups excludeGroups includeCandidates excludeCandidates'
  );
  return visibility || null;
};

/* ---------------------------- update --------------------------- */
const updateTestVisibility = async (id, updateData) => {
  updateData.updatedAt = new Date();

  const updated = await TestVisibility.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const err = new Error('Test Visibility not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};

/* ------------------------ create or update --------------------- */
const createOrUpdateTestVisibility = async (data) => {
  const { testId, courseId } = data || {};
  if (!testId || !courseId) {
    const err = new Error('Missing required fields: testId and courseId');
    err.status = 400;
    throw err;
  }

  // If all arrays empty => delete existing
  const normalized = normalizePayload(data);
  if (isEmptyArrays(normalized)) {
    const deleted = await TestVisibility.findOneAndDelete({ courseId, testId });
    if (deleted) {
      return { message: 'Test visibility deleted (empty payload)', visibilityId: deleted._id, deleted: true };
    }
    return { message: 'No visibility to delete', deleted: false };
  }

  const existing = await TestVisibility.findOne({ courseId, testId });
  if (existing) {
    const updated = await updateTestVisibility(existing._id, data);
    return { message: 'Test visibility updated', visibilityId: updated._id, visibility: updated.toObject() };
  }

  const created = await createTestVisibility(data);
  return { message: 'Test visibility created', visibilityId: created.visibilityId, visibility: created.visibility };
};

/* ----------------------------- delete -------------------------- */
const deleteTestVisibilityById = async (id) => {
  const deleted = await TestVisibility.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Test Visibility not found or delete failed');
    err.status = 404;
    throw err;
  }
  return { message: 'Test visibility deleted', visibilityId: deleted._id };
};

const deleteTestVisibilityByCourseAndTest = async (courseId, testId) => {
  const deleted = await TestVisibility.findOneAndDelete({ courseId, testId });
  if (!deleted) {
    return { message: 'No visibility found to delete', found: false };
  }
  return { message: 'Test visibility deleted', visibilityId: deleted._id, found: true };
};

/* ---------------------- BULK save with flags ------------------- */
/**
 * Save multiple visibilities in one go using isNew / isUpdated / isDeleted flags.
 * Mirrors course save pattern.
 *
 * Expected input:
 * { courseId, userId, items: [ { _id?, testId, includeGroups, excludeGroups, includeCandidates, excludeCandidates, isNew?, isUpdated?, isDeleted? }, ... ] }
 */
const saveTestVisibilitiesBulk = async (data) => {
  const { courseId, userId, items = [] } = data || {};
  if (!courseId || !userId) {
    const err = new Error('Missing required fields: courseId, userId');
    err.status = 400;
    throw err;
  }

  const results = {
    created: [],
    updated: [],
    deleted: [],
    skipped: [],
  };

  for (const raw of items) {
    const row = normalizePayload({ ...raw, courseId });

    // delete
    if (row.isDeleted) {
      if (row._id) {
        const del = await TestVisibility.findByIdAndDelete(row._id);
        if (del) results.deleted.push(del._id.toString());
        else results.skipped.push({ reason: 'not-found-by-id', row });
      } else if (row.testId) {
        const del = await TestVisibility.findOneAndDelete({ courseId, testId: row.testId });
        if (del) results.deleted.push(del._id.toString());
        else results.skipped.push({ reason: 'not-found-by-course+test', row });
      } else {
        results.skipped.push({ reason: 'delete-missing-identifiers', row });
      }
      continue;
    }

    // create
    if (row.isNew) {
      try {
        required(row, ['testId']);
        // If payload empty arrays -> skip (no-op)
        if (isEmptyArrays(row)) {
          results.skipped.push({ reason: 'create-empty-payload', row });
          continue;
        }

        const created = new TestVisibility({
          testId: row.testId,
          courseId,
          includeGroups: row.includeGroups || [],
          excludeGroups: row.excludeGroups || [],
          includeCandidates: row.includeCandidates || [],
          excludeCandidates: row.excludeCandidates || [],
          createdBy: userId,
          lastUpdatedBy: userId,
        });

        await created.save();
        results.created.push(created._id.toString());
      } catch (e) {
        results.skipped.push({ reason: 'create-failed', error: e.message, row });
      }
      continue;
    }

    // update
    if (row.isUpdated) {
      // find by _id else by (courseId,testId)
      let target = null;
      if (row._id) {
        target = await TestVisibility.findById(row._id);
      } else if (row.testId) {
        target = await TestVisibility.findOne({ courseId, testId: row.testId });
      }

      if (!target) {
        results.skipped.push({ reason: 'update-target-not-found', row });
        continue;
      }

      // if update has empty arrays and you want that to delete -> handle accordingly.
      // We'll allow empty arrays to be set (but if you intended to delete entirely, set isDeleted)
      target.includeGroups = row.includeGroups ?? target.includeGroups;
      target.excludeGroups = row.excludeGroups ?? target.excludeGroups;
      target.includeCandidates = row.includeCandidates ?? target.includeCandidates;
      target.excludeCandidates = row.excludeCandidates ?? target.excludeCandidates;
      target.lastUpdatedBy = userId;
      target.updatedAt = new Date();

      await target.save();
      results.updated.push(target._id.toString());
      continue;
    }

    // nothing flagged -> skip
    results.skipped.push({ reason: 'no-flags', row });
  }

  return {
    message: 'Test visibilities bulk save finished',
    ...results,
  };
};

module.exports = {
  createTestVisibility,
  getAllTestVisibilities,
  getTestVisibilityById,
  updateTestVisibility,
  getTestVisibilityByCourseAndTest,
  createOrUpdateTestVisibility,
  deleteTestVisibilityById,
  deleteTestVisibilityByCourseAndTest,
  saveTestVisibilitiesBulk,
};

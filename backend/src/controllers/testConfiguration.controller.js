
const TestConfiguration = require('../models/testConfiguration.model');

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

const normalizeConfigPayload = (data = {}) => {
  // Normalize & defaulting to keep server rules centralized
  const out = { ...data };

  // numbers
  if (out.durationInMinutes != null) out.durationInMinutes = Number(out.durationInMinutes);
  if (out.maxAttempts != null) out.maxAttempts = Number(out.maxAttempts);
  if (out.malpracticeLimit != null) out.malpracticeLimit = Number(out.malpracticeLimit);
  if (out.correctMark != null) out.correctMark = Number(out.correctMark);
  if (out.negativeMark != null) out.negativeMark = Number(out.negativeMark);
  if (out.passPercentage != null) out.passPercentage = Number(out.passPercentage);

  // booleans (tolerate strings)
  const toBool = (v) => (typeof v === 'string' ? v === 'true' : !!v);
  if (out.isRetakeAllowed != null) out.isRetakeAllowed = toBool(out.isRetakeAllowed);
  if (out.isProctored != null) out.isProctored = toBool(out.isProctored);
  if (out.isPreparationTest != null) out.isPreparationTest = toBool(out.isPreparationTest);

  // enforce derived constraints
  if (!out.isRetakeAllowed) out.maxAttempts = 1;
  if (!out.isProctored) out.malpracticeLimit = out.malpracticeLimit ?? 0;

  return out;
};

/* ---------------------------- create --------------------------- */
const createTestConfiguration = async (data) => {
  const payload = normalizeConfigPayload(data);
  required(payload, ['testId', 'courseId', 'startTime', 'endTime', 'durationInMinutes', 'createdBy']);

  const newConfig = new TestConfiguration({
    testId: payload.testId,
    courseId: payload.courseId,
    startTime: payload.startTime,
    endTime: payload.endTime,
    durationInMinutes: payload.durationInMinutes,
    maxAttempts: payload.maxAttempts ?? 1,
    isRetakeAllowed: payload.isRetakeAllowed ?? false,
    isPreparationTest: payload.isPreparationTest ?? false,
    isProctored: payload.isProctored ?? false,
    malpracticeLimit: payload.malpracticeLimit ?? 0,
    correctMark: payload.correctMark ?? 1,
    negativeMark: payload.negativeMark ?? 0,
    passPercentage: payload.passPercentage ?? 40,
    createdBy: payload.createdBy,
    lastUpdatedBy: payload.lastUpdatedBy || payload.createdBy,
  });

  await newConfig.save();

  return {
    message: 'Test Configuration created successfully',
    configId: newConfig._id,
    config: newConfig.toObject(),
  };
};

/* ----------------------------- read ---------------------------- */
const getAllTestConfigurations = async () => {
  return await TestConfiguration.find();
};

const getTestConfigurationById = async (id) => {
  const config = await TestConfiguration.findById(id);
  if (!config) {
    const err = new Error('Test Configuration not found');
    err.status = 404;
    throw err;
  }
  return config;
};

async function getTestConfigurationByCourseAndTest(courseId, testId) {
  // return plain JS object or null (not a Mongoose Document)
  const config = await TestConfiguration.findOne({ courseId, testId }).lean(); // lean() returns plain object
  // if you can't use .lean(), use config ? config.toObject() : null
  return config || null;
}
/* ---------------------------- update --------------------------- */
const updateTestConfiguration = async (id, updateData) => {
  const payload = normalizeConfigPayload(updateData);
  payload.updatedAt = new Date();
  if (payload.lastUpdatedBy == null && updateData.updatedBy) {
    payload.lastUpdatedBy = updateData.updatedBy;
  }

  const updated = await TestConfiguration.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const err = new Error('Test Configuration not found or update failed');
    err.status = 404;
    throw err;
  }

  return updated;
};

/* ------------------------ create or update --------------------- */
/** No flags version; useful if you keep your current frontend calls */
const createOrUpdateTestConfiguration = async (data) => {
  const { testId, courseId } = data || {};
  if (!testId || !courseId) {
    const err = new Error('Missing required fields: testId and courseId');
    err.status = 400;
    throw err;
  }

  const existing = await TestConfiguration.findOne({ courseId, testId });
  if (existing) {
    const updated = await updateTestConfiguration(existing._id, data);
    return { message: 'Test configuration updated', configId: updated._id, config: updated.toObject() };
  }

  const created = await createTestConfiguration(data);
  return { message: 'Test configuration created', configId: created.configId, config: created.config };
};

/* ----------------------------- delete -------------------------- */
const deleteTestConfigurationById = async (id) => {
  const deleted = await TestConfiguration.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Test Configuration not found or delete failed');
    err.status = 404;
    throw err;
  }
  return { message: 'Test configuration deleted', configId: deleted._id };
};

const deleteTestConfigurationByCourseAndTest = async (courseId, testId) => {
  const deleted = await TestConfiguration.findOneAndDelete({ courseId, testId });
  if (!deleted) {
    return { message: 'No configuration found to delete', found: false };
  }
  return { message: 'Test configuration deleted', configId: deleted._id, found: true };
};

/* ---------------------- BULK save with flags ------------------- */
/**
 * Save multiple configurations in one go using isNew / isUpdated / isDeleted flags.
 * This mirrors your course save pattern.
 *
 * @param {{
 *   courseId: string,
 *   userId: string,
 *   items: Array<{
 *     _id?: string,
 *     testId: string,
 *     courseId?: string,
 *     startTime?: string,
 *     endTime?: string,
 *     durationInMinutes?: number,
 *     maxAttempts?: number,
 *     isRetakeAllowed?: boolean,
 *     isPreparationTest?: boolean,
 *     isProctored?: boolean,
 *     malpracticeLimit?: number,
 *     correctMark?: number,
 *     negativeMark?: number,
 *     passPercentage?: number,
 *     // flags
 *     isNew?: boolean,
 *     isUpdated?: boolean,
 *     isDeleted?: boolean
 *   }>
 * }} data
 */

const saveTestConfigurationsBulk = async (data) => {
  // Accept both { items: [] } and { configs: [] } from clients
  const body = data || {};
  const courseId = body.courseId;
  const userId = body.userId;
  const items = Array.isArray(body.items) ? body.items : Array.isArray(body.configs) ? body.configs : [];

  if (!courseId || !userId) {
    const err = new Error('Missing required fields: courseId, userId');
    err.status = 400;
    throw err;
  }

  console.log(`[testConfigController] saveTestConfigurationsBulk called - courseId=${courseId} userId=${userId} items=${items.length}`);

  const results = {
    created: [],
    updated: [],
    deleted: [],
    skipped: [],
    mapped: [], // optional mapping for local -> real ids
  };

  for (const raw of items) {
    const row = normalizeConfigPayload({ ...raw, courseId }); // ensure courseId in row

    // DELETE
    if (row.isDeleted) {
      if (row._id && !String(row._id).startsWith("local-config-")) {
        const del = await TestConfiguration.findByIdAndDelete(row._id);
        if (del) results.deleted.push(del._id.toString());
        else results.skipped.push({ reason: 'not-found-by-id', row });
      } else if (row.testId) {
        const del = await TestConfiguration.findOneAndDelete({ courseId, testId: row.testId });
        if (del) results.deleted.push(del._id.toString());
        else results.skipped.push({ reason: 'not-found-by-course+test', row });
      } else {
        results.skipped.push({ reason: 'delete-missing-identifiers', row });
      }
      continue;
    }

    // CREATE (isNew)
    if (row.isNew) {
      try {
        required(row, ['testId', 'startTime', 'endTime', 'durationInMinutes']);
        const created = new TestConfiguration({
          testId: row.testId,
          courseId,
          startTime: row.startTime,
          endTime: row.endTime,
          durationInMinutes: row.durationInMinutes,
          maxAttempts: row.maxAttempts ?? 1,
          isRetakeAllowed: row.isRetakeAllowed ?? false,
          isPreparationTest: row.isPreparationTest ?? false,
          isProctored: row.isProctored ?? false,
          malpracticeLimit: row.malpracticeLimit ?? 0,
          correctMark: row.correctMark ?? 1,
          negativeMark: row.negativeMark ?? 0,
          passPercentage: row.passPercentage ?? 40,
          createdBy: userId,
          lastUpdatedBy: userId,
        });
        await created.save();
        results.created.push(created._id.toString());

        // mapping for local -> persisted id
        if (raw && raw._id && String(raw._id).startsWith("local-config-")) {
          results.mapped.push({ oldLocalId: raw._id, newId: created._id.toString(), testId: String(created.testId) });
        }
      } catch (e) {
        results.skipped.push({ reason: 'create-failed', error: e.message, row });
      }
      continue;
    }

    // UPDATE (isUpdated)
    if (row.isUpdated) {
      // Update by _id if provided, otherwise by (courseId+testId)
      let target = null;
      if (row._id && !String(row._id).startsWith("local-config-")) {
        target = await TestConfiguration.findById(row._id);
      } else if (row.testId) {
        target = await TestConfiguration.findOne({ courseId, testId: row.testId });
      }

      if (!target) {
        results.skipped.push({ reason: 'update-target-not-found', row });
        continue;
      }

      target.set({
        startTime: row.startTime ?? target.startTime,
        endTime: row.endTime ?? target.endTime,
        durationInMinutes: row.durationInMinutes ?? target.durationInMinutes,
        maxAttempts: row.isRetakeAllowed ? (row.maxAttempts ?? target.maxAttempts ?? 1) : 1,
        isRetakeAllowed: row.isRetakeAllowed ?? target.isRetakeAllowed,
        isPreparationTest: row.isProctored ? false : (row.isPreparationTest ?? target.isPreparationTest),
        isProctored: row.isProctored ?? target.isProctored,
        malpracticeLimit: (row.isProctored ? (row.malpracticeLimit ?? target.malpracticeLimit ?? 0) : 0),
        correctMark: row.correctMark ?? target.correctMark ?? 1,
        negativeMark: row.negativeMark ?? target.negativeMark ?? 0,
        passPercentage: row.passPercentage ?? target.passPercentage ?? 40,
        lastUpdatedBy: userId,
        updatedAt: new Date(),
      });

      await target.save();
      results.updated.push(target._id.toString());
      continue;
    }

    // nothing flagged -> skip
    results.skipped.push({ reason: 'no-flags', row });
  }

  return {
    message: 'Test configurations bulk save finished',
    created: results.created,
    updated: results.updated,
    deleted: results.deleted,
    skipped: results.skipped,
    mapped: results.mapped,
  };
};


module.exports = {
  createTestConfiguration,
  getAllTestConfigurations,
  getTestConfigurationById,
  getTestConfigurationByCourseAndTest,
  updateTestConfiguration,
  createOrUpdateTestConfiguration,
  deleteTestConfigurationById,
  deleteTestConfigurationByCourseAndTest,
  saveTestConfigurationsBulk,
};

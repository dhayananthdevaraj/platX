// src/utils/testConfigStore.ts
import { v4 as uuidv4 } from "uuid";

const KEY_PREFIX = "course";
const makeKey = (courseId: string) => `${KEY_PREFIX}_${courseId}_test_configs`;

export type StagedConfig = {
  _id: string;           // local id or server id
  testId?: string;       // may be temp local test _id until mapped
  courseId: string;
  startTime?: string;
  endTime?: string;
  durationInMinutes?: number;
  maxAttempts?: number;
  isRetakeAllowed?: boolean;
  isPreparationTest?: boolean;
  isProctored?: boolean;
  malpracticeLimit?: number;
  correctMark?: number;
  negativeMark?: number;
  passPercentage?: number;

  // metadata
  createdBy?: string;
  lastUpdatedBy?: string;
  lastSavedAt?: string;

  // flags
  isNew?: boolean;
  isUpdated?: boolean;
  isDeleted?: boolean;
  isLocal?: boolean;
};

function read(courseId: string): StagedConfig[] {
  try {
    const raw = localStorage.getItem(makeKey(courseId));
    return raw ? (JSON.parse(raw) as StagedConfig[]) : [];
  } catch (e) {
    console.error("testConfigStore read error", e);
    return [];
  }
}
function write(courseId: string, arr: StagedConfig[]) {
  try {
    localStorage.setItem(makeKey(courseId), JSON.stringify(arr));
  } catch (e) {
    console.error("testConfigStore write error", e);
  }
}

export const testConfigStore = {
  getAll(courseId: string): StagedConfig[] {
    return read(courseId);
  },

  getById(courseId: string, id?: string): StagedConfig | undefined {
    if (!id) return undefined;
    return read(courseId).find((x) => String(x._id) === String(id));
  },

  getByTestId(courseId: string, testId?: string): StagedConfig | undefined {
    if (!testId) return undefined;
    return read(courseId).find((x) => String(x.testId) === String(testId));
  },

  /**
   * Upsert a partial config. If _id or testId matches an existing record,
   * merge & update; otherwise create a new staged config entry.
   *
   * Returns the full StagedConfig that was created/updated.
   */
 /**
 * Upsert a partial config. If _id or testId matches an existing record,
 * merge & update; otherwise create a new staged config entry.
 *
 * Returns the full StagedConfig that was created/updated.
 */
upsert(courseId: string, item: Partial<StagedConfig>): StagedConfig {
  const arr = read(courseId);
  const now = new Date().toISOString();

  // Helper function to check if an ID is a real database ObjectId
  const isRealObjectId = (id?: string) => {
    return !!id && /^[0-9a-fA-F]{24}$/.test(String(id)) && !String(id).startsWith("local-config-");
  };

  // try to resolve existing by _id first, then by testId
  let idx = -1;
  if (item._id) idx = arr.findIndex((x) => String(x._id) === String(item._id));
  if (idx < 0 && item.testId) idx = arr.findIndex((x) => String(x.testId) === String(item.testId));

  if (idx >= 0) {
    // update existing
    const existing = arr[idx];
    
    // Preserve the correct flags based on whether this is a real DB record or local
    const hasRealId = isRealObjectId(item._id || existing._id);
    
    const merged: StagedConfig = {
      ...existing,
      ...item,
      courseId: existing.courseId || courseId,
      lastUpdatedBy: item.lastUpdatedBy || existing.lastUpdatedBy,
      lastSavedAt: now,
      isDeleted: item.isDeleted ?? existing.isDeleted ?? false,
      
      // *** FIXED: Preserve correct flags based on real vs local ID ***
      isNew: hasRealId ? false : (existing.isNew ?? true),
      isLocal: hasRealId ? false : (existing.isLocal ?? true),
      isUpdated: hasRealId ? true : (existing.isUpdated ?? false), // Real configs get marked as updated when changed
    };
    
    arr[idx] = merged;
    write(courseId, arr);
    console.log("[testConfigStore.upsert] Updated existing config:", { hasRealId, merged });
    return merged;
  } else {
    // create new
    const newId = item._id || `local-config-${uuidv4()}`;
    const createdBy = item.createdBy || item.lastUpdatedBy || "";
    const hasRealId = isRealObjectId(newId);
    
    const created: StagedConfig = {
      _id: newId,
      testId: item.testId,
      courseId,
      startTime: item.startTime,
      endTime: item.endTime,
      durationInMinutes: item.durationInMinutes,
      maxAttempts: item.maxAttempts,
      isRetakeAllowed: item.isRetakeAllowed,
      isPreparationTest: item.isPreparationTest,
      isProctored: item.isProctored,
      malpracticeLimit: item.malpracticeLimit,
      correctMark: item.correctMark,
      negativeMark: item.negativeMark,
      passPercentage: item.passPercentage,
      createdBy,
      lastUpdatedBy: item.lastUpdatedBy || createdBy,
      lastSavedAt: now,
      
      // *** FIXED: Set flags based on whether this is a real DB record or truly new local ***
      isNew: hasRealId ? false : true,
      isLocal: hasRealId ? false : true,
      isUpdated: hasRealId ? (item.isUpdated ?? true) : false, // Real configs from DB are usually updated when added to store
      isDeleted: false,
    };
    
    arr.push(created);
    write(courseId, arr);
    console.log("[testConfigStore.upsert] Created new config entry:", { hasRealId, created });
    return created;
  }
},

  /**
   * Remove a staged config. Accepts either {_id} or {testId}.
   * If `hard` true, deletes entry from store; otherwise marks isDeleted=true.
   */
  remove(courseId: string, identifier: { _id?: string; testId?: string }, hard = false): boolean {
    const arr = read(courseId);
    let changed = false;
    for (let i = arr.length - 1; i >= 0; i--) {
      const x = arr[i];
      if ((identifier._id && String(x._id) === String(identifier._id)) || (identifier.testId && String(x.testId) === String(identifier.testId))) {
        if (hard) {
          arr.splice(i, 1);
        } else {
          arr[i] = { ...x, isDeleted: true, lastSavedAt: new Date().toISOString() };
        }
        changed = true;
        break;
      }
    }
    if (changed) write(courseId, arr);
    return changed;
  },

  clear(courseId: string) {
    localStorage.removeItem(makeKey(courseId));
  },
};

export default testConfigStore;

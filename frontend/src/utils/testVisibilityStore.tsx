// src/utils/testVisibilityStore.ts
import { v4 as uuidv4 } from "uuid";

const KEY_PREFIX = "course";
const makeKey = (courseId: string) => `${KEY_PREFIX}_${courseId}_test_visibilities`;

export type StagedVisibility = {
  _id: string;           // local id or server id
  testId?: string;       // may be temp local test _id until mapped
  courseId: string;
  includeGroups?: string[];
  excludeGroups?: string[];
  includeCandidates?: string[];
  excludeCandidates?: string[];

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

function read(courseId: string): StagedVisibility[] {
  try {
    const raw = localStorage.getItem(makeKey(courseId));
    return raw ? (JSON.parse(raw) as StagedVisibility[]) : [];
  } catch (e) {
    console.error("testVisibilityStore read error", e);
    return [];
  }
}

function write(courseId: string, arr: StagedVisibility[]) {
  try {
    localStorage.setItem(makeKey(courseId), JSON.stringify(arr));
  } catch (e) {
    console.error("testVisibilityStore write error", e);
  }
}

export const testVisibilityStore = {
  getAll(courseId: string): StagedVisibility[] {
    return read(courseId);
  },

  getById(courseId: string, id?: string): StagedVisibility | undefined {
    if (!id) return undefined;
    return read(courseId).find((x) => String(x._id) === String(id));
  },

  getByTestId(courseId: string, testId?: string): StagedVisibility | undefined {
    if (!testId) return undefined;
    return read(courseId).find((x) => String(x.testId) === String(testId));
  },

  /**
   * Upsert a partial visibility. If _id or testId matches an existing record,
   * merge & update; otherwise create a new staged visibility entry.
   *
   * Returns the full StagedVisibility that was created/updated.
   */
  upsert(courseId: string, item: Partial<StagedVisibility>): StagedVisibility {
    const arr = read(courseId);
    const now = new Date().toISOString();

    // Helper function to check if an ID is a real database ObjectId
    const isRealObjectId = (id?: string) => {
      return !!id && /^[0-9a-fA-F]{24}$/.test(String(id)) && !String(id).startsWith("local-vis-");
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
      
      const merged: StagedVisibility = {
        ...existing,
        ...item,
        courseId: existing.courseId || courseId,
        lastUpdatedBy: item.lastUpdatedBy || existing.lastUpdatedBy,
        lastSavedAt: now,
        isDeleted: item.isDeleted ?? existing.isDeleted ?? false,
        
        // *** FIXED: Preserve correct flags based on real vs local ID ***
        isNew: hasRealId ? false : (existing.isNew ?? true),
        isLocal: hasRealId ? false : (existing.isLocal ?? true),
        isUpdated: hasRealId ? true : (existing.isUpdated ?? false), // Real visibilities get marked as updated when changed
      };
      
      arr[idx] = merged;
      write(courseId, arr);
      console.log("[testVisibilityStore.upsert] Updated existing visibility:", { hasRealId, merged });
      return merged;
    } else {
      // create new
      const newId = item._id || `local-vis-${uuidv4()}`;
      const createdBy = item.createdBy || item.lastUpdatedBy || "";
      const hasRealId = isRealObjectId(newId);
      
      const created: StagedVisibility = {
        _id: newId,
        testId: item.testId,
        courseId,
        includeGroups: item.includeGroups || [],
        excludeGroups: item.excludeGroups || [],
        includeCandidates: item.includeCandidates || [],
        excludeCandidates: item.excludeCandidates || [],
        createdBy,
        lastUpdatedBy: item.lastUpdatedBy || createdBy,
        lastSavedAt: now,
        
        // *** FIXED: Set flags based on whether this is a real DB record or truly new local ***
        isNew: hasRealId ? false : true,
        isLocal: hasRealId ? false : true,
        isUpdated: hasRealId ? (item.isUpdated ?? true) : false, // Real visibilities from DB are usually updated when added to store
        isDeleted: false,
      };
      
      arr.push(created);
      write(courseId, arr);
      console.log("[testVisibilityStore.upsert] Created new visibility entry:", { hasRealId, created });
      return created;
    }
  },

  /**
   * Remove a staged visibility. Accepts either {_id} or {testId}.
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

export default testVisibilityStore;
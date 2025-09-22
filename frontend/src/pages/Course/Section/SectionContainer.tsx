
// src/components/SectionContainer.tsx
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import InlineEdit from "../InlineEdit";
import TestList from "./TestList";
import AddTestModal from "./AddTestModal";
import ConfigTestModal from "./ConfigTestModal";
import TestVisibilityManager from "./TestVisibilityManager";
import type { ModuleItem, Section, SectionTest, TestLite } from "../types/course";
import axios from "axios";
import { testConfigStore } from "../../../utils/testConfigStore";
import { testVisibilityStore } from "../../../utils/testVisibilityStore";
import type { TestConfig } from "../types/course";

const API_BASE = "http://localhost:7071/api";

interface Props {
  section: Section;
  userId: string;
  courseId: string;
  allTests: TestLite[];
  loadingTests: boolean;
  onChanged: (updatedSection: Section) => void;
}

type ConfigState = {
  startTime: string;
  endTime: string;
  durationInMinutes: number;
  maxAttempts: number;
  isRetakeAllowed: boolean;
  isProctored: boolean;
  isPreparationTest: boolean;
  malpracticeLimit: number;
  correctMark: number;
  negativeMark: number;
  passPercentage: number;
};

const SectionContainer: React.FC<Props> = ({
  section,
  userId,
  courseId,
  allTests,
  loadingTests,
  onChanged,
}) => {
  const [sectionData, setSectionData] = useState<Section>(section);
  const [saving, setSaving] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestLite | null>(null);
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [configTestKey, setConfigTestKey] = useState<string>(""); // stable key: either _id or testId
  const [showVisibility, setShowVisibility] = useState(false);
  const [visibilityTestKey, setVisibilityTestKey] = useState<string | null>(null);

  const [configDocId, setConfigDocId] = useState("");
  const [config, setConfig] = useState<ConfigState>({
    startTime: "",
    endTime: "",
    durationInMinutes: 60,
    maxAttempts: 1,
    isRetakeAllowed: false,
    isProctored: false,
    isPreparationTest: false,
    malpracticeLimit: 0,
    correctMark: 1,
    negativeMark: 0,
    passPercentage: 40,
  });

  useEffect(() => {
    setSectionData(section);
  }, [section]);

  /** ---------- local snapshot helpers ---------- */
  const localKey = `course_${courseId}`;
  const loadLocalCourse = (): ModuleItem[] | null => {
    try {
      const raw = localStorage.getItem(localKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("loadLocalCourse parse error", e);
      return null;
    }
  };

const saveLocalCourse = (modules: ModuleItem[]) => {
    try {
      // deep clone to avoid aliasing / keeping references to in-memory mutated objects
      const toSave = JSON.parse(JSON.stringify(modules));
      localStorage.setItem(localKey, JSON.stringify(toSave));
      console.debug("[saveLocalCourse] saved cloned modules", toSave);
    } catch (e) {
      console.error("Failed to persist local course snapshot", e);
    }
  };


  /** Update section locally + persist snapshot + propagate to parent */
  const updateSection = (updated: Section) => {
    setSectionData(updated);
    onChanged(updated);

    // persist to local snapshot immediately (best-effort)
    const modules = loadLocalCourse();
    if (!modules || !Array.isArray(modules)) {
      const placeholderModule: ModuleItem = {
        _id: updated.moduleId || `module-fallback-${Date.now()}`,
        courseId,
        moduleName: "Untitled module",
        order: 1,
        sections: [{ ...updated }],
      } as any;
      saveLocalCourse([placeholderModule]);
      return;
    }

    let replaced = false;
    for (let mi = 0; mi < modules.length; mi++) {
      if (!modules[mi].sections) continue;
      for (let si = 0; si < modules[mi].sections!.length; si++) {
        if (modules[mi].sections![si]._id === updated._id) {
          modules[mi].sections![si] = updated;
          replaced = true;
          break;
        }
      }
      if (replaced) break;
    }

    if (!replaced) {
      const moduleId = (updated as any).moduleId;
      if (moduleId) {
        const moduleIndex = modules.findIndex((m) => String(m._id) === String(moduleId));
        if (moduleIndex >= 0) {
          modules[moduleIndex].sections = modules[moduleIndex].sections || [];
          modules[moduleIndex].sections!.push(updated);
        } else {
          modules.push({
            _id: moduleId,
            courseId,
            moduleName: "Untitled module",
            order: modules.length + 1,
            sections: [updated],
          } as any);
        }
      } else {
        modules.push({
          _id: `module-fallback-${Date.now()}`,
          courseId,
          moduleName: "Untitled module",
          order: modules.length + 1,
          sections: [updated],
        } as any);
      }
    }

    saveLocalCourse(modules);
  };

  const testOptions = useMemo(() => {
    const normal = allTests
      .filter((t) => t.type === "normal")
      .map((t) => ({ value: t._id, label: t.name || t.title || t._id, type: "normal" }));
    const random = allTests
      .filter((t) => t.type === "random")
      .map((t) => ({ value: t._id, label: t.name || t.title || t._id, type: "random" }));

    return [
      { label: "Tests", options: normal },
      { label: "Random Tests", options: random },
    ];
  }, [allTests]);

  const getTestName = (testId: string) => allTests.find((t) => t._id === testId)?.name || testId;

  // robust equality for ids (handles ObjectId vs string)
  const idEquals = (a: any, b: any) => {
    if (a == null || b == null) return false;
    return String(a) === String(b);
  };

  /** findSectionTestInLocal: try localStorage first, then fallback to in-memory sectionData */
  const findSectionTestInLocal = (key: string) => {
    if (!key) return null;
    const modules = loadLocalCourse();
//21sep
    // const matchesTest = (x: any, k: string) =>
    //   idEquals(x._id, k) ||
    //   idEquals(x.testId, k) ||
    //   (x.configuration && (idEquals(x.configuration._id, k) || idEquals(x.configuration.testId, k)));

      const matchesTest = (x: any, k: string) =>
    idEquals(x._id, k) ||
    idEquals(x.testId, k) ||
    (x.configuration && (idEquals(x.configuration._id, k) || idEquals(x.configuration.testId, k))) ||
    (x.configurationId && (idEquals(x.configurationId._id, k) || idEquals(x.configurationId.testId, k)));


    if (modules) {
      for (const m of modules) {
        for (const s of m.sections || []) {
          const t = (s.tests || []).find((x: any) => matchesTest(x, key));
          if (t) return { module: m, section: s, test: t };
        }
      }
    }

    // fallback: in-memory sectionData
    if (sectionData) {
      const t = (sectionData.tests || []).find((x: any) => matchesTest(x, key));
      if (t) return { module: null as any, section: sectionData, test: t };
    }
    return null;
  };

  /* ---------- Add Test (local) ---------- */
  const handleAddTest = async (): Promise<void> => {
    if (!selectedTest) {
      toast.error("Select a test");
      return;
    }

    const modules = loadLocalCourse() || [];

    // If test already exists by testId, handle revive or block duplicate
    for (const module of modules) {
      for (const section of module.sections || []) {
        const existing = (section.tests || []).find((t) => String(t.testId) === String(selectedTest._id));
        if (existing) {
          if (existing.isDeleted) {
            existing.isDeleted = false;
            existing.isUpdated = !existing.isNew;
            existing.order = ((section.tests || []).filter((x) => !x.isDeleted).length || 0) + 1;
            saveLocalCourse(modules);
            if (section._id === sectionData._id) {
              updateSection({
                ...sectionData,
                tests: (section.tests || []).map((x) => (x._id === existing._id ? existing : x)),
              });
            }
            setSelectedTest(null);
            setShowAddPopup(false);
            toast.success("Previously deleted test revived locally");
            return;
          } else {
            toast.error(
              `Test is already added in the course.\n\nModule: ${module.moduleName}\nSection: ${section.sectionName}`
            );
            return;
          }
        }
      }
    }

    // Create unique local _id
    const localId = `local-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const newTest: SectionTest = {
      _id: localId,
      sectionId: sectionData._id,
      testId: selectedTest._id,
      order: ((sectionData.tests || []).filter((t) => !t.isDeleted).length || 0) + 1,
      type: selectedTest.type,
      isNew: true,
      isLocal: true,
    };

    // Update UI + parent + local snapshot
    const updatedSection: Section = {
      ...sectionData,
      tests: [...(sectionData.tests || []), newTest],
    };

    updateSection(updatedSection);

    // persist into local modules snapshot
    let applied = false;
    for (let mi = 0; mi < modules.length; mi++) {
      for (let si = 0; si < (modules[mi].sections || []).length; si++) {
        if (modules[mi].sections![si]._id === sectionData._id) {
          modules[mi].sections![si].tests = [...(modules[mi].sections![si].tests || []), newTest];
          modules[mi].sections![si].isUpdated = !modules[mi].sections![si].isNew;
          applied = true;
          break;
        }
      }
      if (applied) break;
    }
    saveLocalCourse(modules);

    setSelectedTest(null);
    setShowAddPopup(false);
    toast.success("Test added locally");
  };

  /* ---------- Remove Test (local) ---------- */
  const handleRemoveTest = async (sectionTestId: string) => {
    if (!confirm("Remove this test from section?")) return;

    let updatedTests = (sectionData.tests || []).filter((t) => {
      if (t._id === sectionTestId) {
        if (t.isNew) {
          return false; // remove local-only
        } else {
          t.isDeleted = true; // mark for deletion
        }
      }
      return true;
    });

    updatedTests = updatedTests.map((t, idx) => {
      if (!t.isDeleted) {
        return {
          ...t,
          order: idx + 1,
          isUpdated: !t.isNew,
        };
      }
      return t;
    });

    const updatedSection: Section = {
      ...sectionData,
      tests: updatedTests,
    };

    updateSection(updatedSection);

    // persist to local snapshot
    const modules = loadLocalCourse() || [];
    for (let mi = 0; mi < modules.length; mi++) {
      for (let si = 0; si < (modules[mi].sections || []).length; si++) {
        if (modules[mi].sections![si]._id === sectionData._id) {
          modules[mi].sections![si].tests = updatedTests;
          modules[mi].sections![si].isUpdated = !modules[mi].sections![si].isNew;
        }
      }
    }
    saveLocalCourse(modules);

    toast.success("Test removed locally");
  };

  /* ---------- Reorder Tests (local) ---------- */
  const handleReorderTests = async (reorderedTests: SectionTest[]) => {
    const updated = {
      ...sectionData,
      tests: reorderedTests.map((t, idx) => ({
        ...t,
        order: idx + 1,
        isUpdated: !t.isNew && !t.isDeleted ? true : t.isUpdated,
      })),
    };

    updateSection(updated);

    const modules = loadLocalCourse() || [];
    for (let mi = 0; mi < modules.length; mi++) {
      for (let si = 0; si < (modules[mi].sections || []).length; si++) {
        if (modules[mi].sections![si]._id === sectionData._id) {
          modules[mi].sections![si].tests = updated.tests;
          modules[mi].sections![si].isUpdated = !modules[mi].sections![si].isNew;
        }
      }
    }
    saveLocalCourse(modules);

    toast.success("Tests reordered locally");
  };

  /* ---------- Delete Section (local staging) ---------- */
  const handleDeleteSection = () => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    if (sectionData.isNew) {
      onChanged({ ...sectionData, isDeleted: true, remove: true } as any);
      const modules = loadLocalCourse() || [];
      for (let mi = 0; mi < modules.length; mi++) {
        modules[mi].sections = (modules[mi].sections || []).filter((s) => s._id !== sectionData._id);
      }
      saveLocalCourse(modules);
      toast.success("Local section deleted permanently");
      return;
    }

    const updatedSection: Section = {
      ...sectionData,
      isDeleted: true,
      isUpdated: true,
    };

    onChanged(updatedSection);

    const modules = loadLocalCourse() || [];
    for (let mi = 0; mi < modules.length; mi++) {
      for (let si = 0; si < (modules[mi].sections || []).length; si++) {
        if (modules[mi].sections![si]._id === sectionData._id) {
          modules[mi].sections![si].isDeleted = true;
          modules[mi].sections![si].isUpdated = true;
        }
      }
    }
    saveLocalCourse(modules);
    toast.success("Section marked as deleted locally");
  };

  /* ---------- date helpers ---------- */
  const toDateTimeLocal = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  };
  const fromDateTimeLocal = (localStr: string) => {
    if (!localStr) return "";
    return new Date(localStr).toISOString();
  };


// ---------- helpers (put near top of SectionContainer) ----------
const isObjectId = (id?: any) =>
  typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(String(id));

/**
 * Normalize staged config flags so they are never contradictory.
 * - onOpen: when true we should not mark server‐persisted configs as updated (user just opened).
 * - onOpen: false (saving) will mark persisted configs as updated.
 *
 * Mutates and returns the cfg object.
 */
/**
 * Normalize staged config flags so they are never contradictory.
 * - onOpen: when true we should not mark server‐persisted configs as updated (user just opened).
 * - onOpen: false (saving) will mark persisted configs as updated.
 *
 * Mutates and returns the cfg object.
 */
function normalizeConfigFlags(
  cfg: any,
  opts: { onOpen?: boolean } = { onOpen: false }
) {
  if (!cfg) return cfg;

  const onOpen = !!opts.onOpen;
  const rawId = cfg._id;
  const hasReal =
    !!rawId && isObjectId(rawId) && !String(rawId).startsWith("local-config-");

  console.group("[normalizeConfigFlags]");
  console.log("input cfg:", JSON.parse(JSON.stringify(cfg)));
  console.log("rawId:", rawId, "hasReal:", hasReal, "onOpen:", onOpen);

  if (hasReal) {
    // canonical persisted config - EXISTS IN DATABASE
    cfg._id = String(rawId);
    cfg.isLocal = false;
    cfg.isNew = false;  // *** FIXED: Real DB configs are NEVER new ***
    cfg.isDeleted = !!cfg.isDeleted;
    
    // *** FIXED: Only mark as updated when saving (not when opening) ***
    if (onOpen) {
      cfg.isUpdated = false; // Don't mark as updated just by opening
    } else {
      cfg.isUpdated = true;  // Mark as updated when saving changes
    }

    console.log("→ normalized as REAL db config");
  } else {
    // local placeholder config - DOES NOT EXIST IN DATABASE YET
    cfg._id = String(
      cfg._id ??
        `local-config-${cfg.testId || Math.random().toString(36).slice(2, 8)}`
    );
    cfg.isLocal = true;
    cfg.isNew = true;      // Local configs are always new until persisted
    cfg.isUpdated = false; // Local configs don't need isUpdated until they become real
    cfg.isDeleted = !!cfg.isDeleted;

    console.log("→ normalized as LOCAL config");
  }

  cfg.lastSavedAt = cfg.lastSavedAt || new Date().toISOString();

  // ensure booleans
  cfg.isNew = !!cfg.isNew;
  cfg.isUpdated = !!cfg.isUpdated;
  cfg.isLocal = !!cfg.isLocal;
  cfg.isDeleted = !!cfg.isDeleted;

  console.log("output cfg:", JSON.parse(JSON.stringify(cfg)));
  console.groupEnd();

  return cfg;
}
/**
 * Attach configuration object into the local course snapshot (and persist).
 * - onOpen defaults to true (don't mark server config as updated just by opening).
 * - forcePersistIfMissing persists a placeholder module/section if no suitable slot found.
 */
function attachConfigToLocalSnapshotIfMissing(
  key: string,
  testRow: any,
  cfgRaw: any,
  opts: { onOpen?: boolean; forcePersistIfMissing?: boolean } = {
    onOpen: true,
    forcePersistIfMissing: true,
  }
): boolean {
  console.group("[attachConfigToLocalSnapshotIfMissing] start");
  try {
    console.log("args:", { key, testRowId: testRow?._id ?? testRow?.testId, opts });

    // normalize + clone
    const cfgCopy = { ...(cfgRaw || {}) };
    normalizeConfigFlags(cfgCopy, { onOpen: !!opts.onOpen });
    const normalizedCfg = JSON.parse(JSON.stringify(cfgCopy));

    // attach to testRow (in-memory only, detached copies)
    testRow.configuration = JSON.parse(JSON.stringify(normalizedCfg));
    testRow.configurationId = JSON.parse(JSON.stringify(normalizedCfg));

    const modules = loadLocalCourse() || [];
    let applied = false;

    // find and update snapshot
    for (let mi = 0; mi < modules.length && !applied; mi++) {
      for (let si = 0; si < (modules[mi].sections || []).length && !applied; si++) {
        for (let ti = 0; ti < (modules[mi].sections![si].tests || []).length; ti++) {
          const t = modules[mi].sections![si].tests![ti];
          if (String(t._id) === String(testRow._id) || String(t.testId) === String(testRow.testId)) {
            const newTestRow = {
              ...t,
              ...testRow,
              configuration: JSON.parse(JSON.stringify(normalizedCfg)),
              configurationId: JSON.parse(JSON.stringify(normalizedCfg)),
            };
            modules[mi].sections![si].tests![ti] = newTestRow;
            modules[mi].sections![si].isUpdated = !modules[mi].sections![si].isNew;
            applied = true;
            break;
          }
        }
      }
    }

    // fallback if missing
    if (!applied && opts.forcePersistIfMissing) {
      console.warn("[attachConfig] no match — persisting placeholder");
      const placeholderSection = {
        ...sectionData,
        _id: sectionData._id || `section-fallback-${Date.now()}`,
        tests: [JSON.parse(JSON.stringify(testRow))],
      } as any;
      const placeholderModule = {
        _id: `module-fallback-${Date.now()}`,
        courseId,
        moduleName: "Untitled module",
        order: 1,
        sections: [placeholderSection],
      } as any;
      saveLocalCourse([placeholderModule]);
      console.groupEnd();
      return true;
    }

    if (applied) {
      saveLocalCourse(modules); // saveLocalCourse will deep-clone again
      console.log("persisted updated modules snapshot (via saveLocalCourse)");
      console.groupEnd();
      return true;
    }

    console.log("nothing applied, nothing persisted");
    console.groupEnd();
    return false;
  } catch (e) {
    console.groupEnd();
    console.warn("[attachConfigToLocalSnapshotIfMissing] failed", e);
    return false;
  }
}




// ---------- openConfigPopup (updated: ALWAYS attach to local snapshot) ----------
// ---------- openConfigPopup (FIXED - ensures testConfigStore consistency) ----------
const openConfigPopup = async (testKeyCandidate: string | undefined | null) => {
  // ensure key is a string (never undefined)
  let key: string = testKeyCandidate ?? "";
  if (!key) {
    const activeTests = (sectionData.tests || []).filter((t) => !t.isDeleted);
    if (activeTests.length === 1) key = activeTests[0]._id ?? activeTests[0].testId ?? "";
  }

  setConfigTestKey(key);
  setSaving(true);

  try {
    // 1) staged on course snapshot (prefer)
    const staged = key ? findSectionTestInLocal(key) : null;
    if (staged?.test?.configuration) {
      const cfg = staged.test.configuration;
      normalizeConfigFlags(cfg, { onOpen: true });

      // FIXED: Ensure normalized config is synced back to testConfigStore
      console.log("[openConfigPopup] Syncing staged config to testConfigStore:", cfg);
      testConfigStore.upsert(courseId, cfg);

      setConfigDocId(String(cfg._id || ""));
      setConfig({
        startTime: cfg.startTime ? toDateTimeLocal(cfg.startTime) : "",
        endTime: cfg.endTime ? toDateTimeLocal(cfg.endTime) : "",
        durationInMinutes: cfg.durationInMinutes ?? 60,
        maxAttempts: cfg.maxAttempts ?? 1,
        isRetakeAllowed: cfg.isRetakeAllowed ?? false,
        isProctored: cfg.isProctored ?? false,
        isPreparationTest: cfg.isPreparationTest ?? false,
        malpracticeLimit: cfg.malpracticeLimit ?? 0,
        correctMark: cfg.correctMark ?? 1,
        negativeMark: cfg.negativeMark ?? 0,
        passPercentage: cfg.passPercentage ?? 40,
      });

      // Ensure local snapshot has configuration attached (idempotent)
      attachConfigToLocalSnapshotIfMissing(key, staged.test, cfg, { onOpen: true, forcePersistIfMissing: true });
      setShowConfigPopup(true);
      return;
    }

    // 2) canonical testConfigStore (local staged store)
    try {
      let cfgFound: TestConfig | undefined;
      if (key) {
        cfgFound = testConfigStore.getByTestId(courseId, key) || testConfigStore.getById(courseId, key);
      }
      if (!cfgFound && staged?.test?.testId) {
        cfgFound = testConfigStore.getByTestId(courseId, staged.test.testId);
      }

      if (cfgFound) {
        normalizeConfigFlags(cfgFound, { onOpen: true });
        
        // FIXED: Ensure normalized config is persisted back to store
        console.log("[openConfigPopup] Re-saving normalized testConfigStore entry:", cfgFound);
        testConfigStore.upsert(courseId, cfgFound);

        setConfigDocId(String(cfgFound._id || ""));
        setConfig({
          startTime: cfgFound.startTime ? toDateTimeLocal(cfgFound.startTime) : "",
          endTime: cfgFound.endTime ? toDateTimeLocal(cfgFound.endTime) : "",
          durationInMinutes: cfgFound.durationInMinutes ?? 60,
          maxAttempts: cfgFound.maxAttempts ?? 1,
          isRetakeAllowed: cfgFound.isRetakeAllowed ?? false,
          isProctored: cfgFound.isProctored ?? false,
          isPreparationTest: cfgFound.isPreparationTest ?? false,
          malpracticeLimit: cfgFound.malpracticeLimit ?? 0,
          correctMark: cfgFound.correctMark ?? 1,
          negativeMark: cfgFound.negativeMark ?? 0,
          passPercentage: cfgFound.passPercentage ?? 40,
        });

        // If no staged testRow found, create a minimal testRow for attach; otherwise use staged.test
        const testRowForAttach = staged?.test ?? {
          _id: key || `local-test-${Date.now()}`,
          testId: key && /^[0-9a-fA-F]{24}$/.test(String(key)) ? key : undefined,
          sectionId: sectionData._id,
          order: (sectionData.tests || []).length + 1,
          type: "normal",
        };

        attachConfigToLocalSnapshotIfMissing(key ?? "", testRowForAttach, cfgFound, { onOpen: true, forcePersistIfMissing: true });
        setShowConfigPopup(true);
        return;
      }
    } catch (err) {
      console.warn("[openConfigPopup] testConfigStore lookup failed", err);
    }

    // 3) server fallback
    if (key) {
      try {
        let serverKey: string | undefined;
        if (staged?.test?.testId) {
          serverKey = staged.test.testId;
        } else {
          const cfgById = testConfigStore.getById(courseId, key);
          if (cfgById?.testId) serverKey = cfgById.testId;
        }

        if (serverKey && /^[0-9a-fA-F]{24}$/.test(serverKey)) {
          console.log("[openConfigPopup] Fetching config from server for testId:", serverKey);
          const res = await axios.get(`${API_BASE}/test-configuration/${courseId}/${serverKey}`);
          if (res?.data) {
            const d = res.data;
            normalizeConfigFlags(d, { onOpen: true });

            // FIXED: Cache server config in testConfigStore
            console.log("[openConfigPopup] Caching server config to testConfigStore:", d);
            testConfigStore.upsert(courseId, d);

            setConfigDocId(String(d._id || ""));
            setConfig({
              startTime: d.startTime ? toDateTimeLocal(d.startTime) : "",
              endTime: d.endTime ? toDateTimeLocal(d.endTime) : "",
              durationInMinutes: d.durationInMinutes ?? 60,
              maxAttempts: d.maxAttempts ?? 1,
              isRetakeAllowed: d.isRetakeAllowed ?? false,
              isProctored: d.isProctored ?? false,
              isPreparationTest: d.isPreparationTest ?? false,
              malpracticeLimit: d.malpracticeLimit ?? 0,
              correctMark: d.correctMark ?? 1,
              negativeMark: d.negativeMark ?? 0,
              passPercentage: d.passPercentage ?? 40,
            });

            // create minimal testRow if staged missing, then attach so localStorage will get an entry immediately
            const testRowForAttach = staged?.test ?? {
              _id: key || `local-test-${Date.now()}`,
              testId: serverKey,
              sectionId: sectionData._id,
              order: (sectionData.tests || []).length + 1,
              type: "normal",
            };

            attachConfigToLocalSnapshotIfMissing(key ?? "", testRowForAttach, d, { onOpen: true, forcePersistIfMissing: true });
            setShowConfigPopup(true);
            return;
          }
        } else {
          console.debug("[openConfigPopup] no valid testId found for server fetch", { key, staged });
        }
      } catch (e) {
        console.debug("[openConfigPopup] server config fetch failed", e);
      }
    }

    // 4) defaults: create a local placeholder config
    console.log("[openConfigPopup] Creating default config for key:", key);
    const defaultCfgRaw: Partial<TestConfig> = {
      _id: `local-config-${key || Math.random().toString(36).slice(2, 8)}`,
      testId: staged?.test?.testId ?? key ?? "",
      courseId,
      startTime: "",
      endTime: "",
      durationInMinutes: 60,
      maxAttempts: 1,
      isRetakeAllowed: false,
      isProctored: false,
      isPreparationTest: false,
      malpracticeLimit: 0,
      correctMark: 1,
      negativeMark: 0,
      passPercentage: 40,
      createdBy: userId,
      lastUpdatedBy: userId,
      lastSavedAt: new Date().toISOString(),
    };

    const defaultCfg = normalizeConfigFlags({ ...defaultCfgRaw, isNew: true }, { onOpen: true });

    // FIXED: Ensure default config is saved to testConfigStore
    console.log("[openConfigPopup] Saving default config to testConfigStore:", defaultCfg);
    testConfigStore.upsert(courseId, defaultCfg);

    // If staged.test exists use it; otherwise build a minimal testRow so attach persists snapshot immediately
    const testRowFallback = staged?.test ?? {
      _id: key || `local-test-${Date.now()}`,
      testId: key && /^[0-9a-fA-F]{24}$/.test(String(key)) ? key : undefined,
      sectionId: sectionData._id,
      order: (sectionData.tests || []).length + 1,
      type: "normal",
      isNew: false,
    };

    attachConfigToLocalSnapshotIfMissing(key ?? "", testRowFallback, defaultCfg, { onOpen: true, forcePersistIfMissing: true });
    setConfigDocId(String(defaultCfg._id));
    setConfig({
      startTime: "",
      endTime: "",
      durationInMinutes: 60,
      maxAttempts: 1,
      isRetakeAllowed: false,
      isProctored: false,
      isPreparationTest: false,
      malpracticeLimit: 0,
      correctMark: 1,
      negativeMark: 0,
      passPercentage: 40,
    });

    setShowConfigPopup(true);
  } finally {
    setSaving(false);
  }
};


// ---------- handleSaveConfig (updated) ----------
// ---------- handleSaveConfig (FIXED) ----------
const handleSaveConfig = async () => {
  try {
    setSaving(true);

    const payload = {
      startTime: fromDateTimeLocal(config.startTime),
      endTime: fromDateTimeLocal(config.endTime),
      durationInMinutes: config.durationInMinutes,
      isRetakeAllowed: config.isRetakeAllowed,
      maxAttempts: config.isRetakeAllowed ? config.maxAttempts : 1,
      isProctored: config.isProctored,
      malpracticeLimit: config.isProctored ? config.malpracticeLimit : 0,
      isPreparationTest: !config.isProctored && config.isPreparationTest,
      correctMark: config.correctMark,
      negativeMark: config.negativeMark,
      passPercentage: config.passPercentage,
      lastUpdatedBy: userId,
      createdBy: userId,
    };

    const modules = loadLocalCourse();
    let found: null | { mIndex: number; sIndex: number; tIndex: number; t: SectionTest } = null;

    // find test in snapshot
    if (modules) {
      outer: for (let mi = 0; mi < modules.length; mi++) {
        for (let si = 0; si < (modules[mi].sections || []).length; si++) {
          for (let ti = 0; ti < (modules[mi].sections![si].tests || []).length; ti++) {
            const t = modules[mi].sections![si].tests![ti];
            if (idEquals(t._id, configTestKey) || idEquals(t.testId, configTestKey)) {
              found = { mIndex: mi, sIndex: si, tIndex: ti, t };
              break outer;
            }
          }
        }
      }
    }

    // fallback
    if (!found) {
      sectionData.tests?.forEach((t, ti) => {
        if (idEquals(t._id, configTestKey) || idEquals(t.testId, configTestKey)) {
          found = { mIndex: -1, sIndex: -1, tIndex: ti, t };
        }
      });
    }

    if (!found) {
      toast.error("Unable to find the test in local snapshot to attach configuration.");
      return;
    }

    const tRef = found.t;
    const nowIso = new Date().toISOString();

    // config id
    const existingCfg = (tRef as any).configuration ?? (tRef as any).configurationId ?? null;
    const existingCfgId = existingCfg?._id ?? configDocId ?? "";
    const hasRealCfg = !!existingCfgId && isObjectId(existingCfgId) && !String(existingCfgId).startsWith("local-config-");
    const idToUse = hasRealCfg ? String(existingCfgId) : `local-config-${tRef._id || tRef.testId}`;

    const mergedClean = {
      ...payload,
      _id: idToUse,
      testId: tRef.testId ?? tRef._id,
      courseId,
      lastUpdatedBy: userId,
      createdBy: userId,
      lastSavedAt: nowIso,
    };

    // normalize (saving mode = onOpen: false)
    const configObj = normalizeConfigFlags(mergedClean, { onOpen: false });

    // *** FIX: Actually persist into staging store ***
    console.log("[handleSaveConfig] About to upsert config to testConfigStore:", configObj);
    const upsertedConfig = testConfigStore.upsert(courseId, configObj);
    console.log("[handleSaveConfig] Upserted config result:", upsertedConfig);

    // overwrite in test row
    (tRef as any).configuration = { ...configObj };
    (tRef as any).configurationId = { ...configObj };
    if (!tRef.isNew) tRef.isUpdated = true;

    // persist modules snapshot
    if (found.mIndex >= 0 && found.sIndex >= 0 && modules) {
      const sec = modules[found.mIndex].sections![found.sIndex];
      const newTestRow = {
        ...sec.tests![found.tIndex],
        ...tRef,
        configuration: { ...configObj },
        configurationId: { ...configObj },
      };
      sec.tests![found.tIndex] = newTestRow;
      sec.isUpdated = !sec.isNew;
      saveLocalCourse(modules);

      if (idEquals(sectionData._id, sec._id)) {
        updateSection({
          ...sectionData,
          tests: sectionData.tests?.map((tt) =>
            idEquals(tt._id, newTestRow._id) || idEquals(tt.testId, newTestRow.testId)
              ? newTestRow
              : tt
          ),
        });
      }
    } else {
      const updatedTests = sectionData.tests?.map((tt, idx) =>
        idx === found!.tIndex ? tRef : tt
      );
      updateSection({ ...sectionData, tests: updatedTests });
      saveLocalCourse([
        {
          _id: sectionData.moduleId || `module-fallback-${Date.now()}`,
          courseId,
          moduleName: "Untitled module",
          order: 1,
          sections: [{ ...sectionData, tests: updatedTests }],
        } as any,
      ]);
    }

    setShowConfigPopup(false);
    onChanged && onChanged(sectionData);
    toast.success("Configuration saved locally (will be persisted on Save Course)");
  } catch (err) {
    console.error("handleSaveConfig error:", err);
    toast.error("Failed to save configuration locally");
  } finally {
    setSaving(false);
  };
};



  /* ---------- Visibility modal flow uses TestVisibilityManager (that file persists via testVisibilityStore) ---------- */

  return (
    <div className="rounded-xl border bg-white p-6 shadow-lg mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1 flex-1 mr-4">
          <InlineEdit
            value={sectionData.sectionName}
            onSave={(name) => {
              if (!name.trim() || name.trim() === sectionData.sectionName) return;
              const updatedSection: Section = {
                ...sectionData,
                sectionName: name.trim(),
              };
              updateSection(updatedSection);

              const modules = loadLocalCourse() || [];
              for (let mi = 0; mi < modules.length; mi++) {
                for (let si = 0; si < (modules[mi].sections || []).length; si++) {
                  if (modules[mi].sections![si]._id === sectionData._id) {
                    modules[mi].sections![si].sectionName = name.trim();
                    modules[mi].sections![si].isUpdated = true;
                  }
                }
              }
              saveLocalCourse(modules);

              toast.success("Section name updated locally");
            }}
            placeholder="Section name"
            className="font-semibold text-lg"
          />
          <InlineEdit
            value={sectionData.sectionDescription || ""}
            onSave={(d) => {
              const updatedSection: Section = {
                ...sectionData,
                sectionDescription: d.trim(),
              };
              updateSection(updatedSection);

              const modules = loadLocalCourse() || [];
              for (let mi = 0; mi < modules.length; mi++) {
                for (let si = 0; si < (modules[mi].sections || []).length; si++) {
                  if (modules[mi].sections![si]._id === sectionData._id) {
                    modules[mi].sections![si].sectionDescription = d.trim();
                    modules[mi].sections![si].isUpdated = true;
                  }
                }
              }
              saveLocalCourse(modules);

              toast.success("Section description updated locally");
            }}
            placeholder="Description (optional)"
            className="text-sm text-gray-600"
            textarea
          />
        </div>
        <button onClick={handleDeleteSection} className="rounded bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700 h-8">
          Delete Section
        </button>
      </div>

      <TestList
        tests={(sectionData.tests || []).filter((t) => !t.isDeleted)}
        getTestName={getTestName}
        onReorder={handleReorderTests}
        onConfigure={(testId: string) => openConfigPopup(testId)}
        onRemove={(id) => handleRemoveTest(id)}
        onVisibility={(testId: string) => {
          setVisibilityTestKey(testId);
          setShowVisibility(true);
        }}
        saving={saving}
        sectionId={sectionData._id}
      />

      <div className="mt-4">
        <button onClick={() => setShowAddPopup(true)} className="rounded px-3 py-2 bg-purple-600 text-white text-sm hover:bg-purple-700">
          + Add Test
        </button>
      </div>

      {showAddPopup && (
        <AddTestModal
          testOptions={testOptions}
          selectedTest={selectedTest}
          onTestSelect={setSelectedTest}
          onAdd={handleAddTest}
          onCancel={() => setShowAddPopup(false)}
          saving={saving}
        />
      )}

      {showConfigPopup && (
        <ConfigTestModal
          config={config}
          onConfigChange={setConfig}
          onSave={handleSaveConfig}
          onCancel={() => setShowConfigPopup(false)}
          saving={saving}
          testKey={configTestKey}
        />
      )}

      {showVisibility && visibilityTestKey && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Manage Visibility</h3>
              <button
                onClick={() => {
                  setShowVisibility(false);
                  setVisibilityTestKey(null);
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <TestVisibilityManager
              testId={visibilityTestKey}
              courseId={courseId}
              currentUserId={userId}
              onClose={() => {
                setShowVisibility(false);
                setVisibilityTestKey(null);
                onChanged && onChanged(sectionData);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionContainer;

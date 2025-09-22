
import React, { useEffect, useCallback, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import ModuleList from "./ModuleList";
import ModuleDetail from "./ModuleDetail";
import type { ModuleItem } from "./types/course";
// NOTE: adjust path if your utils are located elsewhere
import { testConfigStore } from "../../utils/testConfigStore";
import { testVisibilityStore } from "../../utils/testVisibilityStore";


interface Props {
  courseId: string;
  currentUserId?: string;
}

const DEFAULT_USER_ID = "68561fdf1ed096393f84533c";
const API_BASE = "http://localhost:7071/api";

/**
 * CourseBuilder (configuration-only)
 * - Uses both the `configuration` key attached to staged tests and the canonical
 *   testConfigStore entries when merging staged config into server snapshot.
 */

const CourseBuilder: React.FC<Props> = ({ courseId, currentUserId }) => {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const userId = currentUserId || DEFAULT_USER_ID;

  const persistLocalSnapshot = (snap: ModuleItem[]) => {
    try {
      localStorage.setItem(`course_${courseId}`, JSON.stringify(snap));
      console.log("[CourseBuilder] persisted local snapshot", {
        courseId,
        modulesCount: snap.length,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[CourseBuilder] Failed to persist local snapshot", e);
    }
  };

  /**
   * Merge server modules with staged local snapshot AND canonical testConfigStore.
   * - Only attaches `configuration` if server doesn't already have one.
   * - Prefers staged config attached directly to the test row, else looks into testConfigStore.
   */
  // const mergeServerWithLocalStaged = (serverModules: ModuleItem[], localRaw: string | null) => {
  //   console.log("[CourseBuilder] mergeServerWithLocalStaged start", {
  //     serverModulesCount: serverModules.length,
  //     hasLocalRaw: !!localRaw,
  //   });

  //   // read canonical staged configs (testConfigStore)
  //   const canonicalConfigs = testConfigStore.getAll(courseId) || [];
  //   const canonicalByTestId: Record<string, any> = {};
  //   const canonicalByCfgId: Record<string, any> = {};
  //   for (const c of canonicalConfigs) {
  //     if (c.testId) canonicalByTestId[String(c.testId)] = c;
  //     if (c._id) canonicalByCfgId[String(c._id)] = c;
  //   }

  //   let localModules: ModuleItem[] = [];
  //   try {
  //     localModules = localRaw ? JSON.parse(localRaw) : [];
  //   } catch (e) {
  //     console.warn("[CourseBuilder] failed to parse local snapshot; skipping merge", e);
  //   }

  //   // quick lookup of test rows in local snapshot by testId / local _id
  //   const localByTestId: Record<string, any> = {};
  //   const localByLocalId: Record<string, any> = {};
  //   for (const lm of localModules) {
  //     for (const ls of lm.sections || []) {
  //       for (const lt of ls.tests || []) {
  //         if (lt.testId) localByTestId[String(lt.testId)] = lt;
  //         if (lt._id) localByLocalId[String(lt._id)] = lt;
  //       }
  //     }
  //   }

  //   const merged = serverModules.map((m) => ({
  //     ...m,
  //     sections: (m.sections || []).map((s) => ({
  //       ...s,
  //       tests: (s.tests || []).map((t) => {
  //         const serverHasConfiguration = !!(t.configuration && Object.keys(t.configuration || {}).length > 0);

  //         // try staged config attached to local snapshot test row (match by testId or server row _id)
  //         const localMatchByTestId = t.testId ? localByTestId[String(t.testId)] : null;
  //         const localMatchByLocalId = t._id ? localByLocalId[String(t._id)] : null;
  //         const localTest = localMatchByTestId || localMatchByLocalId;

  //         // try canonical store entries (by testId first, else by config _id if available)
  //         const canonicalMatchByTestId = t.testId ? canonicalByTestId[String(t.testId)] : null;
  //         // Also allow canonical lookup by config _id in case key passed was config id:
  //         const canonicalMatchByCfgId =
  //           (t.configuration && t.configuration._id && canonicalByCfgId[String(t.configuration._id)]) || null;

  //         const mergedTest: any = { ...t };

  //         // If server already has config, don't overwrite.
  //         // If server doesn't and localTest.configuration exists, attach it.
  //         if (!serverHasConfiguration && localTest && localTest.configuration && Object.keys(localTest.configuration).length > 0) {
  //           mergedTest.configuration = localTest.configuration;
  //           console.log("[CourseBuilder] merged staged configuration (from local snapshot) into server test", {
  //             module: m.moduleName,
  //             section: s.sectionName,
  //             testKey: t.testId ?? t._id,
  //             configId: mergedTest.configuration._id,
  //           });
  //         } else if (!serverHasConfiguration && canonicalMatchByTestId) {
  //           mergedTest.configuration = canonicalMatchByTestId;
  //           console.log("[CourseBuilder] merged staged configuration (from testConfigStore by testId) into server test", {
  //             module: m.moduleName,
  //             section: s.sectionName,
  //             testKey: t.testId ?? t._id,
  //             configId: mergedTest.configuration._id,
  //           });
  //         } else if (!serverHasConfiguration && canonicalMatchByCfgId) {
  //           mergedTest.configuration = canonicalMatchByCfgId;
  //           console.log("[CourseBuilder] merged staged configuration (from testConfigStore by cfgId) into server test", {
  //             module: m.moduleName,
  //             section: s.sectionName,
  //             testKey: t.testId ?? t._id,
  //             configId: mergedTest.configuration._id,
  //           });
  //         }

  //         // Normalize flags
  //         mergedTest.isNew = !!mergedTest.isNew;
  //         mergedTest.isUpdated = !!mergedTest.isUpdated;
  //         mergedTest.isDeleted = !!mergedTest.isDeleted;

  //         // If we attached canonical config, ensure flags normalized on config object
  //         if (mergedTest.configuration) {
  //           mergedTest.configuration.isNew = !!mergedTest.configuration.isNew;
  //           mergedTest.configuration.isUpdated = !!mergedTest.configuration.isUpdated;
  //           mergedTest.configuration.isDeleted = !!mergedTest.configuration.isDeleted;
  //         }

  //         return mergedTest;
  //       }),
  //     })),
  //   }));

  //   console.log("[CourseBuilder] mergeServerWithLocalStaged finished");
  //   return merged;
  // };

  // const loadModules = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const cached = localStorage.getItem(`course_${courseId}`);

  //     if (cached && cached.length > 0) {
  //       // If there's a local snapshot we prefer it (keeps in-progress edits)
  //       const list: ModuleItem[] = JSON.parse(cached);

  //       // Merge canonical test-config store entries into snapshot rows so UI shows them
  //       const canonicalConfigs = testConfigStore.getAll(courseId) || [];
  //       if (canonicalConfigs.length > 0) {
  //         console.log("[CourseBuilder] applying canonical testConfigStore entries into local snapshot", {
  //           canonicalCount: canonicalConfigs.length,
  //         });
  //         const byTestId: Record<string, any> = {};
  //         const byCfgId: Record<string, any> = {};
  //         for (const c of canonicalConfigs) {
  //           if (c.testId) byTestId[String(c.testId)] = c;
  //           if (c._id) byCfgId[String(c._id)] = c;
  //         }

  //         for (const m of list) {
  //           for (const s of m.sections || []) {
  //             for (const t of s.tests || []) {
  //               // prefer matching by testId, else by config id if t.configuration exists and has _id, else by local temp id (testId may be temp)
  //               const canonical = (t.testId && byTestId[String(t.testId)]) || (t.configuration && t.configuration._id && byCfgId[String(t.configuration._id)]);
  //               if (canonical && (!t.configuration || Object.keys(t.configuration || {}).length === 0)) {
  //                 // Attach canonical config (do not override existing t.configuration)
  //                 t.configuration = canonical;
  //                 console.log("[CourseBuilder] attached canonical config into local test row", { testTempId: t._id, testId: t.testId, cfgId: canonical._id });
  //               }
  //             }
  //           }
  //         }
  //       }

  //       console.log("[CourseBuilder] loaded modules from local snapshot", { courseId, count: list.length });
  //       setModules(list);

  //       const activeModules = list.filter((m) => !m.isDeleted);
  //       if (activeModules.length > 0 && !selectedModuleId) {
  //         setSelectedModuleId(activeModules[0]._id ?? "");
  //       }
  //     } else {
  //       // Fetch server modules and merge staged configs (from canonical store) into them
  //       console.log("[CourseBuilder] fetching modules from server", { courseId });
  //       const res = await axios.get(`${API_BASE}/module/course/${courseId}`);
  //       let list: ModuleItem[] = res.data?.modules || [];

  //       // normalize flags on load
  //       list = list.map((m) => ({
  //         ...m,
  //         isNew: false,
  //         isUpdated: false,
  //         isDeleted: false,
  //         sections: (m.sections || []).map((s) => ({
  //           ...s,
  //           isNew: false,
  //           isUpdated: false,
  //           isDeleted: false,
  //           tests: (s.tests || []).map((t) => ({
  //             ...t,
  //             isNew: false,
  //             isUpdated: false,
  //             isDeleted: false,
  //           })),
  //         })),
  //       }));

  //       // Merge any staged configuration from canonical testConfigStore and from local snapshot (if present)
  //       const cachedRaw = localStorage.getItem(`course_${courseId}`);
  //       list = mergeServerWithLocalStaged(list, cachedRaw);

  //       setModules(list);
  //       persistLocalSnapshot(list);

  //       if (list.length > 0) setSelectedModuleId(list[0]._id ?? null);
  //     }
  //   } catch (err: any) {
  //     console.error("[CourseBuilder] loadModules error", err);
  //     toast.error(err?.response?.data?.message || "Failed to load modules");
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [courseId, selectedModuleId]);


// Add this import at the top with the other imports

// Update the mergeServerWithLocalStaged function to handle visibility
const mergeServerWithLocalStaged = (serverModules: ModuleItem[], localRaw: string | null) => {
  console.log("[CourseBuilder] mergeServerWithLocalStaged start", {
    serverModulesCount: serverModules.length,
    hasLocalRaw: !!localRaw,
  });

  // read canonical staged configs AND visibilities
  const canonicalConfigs = testConfigStore.getAll(courseId) || [];
  const canonicalVisibilities = testVisibilityStore.getAll(courseId) || [];
  
  const canonicalByTestId: Record<string, any> = {};
  const canonicalByCfgId: Record<string, any> = {};
  const visibilityByTestId: Record<string, any> = {};
  const visibilityByVisId: Record<string, any> = {};
  
  for (const c of canonicalConfigs) {
    if (c.testId) canonicalByTestId[String(c.testId)] = c;
    if (c._id) canonicalByCfgId[String(c._id)] = c;
  }
  
  for (const v of canonicalVisibilities) {
    if (v.testId) visibilityByTestId[String(v.testId)] = v;
    if (v._id) visibilityByVisId[String(v._id)] = v;
  }

  let localModules: ModuleItem[] = [];
  try {
    localModules = localRaw ? JSON.parse(localRaw) : [];
  } catch (e) {
    console.warn("[CourseBuilder] failed to parse local snapshot; skipping merge", e);
  }

  // quick lookup of test rows in local snapshot by testId / local _id
  const localByTestId: Record<string, any> = {};
  const localByLocalId: Record<string, any> = {};
  for (const lm of localModules) {
    for (const ls of lm.sections || []) {
      for (const lt of ls.tests || []) {
        if (lt.testId) localByTestId[String(lt.testId)] = lt;
        if (lt._id) localByLocalId[String(lt._id)] = lt;
      }
    }
  }

  const merged = serverModules.map((m) => ({
    ...m,
    sections: (m.sections || []).map((s) => ({
      ...s,
      tests: (s.tests || []).map((t) => {
        const serverHasConfiguration = !!(t.configuration && Object.keys(t.configuration || {}).length > 0);
        const serverHasVisibility = !!(t.visibility && Object.keys(t.visibility || {}).length > 0);

        // try staged entries attached to local snapshot test row (match by testId or server row _id)
        const localMatchByTestId = t.testId ? localByTestId[String(t.testId)] : null;
        const localMatchByLocalId = t._id ? localByLocalId[String(t._id)] : null;
        const localTest = localMatchByTestId || localMatchByLocalId;

        // try canonical store entries (by testId first, else by config/visibility _id if available)
        const canonicalMatchByTestId = t.testId ? canonicalByTestId[String(t.testId)] : null;
        const canonicalMatchByCfgId =
          (t.configuration && t.configuration._id && canonicalByCfgId[String(t.configuration._id)]) || null;
        
        const visibilityMatchByTestId = t.testId ? visibilityByTestId[String(t.testId)] : null;
        const visibilityMatchByVisId =
          (t.visibility && t.visibility._id && visibilityByVisId[String(t.visibility._id)]) || null;

        const mergedTest: any = { ...t };

        // CONFIGURATION MERGE (existing logic)
        if (!serverHasConfiguration && localTest && localTest.configuration && Object.keys(localTest.configuration).length > 0) {
          mergedTest.configuration = localTest.configuration;
          console.log("[CourseBuilder] merged staged configuration (from local snapshot) into server test", {
            module: m.moduleName,
            section: s.sectionName,
            testKey: t.testId ?? t._id,
            configId: mergedTest.configuration._id,
          });
        } else if (!serverHasConfiguration && canonicalMatchByTestId) {
          mergedTest.configuration = canonicalMatchByTestId;
          console.log("[CourseBuilder] merged staged configuration (from testConfigStore by testId) into server test", {
            module: m.moduleName,
            section: s.sectionName,
            testKey: t.testId ?? t._id,
            configId: mergedTest.configuration._id,
          });
        } else if (!serverHasConfiguration && canonicalMatchByCfgId) {
          mergedTest.configuration = canonicalMatchByCfgId;
          console.log("[CourseBuilder] merged staged configuration (from testConfigStore by cfgId) into server test", {
            module: m.moduleName,
            section: s.sectionName,
            testKey: t.testId ?? t._id,
            configId: mergedTest.configuration._id,
          });
        }

        // VISIBILITY MERGE (new logic - similar to configuration)
        if (!serverHasVisibility && localTest && localTest.visibility && Object.keys(localTest.visibility).length > 0) {
          mergedTest.visibility = localTest.visibility;
          console.log("[CourseBuilder] merged staged visibility (from local snapshot) into server test", {
            module: m.moduleName,
            section: s.sectionName,
            testKey: t.testId ?? t._id,
            visibilityId: mergedTest.visibility._id,
          });
        } else if (!serverHasVisibility && visibilityMatchByTestId) {
          mergedTest.visibility = visibilityMatchByTestId;
          console.log("[CourseBuilder] merged staged visibility (from testVisibilityStore by testId) into server test", {
            module: m.moduleName,
            section: s.sectionName,
            testKey: t.testId ?? t._id,
            visibilityId: mergedTest.visibility._id,
          });
        } else if (!serverHasVisibility && visibilityMatchByVisId) {
          mergedTest.visibility = visibilityMatchByVisId;
          console.log("[CourseBuilder] merged staged visibility (from testVisibilityStore by visId) into server test", {
            module: m.moduleName,
            section: s.sectionName,
            testKey: t.testId ?? t._id,
            visibilityId: mergedTest.visibility._id,
          });
        }

        // Normalize flags
        mergedTest.isNew = !!mergedTest.isNew;
        mergedTest.isUpdated = !!mergedTest.isUpdated;
        mergedTest.isDeleted = !!mergedTest.isDeleted;

        // If we attached canonical config, ensure flags normalized on config object
        if (mergedTest.configuration) {
          mergedTest.configuration.isNew = !!mergedTest.configuration.isNew;
          mergedTest.configuration.isUpdated = !!mergedTest.configuration.isUpdated;
          mergedTest.configuration.isDeleted = !!mergedTest.configuration.isDeleted;
        }

        // If we attached canonical visibility, ensure flags normalized on visibility object
        if (mergedTest.visibility) {
          mergedTest.visibility.isNew = !!mergedTest.visibility.isNew;
          mergedTest.visibility.isUpdated = !!mergedTest.visibility.isUpdated;
          mergedTest.visibility.isDeleted = !!mergedTest.visibility.isDeleted;
        }

        return mergedTest;
      }),
    })),
  }));

  console.log("[CourseBuilder] mergeServerWithLocalStaged finished");
  return merged;
};

// Update loadModules to also merge visibility from canonical store
const loadModules = useCallback(async () => {
  setLoading(true);
  try {
    const cached = localStorage.getItem(`course_${courseId}`);

    if (cached && cached.length > 0) {
      // If there's a local snapshot we prefer it (keeps in-progress edits)
      const list: ModuleItem[] = JSON.parse(cached);

      // Merge canonical test-config AND visibility store entries into snapshot rows so UI shows them
      const canonicalConfigs = testConfigStore.getAll(courseId) || [];
      const canonicalVisibilities = testVisibilityStore.getAll(courseId) || [];
      
      if (canonicalConfigs.length > 0 || canonicalVisibilities.length > 0) {
        console.log("[CourseBuilder] applying canonical stores into local snapshot", {
          canonicalConfigsCount: canonicalConfigs.length,
          canonicalVisibilitiesCount: canonicalVisibilities.length,
        });
        
        const byTestId: Record<string, any> = {};
        const byCfgId: Record<string, any> = {};
        const visibilityByTestId: Record<string, any> = {};
        const visibilityByVisId: Record<string, any> = {};
        
        for (const c of canonicalConfigs) {
          if (c.testId) byTestId[String(c.testId)] = c;
          if (c._id) byCfgId[String(c._id)] = c;
        }
        
        for (const v of canonicalVisibilities) {
          if (v.testId) visibilityByTestId[String(v.testId)] = v;
          if (v._id) visibilityByVisId[String(v._id)] = v;
        }

        for (const m of list) {
          for (const s of m.sections || []) {
            for (const t of s.tests || []) {
              // Configuration merge (existing logic)
              const canonical = (t.testId && byTestId[String(t.testId)]) || (t.configuration && t.configuration._id && byCfgId[String(t.configuration._id)]);
              if (canonical && (!t.configuration || Object.keys(t.configuration || {}).length === 0)) {
                t.configuration = canonical;
                console.log("[CourseBuilder] attached canonical config into local test row", { testTempId: t._id, testId: t.testId, cfgId: canonical._id });
              }
              
              // Visibility merge (new logic)
              const canonicalVisibility = (t.testId && visibilityByTestId[String(t.testId)]) || (t.visibility && t.visibility._id && visibilityByVisId[String(t.visibility._id)]);
              if (canonicalVisibility && (!t.visibility || Object.keys(t.visibility || {}).length === 0)) {
                t.visibility = canonicalVisibility;
                console.log("[CourseBuilder] attached canonical visibility into local test row", { testTempId: t._id, testId: t.testId, visId: canonicalVisibility._id });
              }
            }
          }
        }
      }

      console.log("[CourseBuilder] loaded modules from local snapshot", { courseId, count: list.length });
      setModules(list);

      const activeModules = list.filter((m) => !m.isDeleted);
      if (activeModules.length > 0 && !selectedModuleId) {
        setSelectedModuleId(activeModules[0]._id ?? "");
      }
    } else {
      // Fetch server modules and merge staged configs/visibilities (from canonical stores) into them
      console.log("[CourseBuilder] fetching modules from server", { courseId });
      const res = await axios.get(`${API_BASE}/module/course/${courseId}`);
      let list: ModuleItem[] = res.data?.modules || [];

      // normalize flags on load
      list = list.map((m) => ({
        ...m,
        isNew: false,
        isUpdated: false,
        isDeleted: false,
        sections: (m.sections || []).map((s) => ({
          ...s,
          isNew: false,
          isUpdated: false,
          isDeleted: false,
          tests: (s.tests || []).map((t) => ({
            ...t,
            isNew: false,
            isUpdated: false,
            isDeleted: false,
          })),
        })),
      }));

      // Merge any staged configuration/visibility from canonical stores and from local snapshot (if present)
      const cachedRaw = localStorage.getItem(`course_${courseId}`);
      list = mergeServerWithLocalStaged(list, cachedRaw);

      setModules(list);
      persistLocalSnapshot(list);

      if (list.length > 0) setSelectedModuleId(list[0]._id ?? null);
    }
  } catch (err: any) {
    console.error("[CourseBuilder] loadModules error", err);
    toast.error(err?.response?.data?.message || "Failed to load modules");
  } finally {
    setLoading(false);
  }
}, [courseId, selectedModuleId]);

// Add visibility store merging to handleSaveCourse (in the canonical merge section)
// Replace the existing canonical merge section with this:
// try {
//   const canonical = testConfigStore.getAll(courseId) || [];
//   const canonicalVisibilities = testVisibilityStore.getAll(courseId) || [];
  
//   console.log("[CourseBuilder] canonical staged data loaded", { 
//     configs: canonical.length,
//     visibilities: canonicalVisibilities.length 
//   });
  
//   if (canonical.length > 0 || canonicalVisibilities.length > 0) {
//     const byTestId: Record<string, any> = {};
//     const byCfgId: Record<string, any> = {};
//     const visibilityByTestId: Record<string, any> = {};
//     const visibilityByVisId: Record<string, any> = {};
    
//     for (const c of canonical) {
//       if (c.testId) byTestId[String(c.testId)] = c;
//       if (c._id) byCfgId[String(c._id)] = c;
//     }
    
//     for (const v of canonicalVisibilities) {
//       if (v.testId) visibilityByTestId[String(v.testId)] = v;
//       if (v._id) visibilityByVisId[String(v._id)] = v;
//     }

//     for (const m of localModules) {
//       for (const s of m.sections || []) {
//         for (const t of s.tests || []) {
//           const resolvedTestId = t.testId || tempToReal[t._id] || undefined;
          
//           // Configuration merge
//           const cfgByTest = resolvedTestId ? byTestId[String(resolvedTestId)] : undefined;
//           const cfgByCfgId = t.configuration && t.configuration._id ? byCfgId[String(t.configuration._id)] : undefined;
//           const pickConfig = cfgByTest || cfgByCfgId;
//           if (pickConfig) {
//             if (!t.configuration || Object.keys(t.configuration || {}).length === 0) {
//               t.configuration = { ...pickConfig };
//               console.log("[CourseBuilder] attached canonical config to localModules test row", {
//                 module: m.moduleName,
//                 section: s.sectionName,
//                 testTempId: t._id,
//                 testId: t.testId,
//                 cfgId: pickConfig._id,
//               });
//             }
//           }
          
//           // Visibility merge
//           const visByTest = resolvedTestId ? visibilityByTestId[String(resolvedTestId)] : undefined;
//           const visByVisId = t.visibility && t.visibility._id ? visibilityByVisId[String(t.visibility._id)] : undefined;
//           const pickVisibility = visByTest || visByVisId;
//           if (pickVisibility) {
//             if (!t.visibility || Object.keys(t.visibility || {}).length === 0) {
//               t.visibility = { ...pickVisibility };
//               console.log("[CourseBuilder] attached canonical visibility to localModules test row", {
//                 module: m.moduleName,
//                 section: s.sectionName,
//                 testTempId: t._id,
//                 testId: t.testId,
//                 visId: pickVisibility._id,
//               });
//             }
//           }
//         }
//       }
//     }
//   }
// } catch (e) {
//   console.warn("[CourseBuilder] failed to merge canonical configs/visibilities into localModules", e);
// }

// Add testVisibilityStore cleanup in the success section of handleSaveCourse
// Remove persisted canonical staged configs and visibilities that were saved

// try {
//   const stagedCfgs = testConfigStore.getAll(courseId) || [];
//   const stagedVis = testVisibilityStore.getAll(courseId) || [];
  
//   if (stagedCfgs.length > 0 || stagedVis.length > 0) {
//     const savedTestIds = new Set<string>();
//     for (const m of savedModules) for (const s of m.sections || []) for (const t of s.tests || []) savedTestIds.add(String(t.testId || t._id));

//     // Cleanup configs
//     for (const cfg of stagedCfgs) {
//       if (cfg.testId && savedTestIds.has(String(cfg.testId))) {
//         testConfigStore.remove(courseId, { _id: cfg._id, testId: cfg.testId }, true);
//         console.log("[CourseBuilder] removed canonical staged config after successful save", { cfgId: cfg._id, testId: cfg.testId });
//       }
//     }
    
//     // Cleanup visibilities
//     for (const vis of stagedVis) {
//       if (vis.testId && savedTestIds.has(String(vis.testId))) {
//         testVisibilityStore.remove(courseId, { _id: vis._id, testId: vis.testId }, true);
//         console.log("[CourseBuilder] removed canonical staged visibility after successful save", { visId: vis._id, testId: vis.testId });
//       }
//     }
//   }
// } catch (e) {
//   console.warn("[CourseBuilder] failed to cleanup stores after successful save", e);
// }

const cleanupStagedStoresAfterSave = (courseId: string, savedModules: ModuleItem[]) => {
  try {
    const stagedCfgs = testConfigStore.getAll(courseId) || [];
    const stagedVis = testVisibilityStore.getAll(courseId) || [];

    if (stagedCfgs.length > 0 || stagedVis.length > 0) {
      const savedTestIds = new Set<string>();
      for (const m of savedModules) {
        for (const s of m.sections || []) {
          for (const t of s.tests || []) savedTestIds.add(String(t.testId || t._id));
        }
      }

      // Cleanup configs
      for (const cfg of stagedCfgs) {
        if (cfg.testId && savedTestIds.has(String(cfg.testId))) {
          testConfigStore.remove(courseId, { _id: cfg._id, testId: cfg.testId }, true);
          console.log("[CourseBuilder] removed canonical staged config after successful save", { cfgId: cfg._id, testId: cfg.testId });
        }
      }

      // Cleanup visibilities
      for (const vis of stagedVis) {
        if (vis.testId && savedTestIds.has(String(vis.testId))) {
          testVisibilityStore.remove(courseId, { _id: vis._id, testId: vis.testId }, true);
          console.log("[CourseBuilder] removed canonical staged visibility after successful save", { visId: vis._id, testId: vis.testId });
        }
      }
    }
  } catch (e) {
    console.warn("[CourseBuilder] failed to cleanup stores after successful save", e);
  }
};


  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const refreshModules = useCallback(
    (nextModuleIdToSelect?: string | null) => {
      const cached = localStorage.getItem(`course_${courseId}`);
      let list: ModuleItem[] = cached ? JSON.parse(cached) : [];

      list = list.map((m) => ({
        ...m,
        isNew: m.isNew ?? false,
        isUpdated: m.isUpdated ?? false,
        isDeleted: m.isDeleted ?? false,
      }));

      setModules(list);
      if (nextModuleIdToSelect !== undefined) setSelectedModuleId(nextModuleIdToSelect);
    },
    [courseId]
  );

  const normalizeAndDedupeSnapshot = (rawModules: ModuleItem[]): ModuleItem[] => {
    if (!Array.isArray(rawModules)) return [];
    const modulesCopy: ModuleItem[] = JSON.parse(JSON.stringify(rawModules));
    for (const m of modulesCopy) {
      for (const s of m.sections || []) {
        const seenIds = new Set<string>();
        const unique: any[] = [];
        for (const t of s.tests || []) {
          const idKey = t._id || t.testId || JSON.stringify(t);
          if (seenIds.has(String(idKey))) continue;
          seenIds.add(String(idKey));
          unique.push(t);
        }
        const byTestId: Record<string, any> = {};
        for (const t of unique) {
          const key = t.testId ? String(t.testId) : String(t._id);
          const prev = byTestId[key];
          if (!prev) byTestId[key] = t;
          else {
            if (prev.isDeleted && !t.isDeleted) byTestId[key] = t;
            else if (!prev.isDeleted && t.isDeleted) { /* keep prev */ }
            else if ((t.isUpdated || t.isNew) && !(prev.isUpdated || prev.isNew)) byTestId[key] = t;
          }
        }
        s.tests = Object.values(byTestId).map((x) => {
          x.isNew = !!x.isNew;
          x.isUpdated = !!x.isUpdated;
          x.isDeleted = !!x.isDeleted;
          // Added normalization for config flags:
          if (x.configuration) {
            x.configuration.isNew = !!x.configuration.isNew;
            x.configuration.isUpdated = !!x.configuration.isUpdated;
            x.configuration.isDeleted = !!x.configuration.isDeleted;
          }
          return x;
        });
        const visible = s.tests.filter((t: any) => !t.isDeleted).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        visible.forEach((t: any, i: number) => (t.order = i + 1));
        const deleted = s.tests.filter((t: any) => t.isDeleted);
        s.tests = [...visible, ...deleted];
      }
    }
    return modulesCopy;
  };

  const buildTempToRealTestMap = (localModules: ModuleItem[], savedModules: ModuleItem[]): Record<string, string> => {
    const tempToReal: Record<string, string> = {};
    console.log("[CourseBuilder] buildTempToRealTestMap start", { localCount: localModules.length, savedCount: savedModules.length });

    const localIndex: Record<string, { tempId: string; t: any }> = {};
    for (const m of localModules) {
      for (const s of m.sections || []) {
        for (const t of s.tests || []) {
          const key = `${m.moduleName}||${s.sectionName}||${t.order}||${t.testId || t._id}`;
          const prev = localIndex[key];
          if (!prev) localIndex[key] = { tempId: t._id, t };
          else {
            if (prev.t.isDeleted && !t.isDeleted) localIndex[key] = { tempId: t._id, t };
            else if (!prev.t.isDeleted && t.isDeleted) { /* keep prev */ }
            else if ((t.isUpdated || t.isNew) && !(prev.t.isUpdated || prev.t.isNew)) localIndex[key] = { tempId: t._id, t };
          }
        }
      }
    }

    for (const m of savedModules) {
      for (const s of m.sections || []) {
        for (const t of s.tests || []) {
          const savedKey = `${m.moduleName}||${s.sectionName}||${t.order}||${t.testId || t._id}`;
          const localEntry = localIndex[savedKey];
          const realId = t.testId || t._id;
          if (localEntry && localEntry.tempId && realId && String(localEntry.tempId) !== String(realId)) {
            tempToReal[localEntry.tempId] = realId;
            console.log("[CourseBuilder] mapped temp -> real", { temp: localEntry.tempId, real: realId });
          } else {
            // fallback: match by moduleName+sectionName+order
            const localModule = localModules.find((lm) => lm.moduleName === m.moduleName);
            const localSection = localModule?.sections?.find((ls) => ls.sectionName === s.sectionName);
            if (localSection) {
              const localTest = (localSection.tests || []).find((x) => x.order === t.order);
              if (localTest && localTest._id && realId && String(localTest._id) !== String(realId)) {
                tempToReal[localTest._id] = realId;
                console.log("[CourseBuilder] fallback mapped temp -> real", { temp: localTest._id, real: realId });
              }
            }
          }
        }
      }
    }

    console.log("[CourseBuilder] buildTempToRealTestMap finished", { mappings: Object.keys(tempToReal).length });
    return tempToReal;
  };

 
//   const collectStagedConfigsAndVisibilities = (
//   localModules: ModuleItem[],
//   tempToReal: Record<string, string>
// ) => {
//   console.log("[CourseBuilder] collectStagedConfigsAndVisibilities start");
//   const configs: any[] = [];
//   const visibilities: any[] = [];

//   const isObjectId = (id?: any) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(String(id));

//   for (const m of localModules) {
//     for (const s of m.sections || []) {
//       for (const t of s.tests || []) {
//         // resolve mappedTestId (prefer already-set testId otherwise map temp -> real)
//         const mappedTestId = t.testId || tempToReal[t._id] || null;

//         /** ---------- CONFIGURATION (support both `configuration` and `configurationId`) ---------- */
//         const rawCfgObj = (t as any).configuration ?? (t as any).configurationId ?? null;
//         const cfgObj = rawCfgObj ? { ...rawCfgObj } : null;

//         if (cfgObj) {
//           // Determine whether config has meaningful content
//           const hasContent =
//             !!cfgObj.startTime ||
//             !!cfgObj.endTime ||
//             typeof cfgObj.durationInMinutes === "number" ||
//             !!cfgObj._id ||
//             !!cfgObj.lastSavedAt;

//           // Explicit flags if provided
//           const explicitIsNew = "isNew" in cfgObj ? !!cfgObj.isNew : undefined;
//           const explicitIsUpdated = "isUpdated" in cfgObj ? !!cfgObj.isUpdated : undefined;
//           const explicitIsDeleted = !!cfgObj.isDeleted;

//           // Decide whether the stored _id is a real persisted id or a local placeholder
//           const rawId = cfgObj._id;
//           const hasRealCfgId = !!rawId && isObjectId(rawId) && !String(rawId).startsWith("local-config-");

//           // Infer flags when not explicit:
//           // - If there is a real id, treat as updated (unless explicitly marked deleted).
//           // - If no real id, treat as new if there's content.
//           const inferredIsNew = explicitIsNew !== undefined ? explicitIsNew : !hasRealCfgId && hasContent;
//           const inferredIsUpdated = explicitIsUpdated !== undefined ? explicitIsUpdated : !!hasRealCfgId;

//           const shouldQueueConfig = explicitIsNew || explicitIsUpdated || explicitIsDeleted || hasContent;

//           if (shouldQueueConfig) {
//             const cfg = {
//               // do NOT send local placeholder ids to server; only include _id when it's a real persisted id
//               _id: hasRealCfgId ? String(cfgObj._id) : undefined,
//               testId: mappedTestId,
//               courseId,
//               startTime: cfgObj.startTime,
//               endTime: cfgObj.endTime,
//               durationInMinutes: cfgObj.durationInMinutes,
//               maxAttempts: cfgObj.maxAttempts,
//               isRetakeAllowed: cfgObj.isRetakeAllowed,
//               isPreparationTest: cfgObj.isPreparationTest,
//               isProctored: cfgObj.isProctored,
//               malpracticeLimit: cfgObj.malpracticeLimit,
//               correctMark: cfgObj.correctMark,
//               negativeMark: cfgObj.negativeMark,
//               passPercentage: cfgObj.passPercentage,
//               // flags: prefer explicit, otherwise inferred
//               isNew: !!inferredIsNew,
//               isUpdated: !!inferredIsUpdated,
//               isDeleted: !!explicitIsDeleted,
//               isLocal: !hasRealCfgId,
//               lastUpdatedBy: userId,
//               createdBy: userId,
//             };

//             if (cfg.testId) {
//               configs.push(cfg);
//               console.log("[CourseBuilder] queued staged CONFIGURATION for bulk-save", {
//                 module: m.moduleName,
//                 section: s.sectionName,
//                 testTempId: t._id,
//                 mappedTestId,
//                 flags: { isNew: cfg.isNew, isUpdated: cfg.isUpdated, isDeleted: cfg.isDeleted },
//                 preview: { startTime: cfg.startTime, endTime: cfg.endTime, _id: cfg._id },
//               });
//             } else {
//               console.warn("[CourseBuilder] skipped configuration - no mapped test id (will try to map later)", {
//                 module: m.moduleName,
//                 section: s.sectionName,
//                 testTempId: t._id,
//                 cfgObj,
//               });
//             }
//           } else {
//             console.debug("[CourseBuilder] ignoring configuration - no content or flags", {
//               module: m.moduleName,
//               section: s.sectionName,
//               testTempId: t._id,
//               cfgObj,
//             });
//           }
//         }

//         /** ---------- VISIBILITY (unchanged - kept for completeness) ---------- */
//         const visObj = (t as any).visibility ?? null;
//         if (visObj && (visObj.isNew || visObj.isUpdated || visObj.isDeleted)) {
//           const vis = {
//             _id: visObj._id && isObjectId(visObj._id) ? visObj._id : undefined,
//             testId: mappedTestId,
//             courseId,
//             includeGroups: visObj.includeGroups || [],
//             excludeGroups: visObj.excludeGroups || [],
//             includeCandidates: visObj.includeCandidates || [],
//             excludeCandidates: visObj.excludeCandidates || [],
//             isNew: !!visObj.isNew,
//             isUpdated: !!visObj.isUpdated,
//             isDeleted: !!visObj.isDeleted,
//             isLocal: !!visObj.isLocal,
//             lastUpdatedBy: userId,
//             createdBy: userId,
//           };

//           if (vis.testId) {
//             visibilities.push(vis);
//             console.log("[CourseBuilder] queued staged VISIBILITY for bulk-save", {
//               module: m.moduleName,
//               section: s.sectionName,
//               testTempId: t._id,
//               mappedTestId,
//             });
//           } else {
//             console.warn("[CourseBuilder] skipped visibility - no mapped test id", { testTempId: t._id, visObj });
//           }
//         }
//       }
//     }
//   }

//   console.log("[CourseBuilder] collectStagedConfigsAndVisibilities finished", {
//     configs: configs.length,
//     visibilities: visibilities.length,
//   });
//   return { configs, visibilities };
// };



const collectStagedConfigsAndVisibilities = (
  localModules: ModuleItem[],
  tempToReal: Record<string, string>
) => {
  console.log("[CourseBuilder] collectStagedConfigsAndVisibilities start");
  const configs: any[] = [];
  const visibilities: any[] = [];

  const isObjectId = (id?: any) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(String(id));

  for (const m of localModules) {
    for (const s of m.sections || []) {
      for (const t of s.tests || []) {
        // resolve mappedTestId (prefer already-set testId otherwise map temp -> real)
        const mappedTestId = t.testId || tempToReal[t._id] || null;

        /** ---------- CONFIGURATION (support both `configuration` and `configurationId`) ---------- */
        const rawCfgObj = (t as any).configuration ?? (t as any).configurationId ?? null;
        const cfgObj = rawCfgObj ? { ...rawCfgObj } : null;

        if (cfgObj) {
          // Determine whether config has meaningful content
          const hasContent =
            !!cfgObj.startTime ||
            !!cfgObj.endTime ||
            typeof cfgObj.durationInMinutes === "number" ||
            !!cfgObj._id ||
            !!cfgObj.lastSavedAt;

          // Explicit flags if provided
          const explicitIsNew = "isNew" in cfgObj ? !!cfgObj.isNew : undefined;
          const explicitIsUpdated = "isUpdated" in cfgObj ? !!cfgObj.isUpdated : undefined;
          const explicitIsDeleted = !!cfgObj.isDeleted;

          // Decide whether the stored _id is a real persisted id or a local placeholder
          const rawId = cfgObj._id;
          const hasRealCfgId = !!rawId && isObjectId(rawId) && !String(rawId).startsWith("local-config-");

          // Infer flags when not explicit:
          // - If there is a real id, treat as updated (unless explicitly marked deleted).
          // - If no real id, treat as new if there's content.
          const inferredIsNew = explicitIsNew !== undefined ? explicitIsNew : !hasRealCfgId && hasContent;
          const inferredIsUpdated = explicitIsUpdated !== undefined ? explicitIsUpdated : !!hasRealCfgId;

          const shouldQueueConfig = explicitIsNew || explicitIsUpdated || explicitIsDeleted || hasContent;

          if (shouldQueueConfig) {
            const cfg = {
              // do NOT send local placeholder ids to server; only include _id when it's a real persisted id
              _id: hasRealCfgId ? String(cfgObj._id) : undefined,
              testId: mappedTestId,
              courseId,
              startTime: cfgObj.startTime,
              endTime: cfgObj.endTime,
              durationInMinutes: cfgObj.durationInMinutes,
              maxAttempts: cfgObj.maxAttempts,
              isRetakeAllowed: cfgObj.isRetakeAllowed,
              isPreparationTest: cfgObj.isPreparationTest,
              isProctored: cfgObj.isProctored,
              malpracticeLimit: cfgObj.malpracticeLimit,
              correctMark: cfgObj.correctMark,
              negativeMark: cfgObj.negativeMark,
              passPercentage: cfgObj.passPercentage,
              // flags: prefer explicit, otherwise inferred
              isNew: !!inferredIsNew,
              isUpdated: !!inferredIsUpdated,
              isDeleted: !!explicitIsDeleted,
              isLocal: !hasRealCfgId,
              lastUpdatedBy: userId,
              createdBy: userId,
            };

            if (cfg.testId) {
              configs.push(cfg);
              console.log("[CourseBuilder] queued staged CONFIGURATION for bulk-save", {
                module: m.moduleName,
                section: s.sectionName,
                testTempId: t._id,
                mappedTestId,
                flags: { isNew: cfg.isNew, isUpdated: cfg.isUpdated, isDeleted: cfg.isDeleted },
                preview: { startTime: cfg.startTime, endTime: cfg.endTime, _id: cfg._id },
              });
            } else {
              console.warn("[CourseBuilder] skipped configuration - no mapped test id (will try to map later)", {
                module: m.moduleName,
                section: s.sectionName,
                testTempId: t._id,
                cfgObj,
              });
            }
          } else {
            console.debug("[CourseBuilder] ignoring configuration - no content or flags", {
              module: m.moduleName,
              section: s.sectionName,
              testTempId: t._id,
              cfgObj,
            });
          }
        }

        /** ---------- VISIBILITY (UPDATED: Same logic pattern as configuration) ---------- */
        const rawVisObj = (t as any).visibility ?? null;
        const visObj = rawVisObj ? { ...rawVisObj } : null;

        if (visObj) {
          // Determine whether visibility has meaningful content
          const hasContent =
            (Array.isArray(visObj.includeGroups) && visObj.includeGroups.length > 0) ||
            (Array.isArray(visObj.excludeGroups) && visObj.excludeGroups.length > 0) ||
            (Array.isArray(visObj.includeCandidates) && visObj.includeCandidates.length > 0) ||
            (Array.isArray(visObj.excludeCandidates) && visObj.excludeCandidates.length > 0) ||
            !!visObj._id ||
            !!visObj.lastSavedAt;

          // Explicit flags if provided
          const explicitIsNew = "isNew" in visObj ? !!visObj.isNew : undefined;
          const explicitIsUpdated = "isUpdated" in visObj ? !!visObj.isUpdated : undefined;
          const explicitIsDeleted = !!visObj.isDeleted;

          // Decide whether the stored _id is a real persisted id or a local placeholder
          const rawId = visObj._id;
          const hasRealVisId = !!rawId && isObjectId(rawId) && !String(rawId).startsWith("local-vis-");

          // Infer flags when not explicit:
          // - If there is a real id, treat as updated (unless explicitly marked deleted).
          // - If no real id, treat as new if there's content.
          const inferredIsNew = explicitIsNew !== undefined ? explicitIsNew : !hasRealVisId && hasContent;
          const inferredIsUpdated = explicitIsUpdated !== undefined ? explicitIsUpdated : !!hasRealVisId;

          const shouldQueueVisibility = explicitIsNew || explicitIsUpdated || explicitIsDeleted || hasContent;

          if (shouldQueueVisibility) {
            const vis = {
              // do NOT send local placeholder ids to server; only include _id when it's a real persisted id
              _id: hasRealVisId ? String(visObj._id) : undefined,
              testId: mappedTestId,
              courseId,
              includeGroups: visObj.includeGroups || [],
              excludeGroups: visObj.excludeGroups || [],
              includeCandidates: visObj.includeCandidates || [],
              excludeCandidates: visObj.excludeCandidates || [],
              // flags: prefer explicit, otherwise inferred
              isNew: !!inferredIsNew,
              isUpdated: !!inferredIsUpdated,
              isDeleted: !!explicitIsDeleted,
              isLocal: !hasRealVisId,
              lastUpdatedBy: userId,
              createdBy: userId,
            };

            if (vis.testId) {
              visibilities.push(vis);
              console.log("[CourseBuilder] queued staged VISIBILITY for bulk-save", {
                module: m.moduleName,
                section: s.sectionName,
                testTempId: t._id,
                mappedTestId,
                flags: { isNew: vis.isNew, isUpdated: vis.isUpdated, isDeleted: vis.isDeleted },
                preview: { 
                  includeGroups: vis.includeGroups?.length || 0, 
                  excludeGroups: vis.excludeGroups?.length || 0,
                  includeCandidates: vis.includeCandidates?.length || 0,
                  excludeCandidates: vis.excludeCandidates?.length || 0,
                  _id: vis._id 
                },
              });
            } else {
              console.warn("[CourseBuilder] skipped visibility - no mapped test id (will try to map later)", {
                module: m.moduleName,
                section: s.sectionName,
                testTempId: t._id,
                visObj,
              });
            }
          } else {
            console.debug("[CourseBuilder] ignoring visibility - no content or flags", {
              module: m.moduleName,
              section: s.sectionName,
              testTempId: t._id,
              visObj,
            });
          }
        }
      }
    }
  }

  console.log("[CourseBuilder] collectStagedConfigsAndVisibilities finished", {
    configs: configs.length,
    visibilities: visibilities.length,
  });
  return { configs, visibilities };
};


// const handleSaveCourse = async () => {
//   try {
//     setSaving(true);

//     const cachedRaw = localStorage.getItem(`course_${courseId}`);
//     if (!cachedRaw) {
//       toast.error("No changes to save (local snapshot missing).");
//       setSaving(false);
//       return;
//     }

//     // Step 0: normalize & dedupe snapshot before saving
//     let localModules: ModuleItem[] = JSON.parse(cachedRaw);
//     localModules = normalizeAndDedupeSnapshot(localModules);
//     persistLocalSnapshot(localModules);
//     console.log("[CourseBuilder] normalized snapshot prepared for save", { localModulesCount: localModules.length });

//     // Step 1: save modules structure
//     const payload = { courseId, modules: localModules, updatedBy: userId };
//     const saveModulesResp = await axios.post(`${API_BASE}/course/save-modules`, payload);
//     const savedModules: ModuleItem[] = saveModulesResp.data?.modules || [];
//     console.log("[CourseBuilder] server returned savedModules", { savedCount: savedModules.length });

//     // Step 2: map temp -> real test ids
//     const tempToReal = buildTempToRealTestMap(localModules, savedModules);
//     console.log("[CourseBuilder] tempToReal mapping", tempToReal);

//     // ------------------ NEW: attach canonical testConfigStore entries into localModules ------------------
//     try {
//       const canonical = testConfigStore.getAll(courseId) || [];
//       console.log("[CourseBuilder] canonical staged configs loaded", { count: canonical.length });
//       if (canonical.length > 0) {
//         const byTestId: Record<string, any> = {};
//         const byCfgId: Record<string, any> = {};
//         for (const c of canonical) {
//           if (c.testId) byTestId[String(c.testId)] = c;
//           if (c._id) byCfgId[String(c._id)] = c;
//         }

//         for (const m of localModules) {
//           for (const s of m.sections || []) {
//             for (const t of s.tests || []) {
//               const resolvedTestId = t.testId || tempToReal[t._id] || undefined;
//               const cfgByTest = resolvedTestId ? byTestId[String(resolvedTestId)] : undefined;
//               const cfgByCfgId = t.configuration && t.configuration._id ? byCfgId[String(t.configuration._id)] : undefined;
//               const pick = cfgByTest || cfgByCfgId;
//               if (pick) {
//                 // only attach if row has no configuration yet
//                 if (!t.configuration || Object.keys(t.configuration || {}).length === 0) {
//                   t.configuration = { ...pick };
//                   console.log("[CourseBuilder] attached canonical config to localModules test row", {
//                     module: m.moduleName,
//                     section: s.sectionName,
//                     testTempId: t._id,
//                     testId: t.testId,
//                     cfgId: pick._id,
//                   });
//                 } else {
//                   console.log("[CourseBuilder] skipped attaching canonical config because row already has configuration", {
//                     testTempId: t._id,
//                     existingCfgId: t.configuration && t.configuration._id,
//                     canonicalCfgId: pick._id,
//                   });
//                 }
//               }
//             }
//           }
//         }
//       }
//     } catch (e) {
//       console.warn("[CourseBuilder] failed to merge canonical configs into localModules", e);
//     }
//     // -----------------------------------------------------------------------------------------------

//     // Step 3: collect staged configuration + visibility (configuration-only)
//     const { configs, visibilities } = collectStagedConfigsAndVisibilities(localModules, tempToReal);

//     // Step 4: bulk calls
//     const bulkCalls: Array<Promise<any>> = [];
//     if (configs.length > 0) {
//       console.log("[CourseBuilder] calling test-configuration/bulk-save", { configsCount: configs.length });
//       bulkCalls.push(axios.post(`${API_BASE}/test-configuration/bulk-save`, { items: configs, courseId, userId }));
//     } else {
//       console.log("[CourseBuilder] no staged configurations to persist");
//     }

//     if (visibilities.length > 0) {
//       console.log("[CourseBuilder] calling test-visibility/bulk-save", { visibilitiesCount: visibilities.length });
//       bulkCalls.push(axios.post(`${API_BASE}/test-visibility/bulk-save`, { visibilities, courseId, userId }));
//     } else {
//       console.log("[CourseBuilder] no staged visibilities to persist");
//     }

//     // If nothing staged, finalize and persist server savedModules snapshot
//     if (bulkCalls.length === 0) {
//       const finalCleaned = savedModules.map((m) => ({
//         ...m,
//         isNew: false,
//         isUpdated: false,
//         isDeleted: false,
//         sections: (m.sections || []).map((s) => ({
//           ...s,
//           isNew: false,
//           isUpdated: false,
//           isDeleted: false,
//           tests: (s.tests || []).map((t) => ({ ...t, isNew: false, isUpdated: false, isDeleted: false })),
//         })),
//       }));
//       setModules(finalCleaned);
//       persistLocalSnapshot(finalCleaned);
//       // Clean up canonical config store for entries that might have been applied (best-effort) - optional:
//       try {
//         const cfgs = testConfigStore.getAll(courseId) || [];
//         if (cfgs.length > 0) {
//           const savedTestIds = new Set<string>();
//           for (const m of savedModules) for (const s of m.sections || []) for (const t of s.tests || []) savedTestIds.add(String(t.testId || t._id));
//           for (const cfg of cfgs) {
//             if (cfg.testId && savedTestIds.has(String(cfg.testId))) {
//               testConfigStore.remove(courseId, { _id: cfg._id, testId: cfg.testId }, true);
//               console.log("[CourseBuilder] removed canonical staged config after no-op bulk", { cfgId: cfg._id, testId: cfg.testId });
//             }
//           }
//         }
//       } catch (e) {
//         console.debug("[CourseBuilder] cleanup of testConfigStore after no-op bulk failed", e);
//       }

//       toast.success("Course saved successfully 🎉");
//       setSaving(false);
//       return;
//     }

//     const results = await Promise.allSettled(bulkCalls);

//     // analyze results
//     let anyFail = false;
//     const errors: string[] = [];
//     for (const r of results) {
//       if (r.status === "rejected") {
//         anyFail = true;
//         errors.push(r.reason?.message || JSON.stringify(r.reason) || "Unknown error");
//       } else {
//         const val = r.value;
//         if (val?.status && val.status >= 400) {
//           anyFail = true;
//           errors.push(val?.data?.error || JSON.stringify(val?.data) || "Bulk save failed");
//         }
//       }
//     }

//     if (anyFail) {
//       console.warn("[CourseBuilder] bulk save had failures", { errors });

//       // attach staged config/visibility back onto cleaned savedModules snapshot so user can retry
//       const cleaned = savedModules.map((m) => ({
//         ...m,
//         isNew: false,
//         isUpdated: false,
//         isDeleted: false,
//         sections: (m.sections || []).map((s) => ({
//           ...s,
//           isNew: false,
//           isUpdated: false,
//           isDeleted: false,
//           tests: (s.tests || []).map((t) => ({ ...t, isNew: false, isUpdated: false, isDeleted: false })),
//         })),
//       }));

//       const cleanedIndex: Record<string, any> = {};
//       for (const m of cleaned) {
//         for (const s of m.sections || []) {
//           for (const t of s.tests || []) {
//             const key = `${m.moduleName}||${s.sectionName}||${t.order}`;
//             cleanedIndex[key] = t;
//           }
//         }
//       }

//       for (const lm of localModules) {
//         for (const ls of lm.sections || []) {
//           for (const lt of ls.tests || []) {
//             const key = `${lm.moduleName}||${ls.sectionName}||${lt.order}`;
//             const cleanedTest = cleanedIndex[key];
//             if (!cleanedTest) continue;
//             if (lt.configuration) cleanedTest.configuration = lt.configuration;
//             if (lt.visibility) cleanedTest.visibility = lt.visibility;
//           }
//         }
//       }

//       setModules(cleaned);
//       persistLocalSnapshot(cleaned);

//       toast.error(`Saved structure but failed to persist some configuration/visibility. Retry Save Course. Errors: ${errors.join("; ")}`);
//       return;
//     }

//     // success: finalize using server savedModules
//     const finalCleaned = savedModules.map((m) => ({
//       ...m,
//       isNew: false,
//       isUpdated: false,
//       isDeleted: false,
//       sections: (m.sections || []).map((s) => ({
//         ...s,
//         isNew: false,
//         isUpdated: false,
//         isDeleted: false,
//         tests: (s.tests || []).map((t) => ({ ...t, isNew: false, isUpdated: false, isDeleted: false })),
//       })),
//     }));

//     // --- MERGE mapped config ids returned by bulk save into localStorage & finalCleaned ---
//     try {
//       // collect all mapped arrays from fulfilled bulk responses
//       const allMapped: Array<{ oldLocalId: string; newId: string; testId?: string }> = [];
//       for (const r of results) {
//         if (r.status !== "fulfilled") continue;
//         const payload = (r as any).value?.data ?? (r as any).value;
//         if (payload && Array.isArray(payload.mapped) && payload.mapped.length > 0) {
//           for (const m of payload.mapped) allMapped.push(m);
//         }
//       }

//       if (allMapped.length > 0) {
//         console.log("[CourseBuilder] merging mapped config ids into snapshots", { mappedCount: allMapped.length });

//         // 1) Update localStorage snapshot (course_<courseId>)
//         try {
//           const lsKey = `course_${courseId}`;
//           const raw = localStorage.getItem(lsKey) || "[]";
//           const modulesLs: ModuleItem[] = JSON.parse(raw);

//           for (const m of modulesLs) {
//             for (const s of m.sections || []) {
//               for (const t of s.tests || []) {
//                 const cfg = (t as any).configuration ?? (t as any).configurationId;
//                 if (!cfg || !cfg._id) continue;
//                 const map = allMapped.find((mm) => String(mm.oldLocalId) === String(cfg._id));
//                 if (!map) continue;

//                 cfg._id = String(map.newId);
//                 cfg.isNew = false;
//                 cfg.isUpdated = false;
//                 cfg.isLocal = false;
//                 cfg.lastSavedAt = cfg.lastSavedAt || new Date().toISOString();

//                 (t as any).configuration = { ...cfg };
//                 (t as any).configurationId = { ...cfg };

//                 console.log("[CourseBuilder] applied mapping to LS test row", { testId: t.testId || t._id, oldLocalId: map.oldLocalId, newId: map.newId });
//               }
//             }
//           }

//           localStorage.setItem(lsKey, JSON.stringify(modulesLs));
//         } catch (e) {
//           console.warn("[CourseBuilder] failed to merge mapped ids into localStorage", e);
//         }

//         // 2) Update finalCleaned snapshot
//         try {
//           for (const m of finalCleaned) {
//             for (const s of m.sections || []) {
//               for (const t of s.tests || []) {
//                 let cfg = (t as any).configuration ?? (t as any).configurationId;
//                 if (!cfg || !cfg._id) continue;
//                 const map = allMapped.find((mm) => String(mm.oldLocalId) === String(cfg._id));
//                 if (!map) continue;

//                 cfg._id = String(map.newId);
//                 cfg.isNew = false;
//                 cfg.isUpdated = false;
//                 cfg.isLocal = false;
//                 cfg.lastSavedAt = cfg.lastSavedAt || new Date().toISOString();

//                 (t as any).configuration = { ...cfg };
//                 (t as any).configurationId = { ...cfg };

//                 console.log("[CourseBuilder] applied mapping to finalCleaned test row", { testId: t.testId || t._id, oldLocalId: map.oldLocalId, newId: map.newId });
//               }
//             }
//           }
//         } catch (e) {
//           console.warn("[CourseBuilder] failed to merge mapped ids into finalCleaned", e);
//         }
//       } else {
//         console.log("[CourseBuilder] no mapped config ids returned from bulk save");
//       }
//     } catch (outerErr) {
//       console.warn("[CourseBuilder] error while merging mapped results", outerErr);
//     }
//     // --- end merge ---

//     setModules(finalCleaned);
//     persistLocalSnapshot(finalCleaned);

//     // Remove persisted canonical staged configs that were saved
//     try {
//       const stagedCfgs = testConfigStore.getAll(courseId) || [];
//       if (stagedCfgs.length > 0) {
//         // Attempt to remove those that map to savedModules' test ids
//         const savedTestIds = new Set<string>();
//         for (const m of savedModules) for (const s of m.sections || []) for (const t of s.tests || []) savedTestIds.add(String(t.testId || t._id));

//         for (const cfg of stagedCfgs) {
//           if (cfg.testId && savedTestIds.has(String(cfg.testId))) {
//             testConfigStore.remove(courseId, { _id: cfg._id, testId: cfg.testId }, true);
//             console.log("[CourseBuilder] removed canonical staged config after successful save", { cfgId: cfg._id, testId: cfg.testId });
//           }
//         }
//       }
//     } catch (e) {
//       console.warn("[CourseBuilder] failed to cleanup testConfigStore after successful save", e);
//     }

//     // preserve selection if possible
//     let newSelectedModuleId = selectedModuleId;
//     if (selectedModuleId) {
//       const currentModule = modules.find((m) => m._id === selectedModuleId);
//       if (currentModule) {
//         const matchingModule = finalCleaned.find(
//           (m) => m.order === currentModule.order && m.moduleName === currentModule.moduleName && !m.isDeleted
//         );
//         if (matchingModule) newSelectedModuleId = matchingModule._id;
//         else {
//           const activeModules = finalCleaned.filter((m) => !m.isDeleted);
//           newSelectedModuleId = activeModules.length > 0 ? activeModules[0]._id : null;
//         }
//       }
//     }
//     setSelectedModuleId(newSelectedModuleId);

//     console.log("[CourseBuilder] save orchestration completed successfully");
//     toast.success("Course, configurations and visibility saved successfully 🎉");
//   } catch (err: any) {
//     console.error("[CourseBuilder] handleSaveCourse error", err);
//     toast.error(err?.response?.data?.message || "Failed to save course");
//   } finally {
//     setSaving(false);
//   }
// };


const handleSaveCourse = async () => {
  try {
    setSaving(true);

    const cachedRaw = localStorage.getItem(`course_${courseId}`);
    if (!cachedRaw) {
      toast.error("No changes to save (local snapshot missing).");
      setSaving(false);
      return;
    }

    // Step 0: normalize & dedupe snapshot before saving
    let localModules: ModuleItem[] = JSON.parse(cachedRaw);
    localModules = normalizeAndDedupeSnapshot(localModules);
    persistLocalSnapshot(localModules);
    console.log("[CourseBuilder] normalized snapshot prepared for save", { localModulesCount: localModules.length });

    // Step 1: save modules structure
    const payload = { courseId, modules: localModules, updatedBy: userId };
    const saveModulesResp = await axios.post(`${API_BASE}/course/save-modules`, payload);
    const savedModules: ModuleItem[] = saveModulesResp.data?.modules || [];
    console.log("[CourseBuilder] server returned savedModules", { savedCount: savedModules.length });

    // Step 2: map temp -> real test ids
    const tempToReal = buildTempToRealTestMap(localModules, savedModules);
    console.log("[CourseBuilder] tempToReal mapping", tempToReal);

    // Step 3: attach canonical stores into localModules
    try {
      const canonical = testConfigStore.getAll(courseId) || [];
      const canonicalVisibilities = testVisibilityStore.getAll(courseId) || [];
      
      console.log("[CourseBuilder] canonical staged data loaded", { 
        configs: canonical.length,
        visibilities: canonicalVisibilities.length 
      });
      
      if (canonical.length > 0 || canonicalVisibilities.length > 0) {
        const byTestId: Record<string, any> = {};
        const byCfgId: Record<string, any> = {};
        const visibilityByTestId: Record<string, any> = {};
        const visibilityByVisId: Record<string, any> = {};
        
        for (const c of canonical) {
          if (c.testId) byTestId[String(c.testId)] = c;
          if (c._id) byCfgId[String(c._id)] = c;
        }
        
        for (const v of canonicalVisibilities) {
          if (v.testId) visibilityByTestId[String(v.testId)] = v;
          if (v._id) visibilityByVisId[String(v._id)] = v;
        }

        for (const m of localModules) {
          for (const s of m.sections || []) {
            for (const t of s.tests || []) {
              const resolvedTestId = t.testId || tempToReal[t._id] || undefined;
              
              // Configuration merge
              const cfgByTest = resolvedTestId ? byTestId[String(resolvedTestId)] : undefined;
              const cfgByCfgId = t.configuration && t.configuration._id ? byCfgId[String(t.configuration._id)] : undefined;
              const pickConfig = cfgByTest || cfgByCfgId;
              if (pickConfig) {
                if (!t.configuration || Object.keys(t.configuration || {}).length === 0) {
                  t.configuration = { ...pickConfig };
                  console.log("[CourseBuilder] attached canonical config to localModules test row", {
                    module: m.moduleName,
                    section: s.sectionName,
                    testTempId: t._id,
                    testId: t.testId,
                    cfgId: pickConfig._id,
                  });
                }
              }
              
              // Visibility merge
              const visByTest = resolvedTestId ? visibilityByTestId[String(resolvedTestId)] : undefined;
              const visByVisId = t.visibility && t.visibility._id ? visibilityByVisId[String(t.visibility._id)] : undefined;
              const pickVisibility = visByTest || visByVisId;
              if (pickVisibility) {
                if (!t.visibility || Object.keys(t.visibility || {}).length === 0) {
                  t.visibility = { ...pickVisibility };
                  console.log("[CourseBuilder] attached canonical visibility to localModules test row", {
                    module: m.moduleName,
                    section: s.sectionName,
                    testTempId: t._id,
                    testId: t.testId,
                    visId: pickVisibility._id,
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("[CourseBuilder] failed to merge canonical configs/visibilities into localModules", e);
    }

    // Step 4: collect staged configuration + visibility
    const { configs, visibilities } = collectStagedConfigsAndVisibilities(localModules, tempToReal);

    // Step 5: bulk calls
    const bulkCalls: Array<Promise<any>> = [];
    if (configs.length > 0) {
      console.log("[CourseBuilder] calling test-configuration/bulk-save", { configsCount: configs.length });
      bulkCalls.push(axios.post(`${API_BASE}/test-configuration/bulk-save`, { items: configs, courseId, userId }));
    } else {
      console.log("[CourseBuilder] no staged configurations to persist");
    }

    if (visibilities.length > 0) {
      console.log("[CourseBuilder] calling test-visibility/bulk-save", { visibilitiesCount: visibilities.length });
      bulkCalls.push(axios.post(`${API_BASE}/test-visibility/bulk-save`, { visibilities, courseId, userId }));
    } else {
      console.log("[CourseBuilder] no staged visibilities to persist");
    }

    // If nothing staged, finalize and persist server savedModules snapshot
    if (bulkCalls.length === 0) {
      const finalCleaned = savedModules.map((m) => ({
        ...m,
        isNew: false,
        isUpdated: false,
        isDeleted: false,
        sections: (m.sections || []).map((s) => ({
          ...s,
          isNew: false,
          isUpdated: false,
          isDeleted: false,
          tests: (s.tests || []).map((t) => ({ ...t, isNew: false, isUpdated: false, isDeleted: false })),
        })),
      }));
      setModules(finalCleaned);
      persistLocalSnapshot(finalCleaned);
      cleanupStagedStoresAfterSave(courseId, savedModules);

      // Clean up both stores
      try {
        const cfgs = testConfigStore.getAll(courseId) || [];
        const vis = testVisibilityStore.getAll(courseId) || [];
        
        if (cfgs.length > 0 || vis.length > 0) {
          const savedTestIds = new Set<string>();
          for (const m of savedModules) for (const s of m.sections || []) for (const t of s.tests || []) savedTestIds.add(String(t.testId || t._id));
          
          for (const cfg of cfgs) {
            if (cfg.testId && savedTestIds.has(String(cfg.testId))) {
              testConfigStore.remove(courseId, { _id: cfg._id, testId: cfg.testId }, true);
            }
          }
          
          for (const v of vis) {
            if (v.testId && savedTestIds.has(String(v.testId))) {
              testVisibilityStore.remove(courseId, { _id: v._id, testId: v.testId }, true);
            }
          }
        }
      } catch (e) {
        console.debug("[CourseBuilder] cleanup of stores after no-op bulk failed", e);
      }

      toast.success("Course saved successfully 🎉");
      setSaving(false);
      return;
    }

    const results = await Promise.allSettled(bulkCalls);

    // analyze results
    let anyFail = false;
    const errors: string[] = [];
    for (const r of results) {
      if (r.status === "rejected") {
        anyFail = true;
        errors.push(r.reason?.message || JSON.stringify(r.reason) || "Unknown error");
      } else {
        const val = r.value;
        if (val?.status && val.status >= 400) {
          anyFail = true;
          errors.push(val?.data?.error || JSON.stringify(val?.data) || "Bulk save failed");
        }
      }
    }

    if (anyFail) {
      console.warn("[CourseBuilder] bulk save had failures", { errors });

      // attach staged config/visibility back onto cleaned savedModules snapshot so user can retry
      const cleaned = savedModules.map((m) => ({
        ...m,
        isNew: false,
        isUpdated: false,
        isDeleted: false,
        sections: (m.sections || []).map((s) => ({
          ...s,
          isNew: false,
          isUpdated: false,
          isDeleted: false,
          tests: (s.tests || []).map((t) => ({ ...t, isNew: false, isUpdated: false, isDeleted: false })),
        })),
      }));

      const cleanedIndex: Record<string, any> = {};
      for (const m of cleaned) {
        for (const s of m.sections || []) {
          for (const t of s.tests || []) {
            const key = `${m.moduleName}||${s.sectionName}||${t.order}`;
            cleanedIndex[key] = t;
          }
        }
      }

      for (const lm of localModules) {
        for (const ls of lm.sections || []) {
          for (const lt of ls.tests || []) {
            const key = `${lm.moduleName}||${ls.sectionName}||${lt.order}`;
            const cleanedTest = cleanedIndex[key];
            if (!cleanedTest) continue;
            if (lt.configuration) cleanedTest.configuration = lt.configuration;
            if (lt.visibility) cleanedTest.visibility = lt.visibility;
          }
        }
      }

      setModules(cleaned);
      persistLocalSnapshot(cleaned);

      toast.error(`Saved structure but failed to persist some configuration/visibility. Retry Save Course. Errors: ${errors.join("; ")}`);
      return;
    }

    // success: finalize using server savedModules
    const finalCleaned = savedModules.map((m) => ({
      ...m,
      isNew: false,
      isUpdated: false,
      isDeleted: false,
      sections: (m.sections || []).map((s) => ({
        ...s,
        isNew: false,
        isUpdated: false,
        isDeleted: false,
        tests: (s.tests || []).map((t) => ({ ...t, isNew: false, isUpdated: false, isDeleted: false })),
      })),
    }));

    // --- MERGE mapped config ids returned by bulk save into localStorage & finalCleaned ---
    try {
      // collect all mapped arrays from fulfilled bulk responses
      const allMapped: Array<{ oldLocalId: string; newId: string; testId?: string }> = [];
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const payload = (r as any).value?.data ?? (r as any).value;
        if (payload && Array.isArray(payload.mapped) && payload.mapped.length > 0) {
          for (const m of payload.mapped) allMapped.push(m);
        }
      }

      if (allMapped.length > 0) {
        console.log("[CourseBuilder] merging mapped config ids into snapshots", { mappedCount: allMapped.length });

        // 1) Update localStorage snapshot (course_<courseId>)
        try {
          const lsKey = `course_${courseId}`;
          const raw = localStorage.getItem(lsKey) || "[]";
          const modulesLs: ModuleItem[] = JSON.parse(raw);

          for (const m of modulesLs) {
            for (const s of m.sections || []) {
              for (const t of s.tests || []) {
                const cfg = (t as any).configuration ?? (t as any).configurationId;
                if (!cfg || !cfg._id) continue;
                const map = allMapped.find((mm) => String(mm.oldLocalId) === String(cfg._id));
                if (!map) continue;

                cfg._id = String(map.newId);
                cfg.isNew = false;
                cfg.isUpdated = false;
                cfg.isLocal = false;
                cfg.lastSavedAt = cfg.lastSavedAt || new Date().toISOString();

                (t as any).configuration = { ...cfg };
                (t as any).configurationId = { ...cfg };

                console.log("[CourseBuilder] applied mapping to LS test row", { testId: t.testId || t._id, oldLocalId: map.oldLocalId, newId: map.newId });
              }
            }
          }

          localStorage.setItem(lsKey, JSON.stringify(modulesLs));
        } catch (e) {
          console.warn("[CourseBuilder] failed to merge mapped ids into localStorage", e);
        }

        // 2) Update finalCleaned snapshot
        try {
          for (const m of finalCleaned) {
            for (const s of m.sections || []) {
              for (const t of s.tests || []) {
                let cfg = (t as any).configuration ?? (t as any).configurationId;
                if (!cfg || !cfg._id) continue;
                const map = allMapped.find((mm) => String(mm.oldLocalId) === String(cfg._id));
                if (!map) continue;

                cfg._id = String(map.newId);
                cfg.isNew = false;
                cfg.isUpdated = false;
                cfg.isLocal = false;
                cfg.lastSavedAt = cfg.lastSavedAt || new Date().toISOString();

                (t as any).configuration = { ...cfg };
                (t as any).configurationId = { ...cfg };

                console.log("[CourseBuilder] applied mapping to finalCleaned test row", { testId: t.testId || t._id, oldLocalId: map.oldLocalId, newId: map.newId });
              }
            }
          }
        } catch (e) {
          console.warn("[CourseBuilder] failed to merge mapped ids into finalCleaned", e);
        }
      } else {
        console.log("[CourseBuilder] no mapped config ids returned from bulk save");
      }
    } catch (outerErr) {
      console.warn("[CourseBuilder] error while merging mapped results", outerErr);
    }
    // --- end merge ---

    setModules(finalCleaned);
    persistLocalSnapshot(finalCleaned);
     cleanupStagedStoresAfterSave(courseId, savedModules);

    // Remove persisted canonical staged configs and visibilities that were saved
    try {
      const stagedCfgs = testConfigStore.getAll(courseId) || [];
      const stagedVis = testVisibilityStore.getAll(courseId) || [];
      
      if (stagedCfgs.length > 0 || stagedVis.length > 0) {
        const savedTestIds = new Set<string>();
        for (const m of savedModules) for (const s of m.sections || []) for (const t of s.tests || []) savedTestIds.add(String(t.testId || t._id));

        // Cleanup configs
        for (const cfg of stagedCfgs) {
          if (cfg.testId && savedTestIds.has(String(cfg.testId))) {
            testConfigStore.remove(courseId, { _id: cfg._id, testId: cfg.testId }, true);
            console.log("[CourseBuilder] removed canonical staged config after successful save", { cfgId: cfg._id, testId: cfg.testId });
          }
        }
        
        // Cleanup visibilities
        for (const vis of stagedVis) {
          if (vis.testId && savedTestIds.has(String(vis.testId))) {
            testVisibilityStore.remove(courseId, { _id: vis._id, testId: vis.testId }, true);
            console.log("[CourseBuilder] removed canonical staged visibility after successful save", { visId: vis._id, testId: vis.testId });
          }
        }
      }
    } catch (e) {
      console.warn("[CourseBuilder] failed to cleanup stores after successful save", e);
    }

    // preserve selection if possible
    let newSelectedModuleId = selectedModuleId;
    if (selectedModuleId) {
      const currentModule = modules.find((m) => m._id === selectedModuleId);
      if (currentModule) {
        const matchingModule = finalCleaned.find(
          (m) => m.order === currentModule.order && m.moduleName === currentModule.moduleName && !m.isDeleted
        );
        if (matchingModule) newSelectedModuleId = matchingModule._id;
        else {
          const activeModules = finalCleaned.filter((m) => !m.isDeleted);
          newSelectedModuleId = activeModules.length > 0 ? activeModules[0]._id : null;
        }
      }
    }
    setSelectedModuleId(newSelectedModuleId);

    console.log("[CourseBuilder] save orchestration completed successfully");
    toast.success("Course, configurations and visibility saved successfully 🎉");
  } catch (err: any) {
    console.error("[CourseBuilder] handleSaveCourse error", err);
    toast.error(err?.response?.data?.message || "Failed to save course");
  } finally {
    setSaving(false);
  }
};


  const activeModules = modules.filter((m) => !m.isDeleted).sort((a, b) => a.order - b.order);
  const selectedModule = activeModules.find((m) => m._id === selectedModuleId) || null;

  return (
    <div className="flex h-[calc(100vh-40px)] rounded-lg bg-white border overflow-hidden">
      <ModuleList
        modules={modules}
        selectedModuleId={selectedModuleId}
        onSelect={setSelectedModuleId}
        courseId={courseId}
        userId={userId}
        loading={loading}
        onChanged={() => refreshModules()}
      />

      <div className="flex-1 bg-gray-50">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading…</div>
        ) : selectedModule && activeModules.length ? (
          <ModuleDetail module={selectedModule} userId={userId} onChanged={refreshModules} />
        ) : (
          <div className="p-6 text-gray-600 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-2">No modules available</h3>
              <p className="text-sm text-gray-500 mb-4">
                {modules.length === 0
                  ? 'Get started by creating your first module using the "Add Module" button in the sidebar.'
                  : "All modules have been deleted. Create a new module to continue building your course."}
              </p>
              <div className="text-xs text-gray-400">Tip: Modules help organize your course content into logical sections</div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-6 z-50">
        <button
          onClick={handleSaveCourse}
          disabled={saving}
          className={`px-5 py-2 rounded-lg shadow-md transition-all text-white font-medium ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {saving ? "Saving…" : "💾 Save Course"}
        </button>
      </div>
    </div>
  );
};

export default CourseBuilder;

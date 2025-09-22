// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import Select from "react-select";
// import toast from "react-hot-toast";

// interface Group {
//   _id: string;
//   name: string;
// }

// interface Candidate {
//   _id: string;
//   name: string;
// }

// interface TestVisibility {
//   _id?: string;
//   includeGroups: string[];
//   excludeGroups: string[];
//   includeCandidates: string[];
//   excludeCandidates: string[];
// }

// const API_BASE = "http://localhost:7071/api";

// const TestVisibilityManager: React.FC<{ courseId: string; testId: string }> = ({
//   courseId,
//   testId,
// }) => {
//   const [batchId, setBatchId] = useState<string | null>(null);
//   const [groups, setGroups] = useState<Group[]>([]);
//   const [candidates, setCandidates] = useState<Candidate[]>([]);
//   const [visibility, setVisibility] = useState<TestVisibility>({
//     includeGroups: [],
//     excludeGroups: [],
//     includeCandidates: [],
//     excludeCandidates: [],
//   });
//   const [loading, setLoading] = useState(true);
//   const [isExistingRecord, setIsExistingRecord] = useState(false);

//   // Step 1: fetch batchId
//   useEffect(() => {
//     const fetchBatchId = async () => {
//       try {
//         const res = await axios.get(`${API_BASE}/enrollments/course/${courseId}`);
//         if (res.data && res.data.length > 0) {
//           setBatchId(res.data[0].batchId._id);
//         } else {
//           toast.error("No batch found for this course");
//         }
//       } catch (err) {
//         console.error(err);
//         toast.error("Failed to fetch enrollment data");
//       }
//     };
//     fetchBatchId();
//   }, [courseId]);

//   // Step 2: fetch groups, candidates, and existing visibility
//   useEffect(() => {
//     if (!batchId) return;

//     const fetchData = async () => {
//       try {
//         setLoading(true);

//         const groupsRes = await axios.get(`${API_BASE}/group/batch/${batchId}`);
//         setGroups(groupsRes.data);

//         const candidatesRes = await axios.get(`${API_BASE}/students/batch/${batchId}`);
//         setCandidates(candidatesRes.data.students);

//         const visRes = await axios.get(
//           `${API_BASE}/test-visibility/${courseId}/${testId}`
//         );

//         if (visRes.data && visRes.data._id) {
//           setIsExistingRecord(true);

//           setVisibility({
//             _id: visRes.data._id,
//             includeGroups: visRes.data.includeGroups.map((g: any) => g._id),
//             excludeGroups: visRes.data.excludeGroups.map((g: any) => g._id),
//             includeCandidates: visRes.data.includeCandidates.map((c: any) => c._id),
//             excludeCandidates: visRes.data.excludeCandidates.map((c: any) => c._id),
//           });
//         }
//       } catch (err) {
//         console.error(err);
//         toast.error("Failed to fetch data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [batchId, courseId, testId]);

//   // Step 3: handle select change
//   const handleSelectChange = (
//     field: keyof TestVisibility,
//     selected: { value: string; label: string }[]
//   ) => {
//     setVisibility((prev) => ({
//       ...prev,
//       [field]: selected.map((s) => s.value),
//     }));
//   };

//   // Step 4: Save or update visibility
//   const handleSave = async () => {
//     try {
//       if (isExistingRecord && visibility._id) {
//         await axios.put(
//           `${API_BASE}/test-visibility/update/${visibility._id}`,
//           visibility
//         );
//         toast.success("Test visibility updated successfully");
//       } else {
//         await axios.post(`${API_BASE}/test-visibility/create`, {
//           ...visibility,
//           courseId,
//           testId,
//         });
//         toast.success("Test visibility created successfully");
//       }
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to save test visibility");
//     }
//   };

//   if (loading) {
//     return <p className="text-gray-600">Loading...</p>;
//   }

//   // Determine which sections are selected
//   const groupSelected = Boolean(
//     visibility.includeGroups.length || visibility.excludeGroups.length
//   );
//   const candidateSelected = Boolean(
//     visibility.includeCandidates.length || visibility.excludeCandidates.length
//   );

//   return (
//     <div className="p-6 bg-white rounded-lg shadow-md space-y-6">

//       {/* Groups */}
//       <div>
//         <h3 className="text-lg font-medium mb-2">Groups</h3>
//         <div className="grid grid-cols-2 gap-4">
//           {/* Include Groups */}
//           <div>
//             <label className="block text-green-600 font-medium mb-1">
//               Include Groups
//             </label>
//             <Select
//               isMulti
//               isSearchable
//               options={groups.map((g) => ({ value: g._id, label: g.name }))}
//               value={groups
//                 .filter((g) => visibility.includeGroups.includes(g._id))
//                 .map((g) => ({ value: g._id, label: g.name }))}
//               onChange={(selected) =>
//                 handleSelectChange("includeGroups", selected as any)
//               }
//               placeholder="Select groups to include"
//               isDisabled={candidateSelected || visibility.excludeGroups.length > 0}
//             />
//           </div>

//           {/* Exclude Groups */}
//           <div>
//             <label className="block text-red-600 font-medium mb-1">
//               Exclude Groups
//             </label>
//             <Select
//               isMulti
//               isSearchable
//               options={groups.map((g) => ({ value: g._id, label: g.name }))}
//               value={groups
//                 .filter((g) => visibility.excludeGroups.includes(g._id))
//                 .map((g) => ({ value: g._id, label: g.name }))}
//               onChange={(selected) =>
//                 handleSelectChange("excludeGroups", selected as any)
//               }
//               placeholder="Select groups to exclude"
//               isDisabled={candidateSelected || visibility.includeGroups.length > 0}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Candidates */}
//       <div>
//         <h3 className="text-lg font-medium mb-2">Candidates</h3>
//         <div className="grid grid-cols-2 gap-4">
//           {/* Include Candidates */}
//           <div>
//             <label className="block text-green-600 font-medium mb-1">
//               Include Candidates
//             </label>
//             <Select
//               isMulti
//               isSearchable
//               options={candidates.map((c) => ({ value: c._id, label: c.name }))}
//               value={candidates
//                 .filter((c) => visibility.includeCandidates.includes(c._id))
//                 .map((c) => ({ value: c._id, label: c.name }))}
//               onChange={(selected) =>
//                 handleSelectChange("includeCandidates", selected as any)
//               }
//               placeholder="Select candidates to include"
//               isDisabled={groupSelected || visibility.excludeCandidates.length > 0}
//             />
//           </div>

//           {/* Exclude Candidates */}
//           <div>
//             <label className="block text-red-600 font-medium mb-1">
//               Exclude Candidates
//             </label>
//             <Select
//               isMulti
//               isSearchable
//               options={candidates.map((c) => ({ value: c._id, label: c.name }))}
//               value={candidates
//                 .filter((c) => visibility.excludeCandidates.includes(c._id))
//                 .map((c) => ({ value: c._id, label: c.name }))}
//               onChange={(selected) =>
//                 handleSelectChange("excludeCandidates", selected as any)
//               }
//               placeholder="Select candidates to exclude"
//               isDisabled={groupSelected || visibility.includeCandidates.length > 0}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Save Button */}
//       <div className="mt-6">
//         <button
//           onClick={handleSave}
//           className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//         >
//           {isExistingRecord ? "Update Visibility" : "Save Visibility"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default TestVisibilityManager;
import React, { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import toast from "react-hot-toast";
import { testVisibilityStore } from "../../../utils/testVisibilityStore";
import type { ModuleItem, SectionTest, TestVisibility } from "../types/course";

interface Group {
  _id: string;
  name: string;
}

interface Candidate {
  _id: string;
  name: string;
}

const API_BASE = "http://localhost:7071/api";

// Helper function to check if an ID is a real database ObjectId
const isObjectId = (id?: any) =>
  typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(String(id));

/**
 * Normalize staged visibility flags so they are never contradictory.
 * Similar to normalizeConfigFlags but for visibility.
 */
function normalizeVisibilityFlags(
  vis: any,
  opts: { onOpen?: boolean } = { onOpen: false }
) {
  if (!vis) return vis;

  const onOpen = !!opts.onOpen;
  const rawId = vis._id;
  const hasReal = !!rawId && isObjectId(rawId) && !String(rawId).startsWith("local-vis-");

  console.group("[normalizeVisibilityFlags]");
  console.log("input vis:", JSON.parse(JSON.stringify(vis)));
  console.log("rawId:", rawId, "hasReal:", hasReal, "onOpen:", onOpen);

  if (hasReal) {
    // canonical persisted visibility - EXISTS IN DATABASE
    vis._id = String(rawId);
    vis.isLocal = false;
    vis.isNew = false;  // Real DB visibilities are NEVER new
    vis.isDeleted = !!vis.isDeleted;
    
    // Only mark as updated when saving (not when opening)
    if (onOpen) {
      vis.isUpdated = false; // Don't mark as updated just by opening
    } else {
      vis.isUpdated = true;  // Mark as updated when saving changes
    }

    console.log("→ normalized as REAL db visibility");
  } else {
    // local placeholder visibility - DOES NOT EXIST IN DATABASE YET
    vis._id = String(
      vis._id ?? `local-vis-${vis.testId || Math.random().toString(36).slice(2, 8)}`
    );
    vis.isLocal = true;
    vis.isNew = true;      // Local visibilities are always new until persisted
    vis.isUpdated = false; // Local visibilities don't need isUpdated until they become real
    vis.isDeleted = !!vis.isDeleted;

    console.log("→ normalized as LOCAL visibility");
  }

  vis.lastSavedAt = vis.lastSavedAt || new Date().toISOString();

  // ensure booleans
  vis.isNew = !!vis.isNew;
  vis.isUpdated = !!vis.isUpdated;
  vis.isLocal = !!vis.isLocal;
  vis.isDeleted = !!vis.isDeleted;

  console.log("output vis:", JSON.parse(JSON.stringify(vis)));
  console.groupEnd();

  return vis;
}

const TestVisibilityManager: React.FC<{
  courseId: string;
  testId: string; // this may be a staged _id or real testId
  currentUserId?: string;
  onClose?: () => void;
}> = ({ courseId, testId, currentUserId, onClose }) => {
  const [batchId, setBatchId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [visibility, setVisibility] = useState<TestVisibility>({
    includeGroups: [],
    excludeGroups: [],
    includeCandidates: [],
    excludeCandidates: [],
  });
  const [visibilityDocId, setVisibilityDocId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const userId = currentUserId || "";

  /* ---------- localStorage helpers ---------- */
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
      const toSave = JSON.parse(JSON.stringify(modules));
      localStorage.setItem(localKey, JSON.stringify(toSave));
      console.debug("[TestVisibilityManager] saved cloned modules", toSave);
    } catch (e) {
      console.error("[TestVisibilityManager] saveLocalCourse failed", e);
    }
  };

  // robust equality for ids (handles ObjectId vs string)
  const idEquals = (a: any, b: any) => {
    if (a == null || b == null) return false;
    return String(a) === String(b);
  };

  /* ---------- robust find helper ---------- */
  const findSectionTestInLocal = (key: string) => {
    if (!key) return null;
    const modules = loadLocalCourse();

    const matchesTest = (x: any, k: string) =>
      idEquals(x._id, k) ||
      idEquals(x.testId, k) ||
      (x.visibility && (idEquals(x.visibility._id, k) || idEquals(x.visibility.testId, k)));

    if (modules) {
      for (const m of modules) {
        for (const s of m.sections || []) {
          const t = (s.tests || []).find((x: any) => matchesTest(x, key));
          if (t) return { module: m, section: s, test: t };
        }
      }
    }
    return null;
  };

  /* ---------- fetch batch -> groups/candidates ---------- */
  useEffect(() => {
    const fetchBatchId = async () => {
      try {
        const res = await axios.get(`${API_BASE}/enrollments/course/${courseId}`);
        if (res.data && res.data.length > 0) {
          const batch = res.data[0].batchId;
          setBatchId(batch?._id || batch || null);
        } else {
          setBatchId(null);
        }
      } catch (err) {
        console.error(err);
        setBatchId(null);
      }
    };
    fetchBatchId();
  }, [courseId]);

  /* ---------- Load visibility data using the same pattern as configuration ---------- */
  useEffect(() => {
    if (!batchId) {
      setLoading(false);
      return;
    }

    const loadVisibilityData = async () => {
      setSaving(true);
      try {
        // Load groups and candidates
        const [gRes, cRes] = await Promise.all([
          axios.get(`${API_BASE}/group/batch/${batchId}`),
          axios.get(`${API_BASE}/students/batch/${batchId}`),
        ]);

        setGroups(gRes.data || []);
        setCandidates(cRes.data?.students || cRes.data || []);

        // 1) staged on course snapshot (prefer)
        const staged = testId ? findSectionTestInLocal(testId) : null;
        if (staged?.test?.visibility) {
          const vis = staged.test.visibility;
          normalizeVisibilityFlags(vis, { onOpen: true });

          // Sync to testVisibilityStore
          console.log("[TestVisibilityManager] Syncing staged visibility to testVisibilityStore:", vis);
          testVisibilityStore.upsert(courseId, vis);

          setVisibilityDocId(String(vis._id || ""));
          setVisibility({
            includeGroups: vis.includeGroups || [],
            excludeGroups: vis.excludeGroups || [],
            includeCandidates: vis.includeCandidates || [],
            excludeCandidates: vis.excludeCandidates || [],
          });
          return;
        }

        // 2) canonical testVisibilityStore (local staged store)
        try {
          let visFound: any;
          if (testId) {
            visFound = testVisibilityStore.getByTestId(courseId, testId) || testVisibilityStore.getById(courseId, testId);
          }
          if (!visFound && staged?.test?.testId) {
            visFound = testVisibilityStore.getByTestId(courseId, staged.test.testId);
          }

          if (visFound) {
            normalizeVisibilityFlags(visFound, { onOpen: true });
            
            // Re-save normalized visibility
            console.log("[TestVisibilityManager] Re-saving normalized testVisibilityStore entry:", visFound);
            testVisibilityStore.upsert(courseId, visFound);

            setVisibilityDocId(String(visFound._id || ""));
            setVisibility({
              includeGroups: visFound.includeGroups || [],
              excludeGroups: visFound.excludeGroups || [],
              includeCandidates: visFound.includeCandidates || [],
              excludeCandidates: visFound.excludeCandidates || [],
            });
            return;
          }
        } catch (err) {
          console.warn("[TestVisibilityManager] testVisibilityStore lookup failed", err);
        }

        // 3) server fallback
        if (testId) {
          try {
            let serverKey: string | undefined;
            if (staged?.test?.testId) {
              serverKey = staged.test.testId;
            } else {
              const visById = testVisibilityStore.getById(courseId, testId);
              if (visById?.testId) serverKey = visById.testId;
            }

            if (serverKey && /^[0-9a-fA-F]{24}$/.test(serverKey)) {
              console.log("[TestVisibilityManager] Fetching visibility from server for testId:", serverKey);
              const res = await axios.get(`${API_BASE}/test-visibility/${courseId}/${serverKey}`);
              console.log("hello",res);
              if (res?.data) {
                const d = res.data;
                const normalized = {
                  ...d,
                  includeGroups: (d.includeGroups || []).map((g: any) => g._id || g),
                  excludeGroups: (d.excludeGroups || []).map((g: any) => g._id || g),
                  includeCandidates: (d.includeCandidates || []).map((c: any) => c._id || c),
                  excludeCandidates: (d.excludeCandidates || []).map((c: any) => c._id || c),
                };
                normalizeVisibilityFlags(normalized, { onOpen: true });

                // Cache server visibility in testVisibilityStore
                console.log("[TestVisibilityManager] Caching server visibility to testVisibilityStore:", normalized);
                testVisibilityStore.upsert(courseId, normalized);

                setVisibilityDocId(String(normalized._id || ""));
                setVisibility({
                  includeGroups: normalized.includeGroups || [],
                  excludeGroups: normalized.excludeGroups || [],
                  includeCandidates: normalized.includeCandidates || [],
                  excludeCandidates: normalized.excludeCandidates || [],
                });
                return;
              }
            }
          } catch (e) {
            console.debug("[TestVisibilityManager] server visibility fetch failed", e);
          }
        }

        // 4) defaults: create a local placeholder visibility
        console.log("[TestVisibilityManager] Creating default visibility for testId:", testId);
        const defaultVisRaw: Partial<TestVisibility> = {
          _id: `local-vis-${testId || Math.random().toString(36).slice(2, 8)}`,
          testId: staged?.test?.testId ?? testId ?? "",
          courseId,
          includeGroups: [],
          excludeGroups: [],
          includeCandidates: [],
          excludeCandidates: [],
          createdBy: userId,
          lastUpdatedBy: userId,
          lastSavedAt: new Date().toISOString(),
        };

        const defaultVis = normalizeVisibilityFlags({ ...defaultVisRaw, isNew: true }, { onOpen: true });

        // Save default visibility to testVisibilityStore
        console.log("[TestVisibilityManager] Saving default visibility to testVisibilityStore:", defaultVis);
        testVisibilityStore.upsert(courseId, defaultVis);

        setVisibilityDocId(String(defaultVis._id));
        setVisibility({
          includeGroups: [],
          excludeGroups: [],
          includeCandidates: [],
          excludeCandidates: [],
        });

      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch groups or candidates");
      } finally {
        setLoading(false);
        setSaving(false);
      }
    };

    loadVisibilityData();
  }, [batchId, courseId, testId, userId]);

  const handleSelectChange = (
    field: keyof TestVisibility,
    selected: { value: string; label: string }[] | null
  ) => {
    setVisibility((prev) => ({
      ...prev,
      [field]: (selected || []).map((s) => s.value),
    }));
  };

  /* ---------- Save visibility (similar to handleSaveConfig) ---------- */
  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        includeGroups: visibility.includeGroups || [],
        excludeGroups: visibility.excludeGroups || [],
        includeCandidates: visibility.includeCandidates || [],
        excludeCandidates: visibility.excludeCandidates || [],
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
              if (idEquals(t._id, testId) || idEquals(t.testId, testId)) {
                found = { mIndex: mi, sIndex: si, tIndex: ti, t };
                break outer;
              }
            }
          }
        }
      }

      if (!found) {
        toast.error("Unable to find the test in local snapshot to attach visibility.");
        return;
      }

      const tRef = found.t;
      const nowIso = new Date().toISOString();

      // visibility id
      const existingVis = (tRef as any).visibility ?? null;
      const existingVisId = existingVis?._id ?? visibilityDocId ?? "";
      const hasRealVis = !!existingVisId && isObjectId(existingVisId) && !String(existingVisId).startsWith("local-vis-");
      const idToUse = hasRealVis ? String(existingVisId) : `local-vis-${tRef._id || tRef.testId}`;

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
      const visibilityObj = normalizeVisibilityFlags(mergedClean, { onOpen: false });

      // Persist into staging store
      console.log("[TestVisibilityManager] About to upsert visibility to testVisibilityStore:", visibilityObj);
      const upsertedVisibility = testVisibilityStore.upsert(courseId, visibilityObj);
      console.log("[TestVisibilityManager] Upserted visibility result:", upsertedVisibility);

      // overwrite in test row
      (tRef as any).visibility = { ...visibilityObj };
      if (!tRef.isNew) tRef.isUpdated = true;

      // persist modules snapshot
      if (found.mIndex >= 0 && found.sIndex >= 0 && modules) {
        const sec = modules[found.mIndex].sections![found.sIndex];
        const newTestRow = {
          ...sec.tests![found.tIndex],
          ...tRef,
          visibility: { ...visibilityObj },
        };
        sec.tests![found.tIndex] = newTestRow;
        sec.isUpdated = !sec.isNew;
        saveLocalCourse(modules);
      } else {
        saveLocalCourse([
          {
            _id: `module-fallback-${Date.now()}`,
            courseId,
            moduleName: "Untitled module",
            order: 1,
            sections: [{ 
              _id: `section-fallback-${Date.now()}`,
              moduleId: `module-fallback-${Date.now()}`,
              sectionName: "Untitled section",
              order: 1,
              tests: [tRef] 
            }],
          } as any,
        ]);
      }

      toast.success("Visibility saved locally (will be persisted on Save Course)");
      onClose && onClose();
    } catch (err) {
      console.error("handleSave error:", err);
      toast.error("Failed to save visibility locally");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-600">Loading...</p>;

  const groupSelected = Boolean(
    visibility.includeGroups?.length || visibility.excludeGroups?.length
  );
  const candidateSelected = Boolean(
    visibility.includeCandidates?.length || visibility.excludeCandidates?.length
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Manage Visibility</h3>
        {testId && (
          <div className="text-xs text-gray-500">
            Editing test: <span className="font-mono">{testId}</span>
          </div>
        )}
      </div>

      {/* Groups */}
      <div>
        <h4 className="text-sm font-medium mb-2">Groups</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-green-600 font-medium mb-1">Include Groups</label>
            <Select
              isMulti
              isSearchable
              options={groups.map((g) => ({ value: g._id, label: g.name }))}
              value={groups
                .filter((g) => (visibility.includeGroups || []).includes(g._id))
                .map((g) => ({ value: g._id, label: g.name }))}
              onChange={(selected) => handleSelectChange("includeGroups", selected as any)}
              placeholder="Select groups to include"
              isDisabled={candidateSelected || (visibility.excludeGroups || []).length > 0}
            />
          </div>

          <div>
            <label className="block text-red-600 font-medium mb-1">Exclude Groups</label>
            <Select
              isMulti
              isSearchable
              options={groups.map((g) => ({ value: g._id, label: g.name }))}
              value={groups
                .filter((g) => (visibility.excludeGroups || []).includes(g._id))
                .map((g) => ({ value: g._id, label: g.name }))}
              onChange={(selected) => handleSelectChange("excludeGroups", selected as any)}
              placeholder="Select groups to exclude"
              isDisabled={candidateSelected || (visibility.includeGroups || []).length > 0}
            />
          </div>
        </div>
      </div>

      {/* Candidates */}
      <div>
        <h4 className="text-sm font-medium mb-2">Candidates</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-green-600 font-medium mb-1">Include Candidates</label>
            <Select
              isMulti
              isSearchable
              options={candidates.map((c) => ({ value: c._id, label: c.name }))}
              value={candidates
                .filter((c) => (visibility.includeCandidates || []).includes(c._id))
                .map((c) => ({ value: c._id, label: c.name }))}
              onChange={(selected) => handleSelectChange("includeCandidates", selected as any)}
              placeholder="Select candidates to include"
              isDisabled={groupSelected || (visibility.excludeCandidates || []).length > 0}
            />
          </div>

          <div>
            <label className="block text-red-600 font-medium mb-1">Exclude Candidates</label>
            <Select
              isMulti
              isSearchable
              options={candidates.map((c) => ({ value: c._id, label: c.name }))}
              value={candidates
                .filter((c) => (visibility.excludeCandidates || []).includes(c._id))
                .map((c) => ({ value: c._id, label: c.name }))}
              onChange={(selected) => handleSelectChange("excludeCandidates", selected as any)}
              placeholder="Select candidates to exclude"
              isDisabled={groupSelected || (visibility.includeCandidates || []).length > 0}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Visibility"}
        </button>
      </div>
    </div>
  );
};

export default TestVisibilityManager;
// // src/stores/courseDraftStore.ts
// import { toast } from "react-hot-toast";

// const STORAGE_KEY = (courseId: string) => `draftCourse-${courseId}`;

// // -------- Types --------
// export type DraftTest = {
//   _id: string;
//   testId: string;
//   sectionId: string;
//   order: number;
//   type: string;
//   isNew?: boolean;
//   isUpdated?: boolean;
//   isDeleted?: boolean;
// };

// export type DraftSection = {
//   _id: string;
//   moduleId: string;
//   sectionName: string;
//   sectionDescription?: string;
//   order: number;
//   tests: DraftTest[];
//   isNew?: boolean;
//   isUpdated?: boolean;
//   isDeleted?: boolean;
// };

// export type DraftModule = {
//   _id: string;
//   courseId: string;
//   moduleName: string;
//   moduleDescription?: string;
//   order: number;
//   sections: DraftSection[];
//   isNew?: boolean;
//   isUpdated?: boolean;
//   isDeleted?: boolean;
// };

// export type DraftCourse = {
//   _id: string;
//   courseName: string;
//   description?: string;
//   modules: DraftModule[];
//   dirty?: boolean;
// };

// // -------- Helpers --------
// function loadDraft(courseId: string): DraftCourse | null {
//   const raw = localStorage.getItem(STORAGE_KEY(courseId));
//   return raw ? JSON.parse(raw) : null;
// }

// function saveDraft(course: DraftCourse) {
//   localStorage.setItem(STORAGE_KEY(course._id), JSON.stringify(course));
// }

// function markDirty<T extends DraftCourse | DraftModule | DraftSection | DraftTest>(obj: T): T {
//   return { ...obj, dirty: true } as T;
// }

// // -------- Store --------
// export const courseDraftStore = {
//   load(courseId: string, serverCourse?: DraftCourse): DraftCourse {
//     const saved = loadDraft(courseId);
//     if (saved) return saved;
//     if (serverCourse) {
//       saveDraft({ ...serverCourse, dirty: false });
//       return { ...serverCourse, dirty: false };
//     }
//     throw new Error("No draft or server course available");
//   },

//   // ---- Module ----
//   addModule(course: DraftCourse, name: string, desc: string): DraftCourse {
//     const newModule: DraftModule = {
//       _id: `tmp-module-${Date.now()}`,
//       courseId: course._id,
//       moduleName: name,
//       moduleDescription: desc,
//       order: course.modules.length + 1,
//       sections: [],
//       isNew: true,
//     };
//     const updated = { ...course, modules: [...course.modules, newModule], dirty: true };
//     saveDraft(updated);
//     return updated;
//   },

//   updateModule(course: DraftCourse, moduleId: string, fields: Partial<DraftModule>): DraftCourse {
//     const updated = {
//       ...course,
//       modules: course.modules.map((m) =>
//         m._id === moduleId ? { ...m, ...fields, isUpdated: !m.isNew } : m
//       ),
//       dirty: true,
//     };
//     saveDraft(updated);
//     return updated;
//   },

//   deleteModule(course: DraftCourse, moduleId: string): DraftCourse {
//     const updated = {
//       ...course,
//       modules: course.modules.map((m) =>
//         m._id === moduleId ? { ...m, isDeleted: true } : m
//       ),
//       dirty: true,
//     };
//     saveDraft(updated);
//     return updated;
//   },

//   // ---- Section ----
//   addSection(course: DraftCourse, moduleId: string, name: string, desc: string): DraftCourse {
//     const updated = {
//       ...course,
//       modules: course.modules.map((m) => {
//         if (m._id !== moduleId) return m;
//         const newSection: DraftSection = {
//           _id: `tmp-section-${Date.now()}`,
//           moduleId,
//           sectionName: name,
//           sectionDescription: desc,
//           order: m.sections.length + 1,
//           tests: [],
//           isNew: true,
//         };
//         return { ...m, sections: [...m.sections, newSection], isUpdated: !m.isNew };
//       }),
//       dirty: true,
//     };
//     saveDraft(updated);
//     return updated;
//   },

//   updateSection(course: DraftCourse, sectionId: string, fields: Partial<DraftSection>): DraftCourse {
//     const updated = {
//       ...course,
//       modules: course.modules.map((m) => ({
//         ...m,
//         sections: m.sections.map((s) =>
//           s._id === sectionId ? { ...s, ...fields, isUpdated: !s.isNew } : s
//         ),
//       })),
//       dirty: true,
//     };
//     saveDraft(updated);
//     return updated;
//   },

//   deleteSection(course: DraftCourse, sectionId: string): DraftCourse {
//     const updated = {
//       ...course,
//       modules: course.modules.map((m) => ({
//         ...m,
//         sections: m.sections.map((s) =>
//           s._id === sectionId ? { ...s, isDeleted: true } : s
//         ),
//       })),
//       dirty: true,
//     };
//     saveDraft(updated);
//     return updated;
//   },

//   // ---- Test ----
//   addTest(course: DraftCourse, sectionId: string, testId: string, type: string): DraftCourse {
//     const updated = {
//       ...course,
//       modules: course.modules.map((m) => ({
//         ...m,
//         sections: m.sections.map((s) => {
//           if (s._id !== sectionId) return s;
//           const newTest: DraftTest = {
//             _id: `tmp-test-${Date.now()}`,
//             testId,
//             sectionId,
//             order: s.tests.length + 1,
//             type,
//             isNew: true,
//           };
//           return { ...s, tests: [...s.tests, newTest], isUpdated: !s.isNew };
//         }),
//       })),
//       dirty: true,
//     };
//     saveDraft(updated);
//     return updated;
//   },

//   deleteTest(course: DraftCourse, testId: string): DraftCourse {
//     const updated = {
//       ...course,
//       modules: course.modules.map((m) => ({
//         ...m,
//         sections: m.sections.map((s) => ({
//           ...s,
//           tests: s.tests.map((t) =>
//             t._id === testId ? { ...t, isDeleted: true } : t
//           ),
//         })),
//       })),
//       dirty: true,
//     };
//     saveDraft(updated);
//     return updated;
//   },

//   // ---- Save to server ----
//   async saveToServer(course: DraftCourse) {
//     try {
//       const res = await fetch(`http://localhost:7071/api/course/save-draft`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(course),
//       });
//       if (!res.ok) throw new Error("Failed to save");
//       const data = await res.json();
//       toast.success("Course saved successfully");

//       // reset flags
//       const cleaned: DraftCourse = {
//         ...course,
//         dirty: false,
//         modules: course.modules.map((m) => ({
//           ...m,
//           isNew: false,
//           isUpdated: false,
//           isDeleted: false,
//           sections: m.sections.map((s) => ({
//             ...s,
//             isNew: false,
//             isUpdated: false,
//             isDeleted: false,
//             tests: s.tests.map((t) => ({
//               ...t,
//               isNew: false,
//               isUpdated: false,
//               isDeleted: false,
//             })),
//           })),
//         })),
//       };
//       saveDraft(cleaned);
//       return cleaned;
//     } catch (err: any) {
//       toast.error(err.message || "Failed to save course");
//       throw err;
//     }
//   },
// };

// src/store/courseStore.ts

import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "course_data";

export type SectionTest = {
  _id: string;
  sectionId: string;
  testId: string;
  order: number;
  type: string;
};

export type Section = {
  _id: string;
  moduleId: string;
  sectionName: string;
  sectionDescription?: string;
  order: number;
  tests?: SectionTest[];
};

export type ModuleItem = {
  _id: string;
  courseId: string;
  moduleName: string;
  moduleDescription?: string;
  order: number;
  sections?: Section[];
};

function loadData(): ModuleItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveData(data: ModuleItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const courseStore = {
  getAll(): ModuleItem[] {
    return loadData();
  },

  addModule(courseId: string, name: string, desc: string, userId: string) {
    const data = loadData();
    const newModule: ModuleItem = {
      _id: uuidv4(),
      courseId,
      moduleName: name,
      moduleDescription: desc,
      order: data.length + 1,
      sections: [],
    };
    data.push(newModule);
    saveData(data);
    return newModule;
  },

  updateModule(moduleId: string, updates: Partial<ModuleItem>) {
    const data = loadData();
    const idx = data.findIndex((m) => m._id === moduleId);
    if (idx >= 0) {
      data[idx] = { ...data[idx], ...updates };
      saveData(data);
    }
  },

  deleteModule(moduleId: string) {
    let data = loadData();
    data = data.filter((m) => m._id !== moduleId);
    saveData(data);
  },

  addSection(moduleId: string, name: string, desc: string, userId: string) {
    const data = loadData();
    const module = data.find((m) => m._id === moduleId);
    if (!module) return null;
    const newSection: Section = {
      _id: uuidv4(),
      moduleId,
      sectionName: name,
      sectionDescription: desc,
      order: (module.sections?.length || 0) + 1,
      tests: [],
    };
    module.sections = [...(module.sections || []), newSection];
    saveData(data);
    return newSection;
  },

  updateSection(sectionId: string, updates: Partial<Section>) {
    const data = loadData();
    for (const mod of data) {
      const idx = mod.sections?.findIndex((s) => s._id === sectionId);
      if (idx !== undefined && idx >= 0 && mod.sections) {
        mod.sections[idx] = { ...mod.sections[idx], ...updates };
      }
    }
    saveData(data);
  },

  deleteSection(sectionId: string) {
    const data = loadData();
    for (const mod of data) {
      mod.sections = mod.sections?.filter((s) => s._id !== sectionId) || [];
    }
    saveData(data);
  },

  addTest(sectionId: string, testId: string, type: string) {
    const data = loadData();
    for (const mod of data) {
      const section = mod.sections?.find((s) => s._id === sectionId);
      if (section) {
        const newTest: SectionTest = {
          _id: uuidv4(),
          sectionId,
          testId,
          type,
          order: (section.tests?.length || 0) + 1,
        };
        section.tests = [...(section.tests || []), newTest];
      }
    }
    saveData(data);
  },

  removeTest(sectionId: string, sectionTestId: string) {
    const data = loadData();
    for (const mod of data) {
      const section = mod.sections?.find((s) => s._id === sectionId);
      if (section) {
        section.tests = section.tests?.filter((t) => t._id !== sectionTestId) || [];
      }
    }
    saveData(data);
  },

  reorderTests(sectionId: string, reordered: SectionTest[]) {
    const data = loadData();
    for (const mod of data) {
      const section = mod.sections?.find((s) => s._id === sectionId);
      if (section) {
        section.tests = reordered.map((t, idx) => ({ ...t, order: idx + 1 }));
      }
    }
    saveData(data);
  },

  // ✅ Final API sync
  async syncToServer(courseId: string, userId: string) {
    const data = loadData();
    // 🔥 hit one API (backend must accept full payload)
    // Example: POST /course/sync
    // Adjust endpoint as per backend contract
    const axios = (await import("axios")).default;
    const res = await axios.post(`http://localhost:7071/api/course/sync`, {
      courseId,
      userId,
      modules: data,
    });
    return res.data;
  },
};

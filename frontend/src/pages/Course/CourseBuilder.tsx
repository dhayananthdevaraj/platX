import React, { useEffect, useState, useCallback } from "react";
import { api } from "../../api/axiosInstance";
import toast from "react-hot-toast";
import ModuleList from "./ModuleList";
import ModuleDetail from "./ModuleDetail";
import type { ModuleItem, Section, TestLite } from "./types/course";
import { db } from "../../db";

interface Props {
  courseId: string;
  batchId?: string | null;
  currentUserId?: string;
}

const DEFAULT_USER_ID = "68561fdf1ed096393f84533c";

const CourseBuilder: React.FC<Props> = ({ courseId, batchId, currentUserId }) => {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const userId = currentUserId || DEFAULT_USER_ID;


  useEffect(() => {
    console.log("selectedModuleId", selectedModuleId);
  }, [selectedModuleId]);

  /** Sanitize modules before saving or displaying */
  const sanitizeModules = (modules: ModuleItem[]): ModuleItem[] => {
    return modules.map((m) => ({
      ...m,
      sections: Array.isArray(m.sections)
        ? m.sections.map((s: Section) => ({
          ...s,
          tests: Array.isArray(s.tests) ? s.tests : [],
          isNew: s.isNew ?? false,
          isUpdated: s.isUpdated ?? false,
          isDeleted: s.isDeleted ?? false,
        }))
        : [],
      isNew: m.isNew ?? false,
      isUpdated: m.isUpdated ?? false,
      isDeleted: m.isDeleted ?? false,
    }));
  };

  /** Load modules (IndexedDB first, then API) */
  const loadModules = useCallback(async () => {
    setLoading(true);
    try {
      const cached = await db.modules.where("courseId").equals(courseId).toArray();

      if (cached && cached.length > 0) {
        const safeModules = sanitizeModules(cached);
        setModules(safeModules);

        const activeModules = safeModules.filter((m) => !m.isDeleted);
        if (activeModules.length > 0 && !selectedModuleId) {
          setSelectedModuleId(activeModules[0]._id ?? null);
        }
      } else {
        const res = await api.get(`/module/course/${courseId}`);
        let list: ModuleItem[] = res.data?.modules || [];
        list = sanitizeModules(list);

        setModules(list);

        // Save in IndexedDB
        await db.modules.where("courseId").equals(courseId).delete();
        await db.modules.bulkPut(list as any);

        if (list.length > 0) setSelectedModuleId(list[0]._id ?? null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to load modules");
    } finally {
      setLoading(false);
    }
  }, [courseId, selectedModuleId]);

  useEffect(() => {
    if (!courseId) return;
    loadModules();
  }, [loadModules, batchId]);

  /** Refresh modules from IndexedDB */
  const refreshModules = useCallback(
    async (nextModuleIdToSelect?: string | null) => {
      const cached = await db.modules.where("courseId").equals(courseId).toArray();
      const safeModules = sanitizeModules(cached);
      setModules(safeModules);

      if (nextModuleIdToSelect !== undefined) {
        setSelectedModuleId(nextModuleIdToSelect);
      }
    },
    [courseId]
  );

  /** Save course to backend */
  const handleSaveCourse = async () => {
    try {
      setSaving(true);

      const cached = await db.modules.where("courseId").equals(courseId).toArray();
      if (!cached || cached.length === 0) {
        toast.error("No changes to save");
        return;
      }

      const payload = {
        courseId,
        modules: sanitizeModules(cached),
        updatedBy: userId,
      };

      const response = await api.post(`/course/save-modules`, payload);
      toast.success("Course saved successfully!");

      let list: ModuleItem[] = response.data?.modules || [];
      list = sanitizeModules(list);

      // Maintain selection
      let newSelectedModuleId = selectedModuleId;
      if (selectedModuleId) {
        const currentModule = modules.find((m) => m._id === selectedModuleId);
        if (currentModule) {
          const matchingModule = list.find(
            (m) =>
              m.order === currentModule.order &&
              m.moduleName === currentModule.moduleName &&
              !m.isDeleted
          );
          if (matchingModule) {
            newSelectedModuleId = matchingModule._id;
          } else {
            const activeModules = list.filter((m) => !m.isDeleted);
            newSelectedModuleId =
              activeModules.length > 0 ? activeModules[0]._id : null;
          }
        }
      }

      setModules(list);

      // Update IndexedDB
      await db.modules.where("courseId").equals(courseId).delete();
      await db.modules.bulkPut(list as any);

      setSelectedModuleId(newSelectedModuleId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const activeModules = modules
    .filter((m) => !m.isDeleted)
    .sort((a, b) => a.order - b.order);
  const selectedModule = activeModules.find((m) => m._id === selectedModuleId) || null;

  return (
    <div className="flex h-[calc(100vh-40px)] rounded-lg bg-white border overflow-hidden">
      {/* Sidebar */}
      <ModuleList
        modules={modules}
        selectedModuleId={selectedModuleId}
        onSelect={setSelectedModuleId}
        courseId={courseId}
        userId={userId}
        loading={loading}
        onChanged={() => refreshModules()}
      />

      {/* Main content */}
      <div className="flex-1 bg-gray-50">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading…</div>
        ) : selectedModule && activeModules.length ? (
          <ModuleDetail
            module={selectedModule}
            userId={userId}
            onChanged={refreshModules}
          />
        ) : (
          <div className="p-6 text-gray-600 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-2">No modules available</h3>
              <p className="text-sm text-gray-500 mb-4">
                {modules.length === 0
                  ? 'Get started by creating your first module using the "Add Module" button in the sidebar.'
                  : "All modules have been deleted. Create a new module to continue building your course."}
              </p>
              <div className="text-xs text-gray-400">
                Tip: Modules help organize your course content into logical sections
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-4 right-6 z-50">
        <button
          onClick={handleSaveCourse}
          disabled={saving}
          className={`px-5 py-2 rounded-lg shadow-md transition-all text-white font-medium ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
        >
          {saving ? "Saving…" : "💾 Save Course"}
        </button>
      </div>
    </div>
  );
};

export default CourseBuilder;

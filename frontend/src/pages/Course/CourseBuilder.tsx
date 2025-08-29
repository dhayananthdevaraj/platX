// CourseBuilder.tsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import ModuleList from "./ModuleList";
import ModuleDetail from "./ModuleDetail";

const API_BASE = "http://localhost:7071/api";

type SectionTest = { _id: string; sectionId: string; testId: string; order: number };
type Section = {
  _id: string;
  moduleId: string;
  sectionName: string;
  sectionDescription?: string;
  order: number;
  tests?: SectionTest[];
};
type ModuleItem = {
  _id: string;
  courseId: string;
  moduleName: string;
  moduleDescription?: string;
  order: number;
  sections?: Section[];
};

interface Props {
  courseId: string;
  currentUserId?: string;
}

const DEFAULT_USER_ID = "68561fdf1ed096393f84533c";

const CourseBuilder: React.FC<Props> = ({ courseId, currentUserId }) => {
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const userId = currentUserId || DEFAULT_USER_ID;

  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/module/course/${courseId}`);
      const list: ModuleItem[] = res.data?.modules || [];
      setModules(list);

      if (list.length === 0) {
        setSelectedModuleId(null);
      } else if (!selectedModuleId || !list.some((m) => m._id === selectedModuleId)) {
        setSelectedModuleId(list[0]._id);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch modules");
    } finally {
      setLoading(false);
    }
  }, [courseId, selectedModuleId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const selectedModule = useMemo(
    () => modules.find((m) => m._id === selectedModuleId) || null,
    [modules, selectedModuleId]
  );

  return (
    <div className="flex h-[calc(100vh-40px)] rounded-lg bg-white border overflow-hidden">
      <ModuleList
        modules={modules}
        selectedModuleId={selectedModuleId}
        onSelect={setSelectedModuleId}
        onCreated={fetchModules}
        courseId={courseId}
        userId={userId}
        loading={loading}
      />
      <div className="flex-1 bg-gray-50">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading…</div>
        ) : selectedModule ? (
          <ModuleDetail module={selectedModule} userId={userId} onChanged={fetchModules} />
        ) : (
          <div className="p-6 text-gray-600">No modules yet. Use “Add Module” in the left panel.</div>
        )}
      </div>
    </div>
  );
};

export default CourseBuilder;

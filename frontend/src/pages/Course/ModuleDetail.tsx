// ModuleDetail.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import InlineEdit from "./InlineEdit";
import SectionCard from "./SectionCard";

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

type TestLite = { _id: string; name?: string; title?: string };

interface Props {
  module: ModuleItem;
  userId: string;
  onChanged: () => void;
}

const ModuleDetail: React.FC<Props> = ({ module, userId, onChanged }) => {
  const [saving, setSaving] = useState(false);
  const [addingSection, setAddingSection] = useState(false);
  const [secName, setSecName] = useState("");
  const [secDesc, setSecDesc] = useState("");

  const [allTests, setAllTests] = useState<TestLite[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  const sortedSections = useMemo(
    () => (module.sections || []).slice().sort((a, b) => a.order - b.order),
    [module.sections]
  );

  const fetchTests = async () => {
    try {
      setLoadingTests(true);
      const res = await axios.get(`${API_BASE}/test/all`);
      setAllTests(res.data?.tests || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load tests");
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [module._id]);

  const handleRenameModule = async (newName: string) => {
    if (!newName.trim() || newName.trim() === module.moduleName) return;
    try {
      setSaving(true);
      await axios.put(`${API_BASE}/module/update/${module._id}`, {
        moduleName: newName.trim(),
        moduleDescription: module.moduleDescription || "",
        lastUpdatedBy: userId,
      });
      toast.success("Module updated");
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update module");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDescription = async (newDesc: string) => {
    try {
      setSaving(true);
      await axios.put(`${API_BASE}/module/update/${module._id}`, {
        moduleName: module.moduleName,
        moduleDescription: newDesc.trim(),
        lastUpdatedBy: userId,
      });
      toast.success("Module updated");
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update module");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!confirm("Delete this module?")) return;
    try {
      setSaving(true);
      await axios.delete(`${API_BASE}/module/delete/${module._id}`);
      toast.success("Module deleted");
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete module");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = async () => {
    if (!secName.trim()) return toast.error("Section name is required");
    try {
      setAddingSection(true);
      const body = {
        moduleId: module._id,
        sectionName: secName.trim(),
        sectionDescription: secDesc.trim(),
        order: (module.sections?.length || 0) + 1,
        createdBy: userId,
        lastUpdatedBy: userId,
      };
      const res = await axios.post(`${API_BASE}/section/create`, body);
      toast.success(res.data?.message || "Section created");
      setSecName("");
      setSecDesc("");
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create section");
    } finally {
      setAddingSection(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Top bar */}
      <div className="border-b bg-white px-6 py-4 flex items-start justify-between">
        <div className="space-y-1">
          <InlineEdit
            value={module.moduleName}
            onSave={handleRenameModule}
            placeholder="Module name"
            className="text-xl font-semibold"
          />
          <InlineEdit
            value={module.moduleDescription || ""}
            onSave={handleUpdateDescription}
            placeholder="Description (optional)"
            className="text-sm text-gray-600"
            textarea
          />
        </div>
        <button
          onClick={handleDeleteModule}
          disabled={saving}
          className="rounded bg-red-600 text-white px-3 py-2 text-sm h-10 disabled:opacity-50"
        >
          Delete Module
        </button>
      </div>

      {/* Sections */}
      <div className="p-6 space-y-3">
        {sortedSections.length === 0 ? (
          <div className="text-sm text-gray-600">No sections yet.</div>
        ) : (
          sortedSections.map((s) => (
            <SectionCard
              key={s._id}
              section={s}
              userId={userId}
                courseId={module.courseId}   // ✅ added this

              allTests={allTests}
              loadingTests={loadingTests}
              onChanged={onChanged}
            />
          ))
        )}

        {/* Add Section panel (moved BELOW the list) */}
        <div className="mt-4 border rounded-lg bg-white p-4">
          <div className="font-medium mb-2">Add Section</div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Section name</label>
              <input
                value={secName}
                onChange={(e) => setSecName(e.target.value)}
                className="w-full border rounded px-2 py-2 text-sm"
                placeholder="e.g., Introduction"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Description (optional)</label>
              <input
                value={secDesc}
                onChange={(e) => setSecDesc(e.target.value)}
                className="w-full border rounded px-2 py-2 text-sm"
                placeholder="A short description"
              />
            </div>
            <button
              onClick={handleAddSection}
              disabled={addingSection}
              className="rounded bg-blue-600 text-white px-4 py-2 text-sm h-10 disabled:opacity-50"
            >
              {addingSection ? "Adding…" : "Add Section"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetail;

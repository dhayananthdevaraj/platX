// ModuleList.tsx
import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:7071/api";

type ModuleLite = {
  _id: string;
  moduleName: string;
  order: number;
  sections?: any[];
};

interface Props {
  modules: ModuleLite[];
  selectedModuleId: string | null;
  onSelect: (id: string) => void;
  onCreated: () => void;
  courseId: string;
  userId: string;
  loading?: boolean;
}

const ModuleList: React.FC<Props> = ({
  modules,
  selectedModuleId,
  onSelect,
  onCreated,
  courseId,
  userId,
  loading,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Module name is required");
    try {
      setSaving(true);
      const body = {
        courseId,
        moduleName: name.trim(),
        moduleDescription: desc.trim(),
        order: modules.length + 1,
        createdBy: userId,
      };
      const res = await axios.post(`${API_BASE}/module/create`, body);
      toast.success(res.data?.message || "Module created");
      setName("");
      setDesc("");
      setShowAdd(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create module");
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="w-[320px] border-r h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="font-semibold">Modules</div>
        <div className="text-xs text-gray-500">{modules.length} total</div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {modules.length === 0 && !loading ? (
          <div className="p-4 text-sm text-gray-600">No modules</div>
        ) : (
          <ul>
            {modules
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((m) => {
                const selected = m._id === selectedModuleId;
                return (
                  <li key={m._id} className="border-b">
                    <button
                      onClick={() => onSelect(m._id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                        selected ? "bg-gray-100" : ""
                      }`}
                    >
                      <div className="truncate font-medium">{m.moduleName}</div>
                      <div className="text-xs text-gray-500 flex gap-3">
                        <span>Order {m.order}</span>
                        {!!m.sections?.length && <span>{m.sections.length} sections</span>}
                      </div>
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </div>

      {/* Add panel at bottom */}
      <div className="border-t p-3">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            disabled={loading}
          >
            + Add Module
          </button>
        ) : (
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-2 py-2 text-sm"
              placeholder="Module name"
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full border rounded px-2 py-2 text-sm"
              placeholder="Description (optional)"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 rounded bg-blue-600 text-white px-3 py-2 text-sm disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setName("");
                  setDesc("");
                }}
                className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ModuleList;

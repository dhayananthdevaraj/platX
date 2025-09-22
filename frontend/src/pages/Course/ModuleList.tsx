
import React, { useState } from "react";
import toast from "react-hot-toast";
import { ModuleItem } from "./types/course";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Props {
  modules: ModuleItem[];
  selectedModuleId: string | null;
  onSelect: (id: string) => void;
  onChanged: () => void;
  courseId: string;
  userId: string;
  loading?: boolean;
}

const ModuleList: React.FC<Props> = ({
  modules,
  selectedModuleId,
  onSelect,
  onChanged,
  courseId,
  userId,
  loading,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  /** ✅ Handle Module Creation */
  const handleCreate = () => {
    if (!name.trim()) return toast.error("Module name is required");

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const activeModules = modules.filter((m) => !m.isDeleted);

      const newModule: ModuleItem = {
        _id: `local-${crypto.randomUUID()}`, // 🔹 Unique temp ID for new modules
        moduleName: name.trim(),
        moduleDescription: desc.trim(),
        order: activeModules.length + 1,
        sections: [],
        courseId,
        createdBy: userId,
        lastUpdatedBy: userId,
        createdAt: now,
        updatedAt: now,
        isNew: true, // ✅ Mark this as a NEW module for backend sync
        isUpdated: false,
        isDeleted: false,
        isLocal: true
      } as ModuleItem;

      const updatedModules = [...modules, newModule];

      // ✅ Save updated modules list to localStorage
      localStorage.setItem(`course_${courseId}`, JSON.stringify(updatedModules));

      
      toast.success("Module created locally");

      // ✅ Reset form & hide input panel
      setName("");
      setDesc("");
      setShowAdd(false);

      // ✅ Notify parent to reload modules
      onChanged();

      // ✅ Automatically select the newly created module
      onSelect(newModule._id);
    } catch (err) {
      console.error("Error creating module:", err);
      toast.error("Failed to create module");
    } finally {
      setSaving(false);
    }
  };

  /** ✅ Handle Drag and Drop Reordering */
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    // Get active modules and sort by current order
    const activeModules = modules.filter((m) => !m.isDeleted);
    const reordered = [...activeModules].sort((a, b) => a.order - b.order);

    // Perform the reorder
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    // Update order values and mark as updated
    const updatedActiveModules = reordered.map((m, idx) => ({
      ...m,
      order: idx + 1,
      isUpdated: !m.isNew, // mark updated if it came from backend
    }));

    // Merge with deleted modules (keep them unchanged)
    const deletedModules = modules.filter((m) => m.isDeleted);
    const allUpdatedModules = [...updatedActiveModules, ...deletedModules];

    // Save updated order in localStorage
    localStorage.setItem(`course_${courseId}`, JSON.stringify(allUpdatedModules));
    toast.success("Modules reordered");

    onChanged();
  };

  // Get active modules sorted by order for display
  const activeModules = modules
    .filter((m) => !m.isDeleted)
    .sort((a, b) => a.order - b.order);

  return (
    <aside className="w-[320px] border-r h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <div className="font-semibold">Modules</div>
        <div className="text-xs text-gray-500">{activeModules.length} total</div>
      </div>

      {/* Module List with Drag and Drop */}
      <div className="flex-1 overflow-y-auto">
        {activeModules.length === 0 && !loading ? (
          <div className="p-4 text-sm text-gray-600">No modules</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="modules">
              {(provided, snapshot) => (
                <ul
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`${
                    snapshot.isDraggingOver ? "bg-blue-50" : ""
                  } transition-colors`}
                >
                  {activeModules.map((m, index) => {
                    const selected = m._id === selectedModuleId;

                    return (
                      <Draggable
                        key={m._id}
                        draggableId={m._id}
                        index={index}
                        isDragDisabled={loading}
                      >
                        {(provided, snapshot) => (
                          <li
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border-b transition ${
                              snapshot.isDragging
                                ? "shadow-lg bg-white z-50 rotate-2"
                                : ""
                            }`}
                          >
                            <div className="flex items-center">
                              {/* Drag Handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="px-2 py-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                              >
                                <svg
                                  width="12"
                                  height="16"
                                  viewBox="0 0 12 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <circle cx="2" cy="2" r="1.5" fill="currentColor" />
                                  <circle cx="2" cy="8" r="1.5" fill="currentColor" />
                                  <circle cx="2" cy="14" r="1.5" fill="currentColor" />
                                  <circle cx="10" cy="2" r="1.5" fill="currentColor" />
                                  <circle cx="10" cy="8" r="1.5" fill="currentColor" />
                                  <circle cx="10" cy="14" r="1.5" fill="currentColor" />
                                </svg>
                              </div>

                              {/* Module Button */}
                              <button
                                onClick={() => onSelect(m._id)}
                                className={`flex-1 text-left px-2 py-3 hover:bg-gray-50 transition ${
                                  selected ? "bg-gray-100" : ""
                                } ${
                                  snapshot.isDragging ? "pointer-events-none" : ""
                                }`}
                              >
                                <div className="truncate font-medium flex items-center gap-2">
                                  {m.moduleName}
                                  {m.isNew && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                                      New
                                    </span>
                                  )}
                                  {m.isUpdated && !m.isNew && (
                                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                                      Updated
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 flex gap-3">
                                 {!!m.sections?.filter((s) => !s.isDeleted).length && (
                                    <span>{m.sections.filter((s) => !s.isDeleted).length} sections</span>
                                  )}

                                </div>
                              </button>
                            </div>
                          </li>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Add Module Panel */}
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
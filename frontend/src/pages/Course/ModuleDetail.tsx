

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import InlineEdit from "./InlineEdit";
import SectionContainer from "./Section/SectionContainer";
import type { ModuleItem, Section, TestLite } from "./types/course";
import axios from "axios";

interface Props {
  module: ModuleItem;
  userId: string;
  onChanged: (nextModuleId?: string | null) => void; // ✅ Enhanced to handle module selection
}

const API_BASE = "http://localhost:7071/api";

const ModuleDetail: React.FC<Props> = ({ module, userId, onChanged }) => {
  const [moduleData, setModuleData] = useState<ModuleItem>(module);
  const [allTests, setAllTests] = useState<TestLite[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [secName, setSecName] = useState("");
  const [secDesc, setSecDesc] = useState("");

  // ✅ Keep moduleData in sync when prop changes
  useEffect(() => {
    setModuleData(module);
  }, [module]);

  const sortedSections = useMemo(
    () => (moduleData.sections || []).slice().sort((a, b) => a.order - b.order),
    [moduleData.sections]
  );

  /** Fetch all tests from backend */
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
  }, [moduleData._id]);

  /** Save updated module to localStorage */
  const updateModuleInStorage = (updatedModule: ModuleItem) => {
    const cached = localStorage.getItem(`course_${updatedModule.courseId}`);
    const modules: ModuleItem[] = cached ? JSON.parse(cached) : [];

    const updatedModules = modules.map((m) =>
      m._id === updatedModule._id ? updatedModule : m
    );

    localStorage.setItem(`course_${updatedModule.courseId}`, JSON.stringify(updatedModules));
    setModuleData(updatedModule);
    onChanged(); // Regular update without module selection
  };

  /** Handle Section Drag and Drop */
  const handleSectionDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.index === destination.index) return;

    // Get active sections and sort by current order
    const activeSections = (moduleData.sections || []).filter((s) => !s.isDeleted);
    const reordered = [...activeSections].sort((a, b) => a.order - b.order);

    // Perform the reorder
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    // Update order values and mark as updated
    const updatedActiveSections = reordered.map((s, idx) => ({
      ...s,
      order: idx + 1,
      isUpdated: !s.isNew, // mark updated if it came from backend
    }));

    // Merge with deleted sections (keep them unchanged)
    const deletedSections = (moduleData.sections || []).filter((s) => s.isDeleted);
    const allUpdatedSections = [...updatedActiveSections, ...deletedSections];

    const updatedModule = {
      ...moduleData,
      sections: allUpdatedSections,
    };

    updateModuleInStorage(updatedModule);
    toast.success("Sections reordered");
  };

  /** Add new section locally */
  const handleAddSection = () => {
    if (!secName.trim()) return toast.error("Section name is required");

    const activeSections = (moduleData.sections || []).filter(
      (s) => !s.isDeleted
    );

    const newSection: Section = {
      _id: `local-section-${Date.now()}`,
      moduleId: moduleData._id,
      sectionName: secName.trim(),
      sectionDescription: secDesc.trim(),
      order: activeSections.length + 1,
      tests: [],
      isNew: true
    };

    const updatedModule = {
      ...moduleData,
      sections: [...(moduleData.sections || []), newSection],
    };

    updateModuleInStorage(updatedModule);
    setSecName("");
    setSecDesc("");
    toast.success("Section added locally");
  };

  /** Rename module */
  const handleRenameModule = (newName: string) => {
    if (!newName.trim() || newName.trim() === moduleData.moduleName) return;

    const updatedModule = {
      ...moduleData,
      moduleName: newName.trim(),
      isUpdated: !moduleData.isNew,
    };

    updateModuleInStorage(updatedModule);
    toast.success("Module renamed locally");
  };

  /** Update module description */
  const handleUpdateDescription = (newDesc: string) => {
    const updatedModule = {
      ...moduleData,
      moduleDescription: newDesc.trim(),
      isUpdated: !moduleData.isNew,
    };

    updateModuleInStorage(updatedModule);
    toast.success("Description updated locally");
  };

  /** ✅ Delete module with auto-selection logic */
  const handleDeleteModule = () => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    const cached = localStorage.getItem(`course_${moduleData.courseId}`);
    const modules: ModuleItem[] = cached ? JSON.parse(cached) : [];

    let updatedModules: ModuleItem[] = [];
    let nextModuleId: string | null = null;

    // ✅ Find the next module to select BEFORE deletion
    const currentOrder = moduleData.order;
    const activeModules = modules.filter((m) => !m.isDeleted && m._id !== moduleData._id);
    
    if (activeModules.length > 0) {
      // Sort active modules by order
      const sortedActiveModules = activeModules.sort((a, b) => a.order - b.order);
      
      // Try to find the next module with higher order
      const nextModule = sortedActiveModules.find(m => m.order > currentOrder);
      
      if (nextModule) {
        nextModuleId = nextModule._id;
      } else {
        // If no next module, select the previous one (last in the list)
        nextModuleId = sortedActiveModules[sortedActiveModules.length - 1]._id;
      }
    }
    // If no active modules remain, nextModuleId stays null

    // Perform deletion
    if (moduleData.isLocal) {
      // ✅ Remove local-only module completely
      updatedModules = modules.filter((m) => m._id !== moduleData._id);
      toast.success("Local module deleted permanently");
    } else {
      // ✅ Soft delete backend module
      updatedModules = modules.map((m) =>
        m._id === moduleData._id ? { ...m, isDeleted: true } : m
      );
      toast.success("Module marked as deleted locally");
    }

    // ✅ Reorder only modules AFTER the deleted one
    const deletedOrder = moduleData.order;
    updatedModules = updatedModules.map((m) => {
      if (!m.isDeleted && m.order > deletedOrder) {
        return {
          ...m,
          order: m.order - 1,
          isUpdated: true, // mark as updated since order shifted
        };
      }
      return m;
    });

    // Save updated data
    localStorage.setItem(
      `course_${moduleData.courseId}`,
      JSON.stringify(updatedModules)
    );

    // ✅ Notify parent with next module selection
    onChanged(nextModuleId);
  };

  const handleSectionUpdate = (updatedSection: Section & { remove?: boolean }) => {
    let updatedSections: Section[] = [];

    if (updatedSection.remove) {
      // ✅ Remove section completely
      updatedSections = (moduleData.sections || []).filter(
        (s) => s._id !== updatedSection._id
      );

      // ✅ Reorder sections after the deleted one
      const deletedOrder = updatedSection.order;
      updatedSections = updatedSections.map((s) => {
        if (!s.isDeleted && s.order > deletedOrder) {
          return {
            ...s,
            order: s.order - 1,
            isUpdated: true, // mark as updated since order shifted
          };
        }
        return s;
      });
    } else {
      // ✅ Update or mark as deleted
      updatedSections = (moduleData.sections || []).map((s) =>
        s._id === updatedSection._id ? updatedSection : s
      );

      // ✅ If this was a soft delete, also reorder
      if (updatedSection.isDeleted) {
        const deletedOrder = updatedSection.order;
        updatedSections = updatedSections.map((s) => {
          if (!s.isDeleted && s.order > deletedOrder) {
            return {
              ...s,
              order: s.order - 1,
              isUpdated: true,
            };
          }
          return s;
        });
      }
    }

    const updatedModule = {
      ...moduleData,
      sections: updatedSections,
    };
    updateModuleInStorage(updatedModule);
  };

  // Get active sections for display
  const activeSections = sortedSections.filter((s) => !s.isDeleted);

  return (
    <div className="h-full overflow-y-auto">
      {/* Module header */}
      <div className="border-b bg-white px-6 py-4 flex items-start justify-between">
        <div className="space-y-1">
          <InlineEdit
            value={moduleData.moduleName}
            onSave={handleRenameModule}
            placeholder="Module name"
            className="text-xl font-semibold"
          />
          <InlineEdit
            value={moduleData.moduleDescription || ""}
            onSave={handleUpdateDescription}
            placeholder="Description (optional)"
            className="text-sm text-gray-600"
            textarea
          />
        </div>
        <button
          onClick={handleDeleteModule}
          className="rounded bg-red-600 text-white px-3 py-2 text-sm h-10 hover:bg-red-700 transition-colors"
        >
          Delete Module
        </button>
      </div>

      {/* Sections with Drag and Drop */}
      <div className="p-6 space-y-3">
        {activeSections.length === 0 ? (
          <div className="text-sm text-gray-600">No sections yet.</div>
        ) : (
          <DragDropContext onDragEnd={handleSectionDragEnd}>
            <Droppable droppableId={`sections-${moduleData._id}`}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-3 ${
                    snapshot.isDraggingOver ? "bg-blue-50 rounded-lg p-2" : ""
                  } transition-colors`}
                >
                  {activeSections.map((section, index) => (
                    <Draggable
                      key={section._id}
                      draggableId={section._id}
                      index={index}
                      isDragDisabled={loadingTests}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${
                            snapshot.isDragging
                              ? "shadow-2xl bg-white z-50 rotate-1 scale-105"
                              : ""
                          } transition-all`}
                        >
                          <div className="flex">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-start pt-6 pr-3 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
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

                            {/* Section Content */}
                            <div
                              className={`flex-1 ${
                                snapshot.isDragging ? "pointer-events-none" : ""
                              }`}
                            >
                              <SectionContainer
                                key={section._id}
                                section={section}
                                userId={userId}
                                courseId={moduleData.courseId}
                                allTests={allTests}
                                loadingTests={loadingTests}
                                onChanged={handleSectionUpdate}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Add Section */}
        <div className="mt-4 border rounded-lg bg-white p-4">
          <div className="font-medium mb-2">Add Section</div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Section name</label>
              <input
                value={secName}
                onChange={(e) => setSecName(e.target.value)}
                className="w-full border rounded px-2 py-2 text-sm"
                placeholder="Introduction"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">
                Description (optional)
              </label>
              <input
                value={secDesc}
                onChange={(e) => setSecDesc(e.target.value)}
                className="w-full border rounded px-2 py-2 text-sm"
                placeholder="Short description"
              />
            </div>
            <button
              onClick={handleAddSection}
              className="rounded bg-blue-600 text-white px-4 py-2 text-sm h-10 hover:bg-blue-700 transition-colors"
            >
              Add Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDetail;
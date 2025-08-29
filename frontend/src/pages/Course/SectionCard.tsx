
import React, { useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import InlineEdit from "./InlineEdit";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import TestVisibilityManager from "./TestVisibilityManager";

const API_BASE = "http://localhost:7071/api";

type TestLite = { _id: string; name?: string; title?: string };
type SectionTest = { _id: string; sectionId: string; testId: string; order: number };
type Section = {
  _id: string;
  moduleId: string;
  sectionName: string;
  order: number;
  tests?: SectionTest[];
};

interface Props {
  section: Section;
  userId: string;
  allTests: TestLite[];
  loadingTests: boolean;
  courseId: string;
  onChanged: () => void;
}

const SectionCard: React.FC<Props> = ({
  section,
  userId,
  allTests,
  loadingTests,
  courseId,
  onChanged,
}) => {
  const [saving, setSaving] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [configTestId, setConfigTestId] = useState("");
  const [configDocId, setConfigDocId] = useState("");
  const [showVisibility, setShowVisibility] = useState(false);
  const [visibilityTestId, setVisibilityTestId] = useState<string | null>(null);

  const [config, setConfig] = useState({
    startTime: "",
    endTime: "",
    durationInMinutes: 60,
    maxAttempts: 1,
    isRetakeAllowed: false,
    isCopyPasteAllowed: false,
    isPreparationTest: false,
  });

  const assignedTestIds = useMemo(
    () => new Set((section.tests || []).map((t) => t.testId)),
    [section.tests]
  );

  const testOptions = useMemo(
    () =>
      allTests
        .filter((t) => !assignedTestIds.has(t._id))
        .map((t) => ({
          value: t._id,
          label: t.name || t.title || t._id,
        })),
    [allTests, assignedTestIds]
  );

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

  const getTestName = (testId: string) =>
    allTests.find((t) => t._id === testId)?.name ||
    allTests.find((t) => t._id === testId)?.title ||
    testId;

  const handleRenameSection = async (newName: string) => {
    if (!newName.trim() || newName.trim() === section.sectionName) return;
    try {
      setSaving(true);
      await axios.put(`${API_BASE}/section/update/${section._id}`, {
        sectionName: newName.trim(),
        lastUpdatedBy: userId,
      });
      toast.success("Section updated");
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update section");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!confirm("Delete this section?")) return;
    try {
      setSaving(true);
      await axios.delete(`${API_BASE}/section/delete/${section._id}`);
      toast.success("Section deleted");
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete section");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTest = async () => {
    if (!selectedTestId) return toast.error("Select a test");
    try {
      setSaving(true);
      const nextOrder = (section.tests?.length || 0) + 1;
      const body = { sectionId: section._id, testId: selectedTestId, order: nextOrder };
      const res = await axios.post(`${API_BASE}/section-test/add`, body);
      toast.success(res.data?.message || "Test added");
      setSelectedTestId("");
      setShowAddPopup(false);
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add test");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTest = async (sectionTestId: string) => {
    if (!confirm("Remove this test from section?")) return;
    try {
      setSaving(true);
      await axios.delete(`${API_BASE}/section-test/delete/${sectionTestId}`);
      toast.success("Test removed");
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove test");
    } finally {
      setSaving(false);
    }
  };

  const openConfigPopup = async (testId: string) => {
    try {
      setConfigTestId(testId);
      setSaving(true);
      const res = await axios.get(`${API_BASE}/test-configuration/${courseId}/${testId}`);
      if (res.data) {
        setConfigDocId(res.data._id);
        setConfig({
          startTime: toDateTimeLocal(res.data.startTime),
          endTime: toDateTimeLocal(res.data.endTime),
          durationInMinutes: res.data.durationInMinutes || 60,
          maxAttempts: res.data.maxAttempts || 1,
          isRetakeAllowed: res.data.isRetakeAllowed || false,
          isCopyPasteAllowed: res.data.isCopyPasteAllowed || false,
          isPreparationTest: res.data.isPreparationTest || false,
        });
      } else {
        setConfigDocId("");
        setConfig({
          startTime: "",
          endTime: "",
          durationInMinutes: 60,
          maxAttempts: 1,
          isRetakeAllowed: false,
          isCopyPasteAllowed: false,
          isPreparationTest: false,
        });
      }
    } catch {
      setConfigDocId("");
      setConfig({
        startTime: "",
        endTime: "",
        durationInMinutes: 60,
        maxAttempts: 1,
        isRetakeAllowed: false,
        isCopyPasteAllowed: false,
        isPreparationTest: false,
      });
    } finally {
      setSaving(false);
      setShowConfigPopup(true);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const body = {
        testId: configTestId,
        courseId,
        ...config,
        startTime: fromDateTimeLocal(config.startTime),
        endTime: fromDateTimeLocal(config.endTime),
        lastUpdatedBy: userId,
        createdBy: userId,
      };

      if (configDocId) {
        await axios.put(`${API_BASE}/test-configuration/update/${configDocId}`, body);
      } else {
        await axios.post(`${API_BASE}/test-configuration/create`, body);
      }

      toast.success("Configuration saved");
      setShowConfigPopup(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const reordered = Array.from(section.tests || []).sort((a, b) => a.order - b.order);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    try {
      setSaving(true);
      await Promise.all(
        reordered.map((t, idx) =>
          axios.put(`${API_BASE}/section-test/update/${t._id}`, { order: idx + 1 })
        )
      );
      toast.success("Tests reordered");
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reorder");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-lg mb-6">
      {/* Section Header */}
      <div className="flex justify-between items-center mb-4">
        <InlineEdit
          value={section.sectionName}
          onSave={handleRenameSection}
          placeholder="Section name"
          className="font-semibold text-lg"
        />
        <button
          onClick={handleDeleteSection}
          disabled={saving}
          className="rounded px-3 py-1 bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {/* Assigned Tests */}
      <div>
        <div className="text-sm font-medium mb-2">Assigned Tests</div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={`droppable-${section._id}`}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {(section.tests || [])
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((t, idx) => (
                    <Draggable key={t._id} draggableId={t._id} index={idx}>
                      {(drag) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          {...drag.dragHandleProps}
                          className="flex items-center justify-between p-3 mb-2 rounded-lg bg-gray-50 hover:shadow-sm border"
                        >
                          <span className="font-medium">{getTestName(t.testId)}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openConfigPopup(t.testId)}
                              className="text-blue-600 text-sm hover:underline"
                            >
                              Configure
                            </button>
                            <button
                              onClick={() => {
                                setVisibilityTestId(t.testId);
                                setShowVisibility(true);
                              }}
                              className="px-2 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                            >
                              Visibility
                            </button>
                            <button
                              onClick={() => handleRemoveTest(t._id)}
                              disabled={saving}
                              className="text-red-600 text-sm hover:underline disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
                {(section.tests || []).length === 0 && (
                  <div className="text-gray-500 text-sm">No tests assigned</div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Add Test */}
      <div className="mt-4">
        <button
          onClick={() => setShowAddPopup(true)}
          className="rounded px-3 py-2 bg-purple-600 text-white text-sm hover:bg-purple-700"
        >
          + Add Test
        </button>
      </div>

      {/* Add Test Modal */}
      {showAddPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Add Test</h3>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingTests || saving}
            >
              <option value="">{loadingTests ? "Loading…" : "-- Select test --"}</option>
              {testOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddPopup(false)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTest}
                disabled={!selectedTestId || saving}
                className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Test Modal */}
      {showConfigPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Configure Test</h3>
              <button
                onClick={() => setShowConfigPopup(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {/* Schedule */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Schedule</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={config.startTime}
                  onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start Time"
                />
                <input
                  type="datetime-local"
                  value={config.endTime}
                  onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="End Time"
                />
              </div>
            </div>

            {/* Duration / Attempts */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Duration & Attempts</h4>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={config.durationInMinutes}
                  onChange={(e) => setConfig({ ...config, durationInMinutes: +e.target.value })}
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Duration (minutes)"
                />
                <input
                  type="number"
                  value={config.maxAttempts}
                  onChange={(e) => setConfig({ ...config, maxAttempts: +e.target.value })}
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Max Attempts"
                />
              </div>
            </div>

            {/* Rules */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rules</h4>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.isRetakeAllowed}
                    onChange={(e) => setConfig({ ...config, isRetakeAllowed: e.target.checked })}
                    className="rounded border-gray-400"
                  />
                  Allow Retakes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.isCopyPasteAllowed}
                    onChange={(e) => setConfig({ ...config, isCopyPasteAllowed: e.target.checked })}
                    className="rounded border-gray-400"
                  />
                  Allow Copy-Paste
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.isPreparationTest}
                    onChange={(e) => setConfig({ ...config, isPreparationTest: e.target.checked })}
                    className="rounded border-gray-400"
                  />
                  Mark as Preparation Test
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConfigPopup(false)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Config"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Visibility */}
      {showVisibility && visibilityTestId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Manage Visibility</h3>
              <button
                onClick={() => {
                  setShowVisibility(false);
                  setVisibilityTestId(null);
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <TestVisibilityManager
              testId={visibilityTestId}
              courseId={courseId}
              // onClose={() => {
              //   setShowVisibility(false);
              //   setVisibilityTestId(null);
              // }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionCard;

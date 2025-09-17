import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import InlineEdit from "../InlineEdit";
import TestList from "./TestList";
import AddTestModal from "./AddTestModal";
import ConfigTestModal from "./ConfigTestModal";
import TestVisibilityManager from "./TestVisibilityManager";
import type { ModuleItem, Section, SectionTest, TestLite } from "../types/course";
import { api } from "../../../api/axiosInstance";
import { db } from "../../../db"; // ✅ Import IndexedDB instance


interface Props {
  section: Section;
  userId: string;
  courseId: string;
  allTests: TestLite[];
  loadingTests: boolean;
  onChanged: (updatedSection: Section) => void;
}

type ConfigState = {
  startTime: string;
  endTime: string;
  durationInMinutes: number;
  maxAttempts: number;
  isRetakeAllowed: boolean;
  isProctored: boolean;
  isPreparationTest: boolean;
  malpracticeLimit: number;
  correctMark: number;
  negativeMark: number;
  passPercentage: number;
};

const SectionContainer: React.FC<Props> = ({
  section,
  userId,
  courseId,
  allTests,
  loadingTests,
  onChanged,
}) => {
  const navigate = useNavigate();
  const [sectionData, setSectionData] = useState<Section>(section);
  const [saving, setSaving] = useState(false);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestLite | null>(null);
  const [showConfigPopup, setShowConfigPopup] = useState(false);
  const [configTestId, setConfigTestId] = useState("");
  const [showVisibility, setShowVisibility] = useState(false);
  const [visibilityTestId, setVisibilityTestId] = useState<string | null>(null);
  const [configDocId, setConfigDocId] = useState("");
  const [config, setConfig] = useState<ConfigState>({
    startTime: "",
    endTime: "",
    durationInMinutes: 60,
    maxAttempts: 1,
    isRetakeAllowed: false,
    isProctored: false,
    isPreparationTest: false,
    malpracticeLimit: 0,
    correctMark: 1,
    negativeMark: 0,
    passPercentage: 40,
  });

  useEffect(() => {
    setSectionData(section);
  }, [section]);

  /** Update section locally + propagate to parent */
  const updateSection = (updated: Section) => {
    setSectionData(updated);
    onChanged(updated);
  };

  /** Handle section name change */
  const handleRenameSectionName = (newName: string) => {
    if (!newName.trim() || newName.trim() === sectionData.sectionName) return;

    const updatedSection: Section = {
      ...sectionData,
      sectionName: newName.trim(),
      isUpdated: !sectionData.isNew,
    };

    updateSection(updatedSection);
    toast.success("Section name updated locally");
  };

  /** Handle section description change */
  const handleUpdateSectionDescription = (newDesc: string) => {
    const updatedSection: Section = {
      ...sectionData,
      sectionDescription: newDesc.trim(),
      isUpdated: !sectionData.isNew,
    };

    updateSection(updatedSection);
    toast.success("Section description updated locally");
  };

  /** Dropdown options */
  const testOptions = useMemo(() => {
    const normal = allTests
      .filter((t) => t.type === "normal")
      .map((t) => ({ value: t._id, label: t.name || t.title || t._id, type: "normal" }));
    const random = allTests
      .filter((t) => t.type === "random")
      .map((t) => ({ value: t._id, label: t.name || t.title || t._id, type: "random" }));

    return [
      { label: "Tests", options: normal },
      { label: "Random Tests", options: random },
    ];
  }, [allTests]);

  /** Get test name */
  const getTestName = (testId: string) =>
    allTests.find((t) => t._id === testId)?.name || testId;

  /** Add test locally */
  const handleAddTest = async (): Promise<void> => {
    if (!selectedTest) {
      toast.error("Select a test");
      return;
    }

    // ✅ Check IndexedDB snapshot instead of localStorage
    const modules: ModuleItem[] = await db.modules.where("courseId").equals(courseId).toArray();

    for (const module of modules) {
      for (const section of module.sections || []) {
        const found = (section.tests || []).some(
          (t) => !t.isDeleted && t.testId === selectedTest._id
        );

        if (found) {
          toast.error(
            `Test is already added in the course.\n\nModule: ${module.moduleName}\nSection: ${section.sectionName}`
          );
          return;
        }
      }
    }

    const newTest: SectionTest = {
      _id: `local-test-${Date.now()}`,
      sectionId: sectionData._id,
      testId: selectedTest._id,
      order: ((sectionData.tests || []).filter((t) => !t.isDeleted).length || 0) + 1,
      type: selectedTest.type,
      isNew: true,
    };

    updateSection({
      ...sectionData,
      tests: [...(sectionData.tests || []), newTest],
    });

    setSelectedTest(null);
    setShowAddPopup(false);
    toast.success("Test added locally");
  };

  const handleRemoveTest = async (sectionTestId: string) => {
    if (!confirm("Remove this test from section?")) return;

    let updatedTests = (sectionData.tests || []).filter((t) => {
      if (t._id === sectionTestId) {
        if (t.isNew) {
          return false;
        } else {
          t.isDeleted = true;
        }
      }
      return true;
    });

    updatedTests = updatedTests.map((t, idx) => {
      if (!t.isDeleted) {
        return {
          ...t,
          order: idx + 1,
          isUpdated: !t.isNew,
        };
      }
      return t;
    });

    updateSection({
      ...sectionData,
      tests: updatedTests,
    });

    toast.success("Test removed locally");
  };

  /** Reorder tests locally */
  const handleReorderTests = async (reorderedTests: SectionTest[]) => {
    updateSection({
      ...sectionData,
      tests: reorderedTests.map((t, idx) => ({
        ...t,
        order: idx + 1,
        isUpdated: !t.isNew && !t.isDeleted ? true : t.isUpdated,
      })),
    });

    toast.success("Tests reordered locally");
  };

  /** Delete section locally */
  const handleDeleteSection = () => {
    if (!confirm("Are you sure you want to delete this section?")) return;

    if (sectionData.isNew) {
      onChanged({ ...sectionData, isDeleted: true, remove: true } as any);
      toast.success("Local section deleted permanently");
    } else {
      const updatedSection: Section = {
        ...sectionData,
        isDeleted: true,
      };
      onChanged(updatedSection);
      toast.success("Section marked as deleted locally");
    }
  };

  /** Open config modal */
  const openConfigPopup = async (testId: string) => {
    try {
      setConfigTestId(testId);
      setSaving(true);

      const res = await api.get(`/test-configuration/${courseId}/${testId}`);

      if (res.data) {
        const isProctored = !!res.data.isProctored;
        const isPreparation = !!res.data.isPreparationTest;

        setConfigDocId(res.data._id);
        setConfig({
          startTime: toDateTimeLocal(res.data.startTime),
          endTime: toDateTimeLocal(res.data.endTime),
          durationInMinutes: res.data.durationInMinutes || 60,
          maxAttempts: res.data.maxAttempts || 1,
          isRetakeAllowed: !!res.data.isRetakeAllowed,
          isProctored,
          isPreparationTest: isProctored ? false : isPreparation,
          malpracticeLimit: res.data.malpracticeLimit ?? 0,
          correctMark: res.data.correctMark ?? 1,
          negativeMark: res.data.negativeMark ?? 0,
          passPercentage: res.data.passPercentage ?? 40,
        });
      } else {
        resetConfig();
      }
    } catch {
      resetConfig();
    } finally {
      setSaving(false);
      setShowConfigPopup(true);
    }
  };

  /** Reset config state */
  const resetConfig = () => {
    setConfigDocId("");
    setConfig({
      startTime: "",
      endTime: "",
      durationInMinutes: 60,
      maxAttempts: 1,
      isRetakeAllowed: false,
      isProctored: false,
      isPreparationTest: false,
      malpracticeLimit: 0,
      correctMark: 1,
      negativeMark: 0,
      passPercentage: 40,
    });
  };

  /** Save configuration */
  const handleSaveConfig = async () => {
    try {
      setSaving(true);

      const body = {
        testId: configTestId,
        courseId,
        startTime: fromDateTimeLocal(config.startTime),
        endTime: fromDateTimeLocal(config.endTime),
        durationInMinutes: config.durationInMinutes,
        isRetakeAllowed: config.isRetakeAllowed,
        maxAttempts: config.isRetakeAllowed ? config.maxAttempts : 1,
        isProctored: config.isProctored,
        malpracticeLimit: config.isProctored ? config.malpracticeLimit : 0,
        isPreparationTest: !config.isProctored && config.isPreparationTest,
        correctMark: config.correctMark,
        negativeMark: config.negativeMark,
        passPercentage: config.passPercentage,
        lastUpdatedBy: userId,
        createdBy: userId,
      };

      if (configDocId) {
        await api.put(`/test-configuration/update/${configDocId}`, body);
      } else {
        await api.post(`/test-configuration/create`, body);
      }

      toast.success("Configuration saved");
      setShowConfigPopup(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  /** Utility functions */
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

  const handleViewResults = (testId) => {
    navigate(`/results/${courseId}/${testId}`); // or open a modal
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-lg mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1 flex-1 mr-4">
          <InlineEdit
            value={sectionData.sectionName}
            onSave={handleRenameSectionName}
            placeholder="Section name"
            className="font-semibold text-lg"
          />
          <InlineEdit
            value={sectionData.sectionDescription || ""}
            onSave={handleUpdateSectionDescription}
            placeholder="Description (optional)"
            className="text-sm text-gray-600"
            textarea
          />
        </div>
        <button
          onClick={handleDeleteSection}
          className="rounded bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700 h-8"
        >
          Delete Section
        </button>
      </div>

      <TestList
        tests={(sectionData.tests || []).filter((t) => !t.isDeleted)}
        getTestName={getTestName}
        onReorder={handleReorderTests}
        onConfigure={openConfigPopup}
        onRemove={handleRemoveTest}
        onVisibility={(testId) => {
          setVisibilityTestId(testId);
          setShowVisibility(true);
        }}
        onViewResults={handleViewResults}
        saving={saving}
        sectionId={sectionData._id}
      />

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setShowAddPopup(true)}
          className="rounded px-3 py-2 bg-purple-600 text-white text-sm hover:bg-purple-700"
        >
          + Add Test
        </button>

        <button>
          View Results
        </button>
      </div>

      {showAddPopup && (
        <AddTestModal
          testOptions={testOptions}
          selectedTest={selectedTest}
          onTestSelect={setSelectedTest}
          onAdd={handleAddTest}
          onCancel={() => setShowAddPopup(false)}
          saving={saving}
        />
      )}

      {showConfigPopup && (
        <ConfigTestModal
          config={config}
          onConfigChange={setConfig}
          onSave={handleSaveConfig}
          onCancel={() => setShowConfigPopup(false)}
          saving={saving}
        />
      )}

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
            <TestVisibilityManager testId={visibilityTestId} courseId={courseId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionContainer;
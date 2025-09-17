import React, { useEffect, useState } from "react";
import { api } from "../api/axiosInstance";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Eye,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Settings,
  List,
  HelpCircle,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SectionSidebar from "../pages/Test/SectionSidebar";
import QuestionSetSelector from "./Test/QuestionSetSelector";
import QuestionList from "../pages/Test/QuestionList";
import PreviewTab from "../pages/Test/PreviewTab";
import BackButton from "../components/BackButton";

const tabs = [
  { id: "Details", label: "Test Details", icon: FileText, description: "Basic information" },
  { id: "Sections", label: "Sections", icon: Settings, description: "Configure sections" },
  { id: "Questions", label: "Questions", icon: List, description: "Select questions" },
  { id: "Preview", label: "Preview", icon: Eye, description: "Review & save" }
];

const TestBuilder: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Details");
  const [questionSets, setQuestionSets] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Record<string, any[]>>({});
  const [formData, setFormData] = useState({
    _id: "",
    code: "",
    name: "",
    description: "",
    sections: [
      {
        sectionName: "",
        questionSets: [] as string[],
        questions: [] as string[],
        questionSearch: "",
      },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(0);
  // Validation states
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // ---------- Load Question Sets + Test ----------
  useEffect(() => {
    fetchQuestionSets();
  }, []);

  useEffect(() => {
    if (id) {
      fetchTestDetails(id);
    } else if (location.state?.test) {
      normalizeAndInitialize(location.state.test);
    }
  }, [id]);

  const fetchQuestionSets = async () => {
    try {
      const res = await api.get("/questionset/all");
      setQuestionSets(res.data.questionSets || []);
    } catch {
      toast.error("Failed to load question sets");
    }
  };

  const fetchTestDetails = async (testId: string) => {
    try {
      const res = await api.get(`/test/${testId}`);
      normalizeAndInitialize(res.data);
    } catch {
      toast.error("Failed to load test details");
    }
  };

  // ---------- Normalize edit payload ----------
  const normalizeAndInitialize = (test: any) => {
    const normalizedSections =
      (test.sections || []).map((s: any) => {
        const rawQs = s.questions || [];
        const first = rawQs[0];
        const isObjectArray = !!first && typeof first === "object";

        const derivedSets: string[] = s.questionSets?.length
          ? s.questionSets
          : isObjectArray
            ? [...new Set(rawQs.map((q: any) => q.questionSetId || ""))]
            : [];

        const ids: string[] = isObjectArray
          ? rawQs.map((q: any) => q._id)
          : rawQs;

        if (isObjectArray) {
          derivedSets.forEach((setId) => {
            const qsForSet = rawQs.filter((q: any) => q.questionSetId === setId);
            if (qsForSet.length) {
              setQuestions((prev) => {
                const existing = prev[setId] || [];
                const map = new Map<string, any>();
                [...existing, ...qsForSet].forEach((q: any) => map.set(q._id, q));
                return { ...prev, [setId]: Array.from(map.values()) };
              });
            }
          });
        }

        return {
          sectionName: s.sectionName || "",
          questionSets: derivedSets,
          questions: ids,
          questionSearch: "",
        };
      }) || [];

    setFormData({
      _id: test._id || "",
      code: test.code || "",
      name: test.name || "",
      description: test.description || "",
      sections: normalizedSections,
    });

    normalizedSections.forEach((sec) => {
      sec.questionSets.forEach((setId) => fetchQuestions(setId));
    });

    if (normalizedSections.length) setActiveSectionIdx(0);
    setActiveTab("Preview");
  };

  // ---------- Questions API ----------
  const fetchQuestions = async (setId: string) => {
    if (!setId) return;
    if (questions[setId]?.length) return;

    try {
      const res = await api.get(
        `/question/questionset/${setId}`
      );
      setQuestions((prev) => ({ ...prev, [setId]: res.data || [] }));
    } catch {
      toast.error("Failed to load questions");
    }
  };

  // ---------- Section ops ----------
  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { sectionName: "", questionSets: [], questions: [], questionSearch: "" },
      ],
    }));
    if (activeSectionIdx === null) setActiveSectionIdx(0);
  };

  const updateSection = (index: number, field: string, value: any) => {
    const updated = [...formData.sections];
    if (field === "questionSets") {
      const prevSets = updated[index].questionSets;
      const removedSets = prevSets.filter((s) => !value.includes(s));
      updated[index].questionSets = value;

      if (removedSets.length) {
        updated[index].questions = updated[index].questions.filter((qId) => {
          const q = Object.values(questions).flat().find((x: any) => x._id === qId);
          return q && !removedSets.includes(q.questionSetId);
        });
      }

      value.forEach((setId: string) => fetchQuestions(setId));
    } else {
      updated[index][field as keyof (typeof updated)[number]] = value;
    }
    setFormData({ ...formData, sections: updated });
  };

  const toggleQuestion = (sectionIdx: number, qId: string) => {
    const updated = [...formData.sections];
    const exists = updated[sectionIdx].questions.includes(qId);
    updated[sectionIdx].questions = exists
      ? updated[sectionIdx].questions.filter((id) => id !== qId)
      : [...updated[sectionIdx].questions, qId];
    setFormData({ ...formData, sections: updated });
  };

  const toggleSelectAll = (
    sectionIdx: number,
    allIds: string[],
    filter: string
  ) => {
    const updated = [...formData.sections];
    const selectedNow = updated[sectionIdx].questions;
    const filterIds =
      filter === "All"
        ? allIds
        : allIds.filter((id) => {
          const q = Object.values(questions)
            .flat()
            .find((x: any) => x._id === id);
          return q?.difficulty === filter;
        });

    const allSelected = filterIds.every((id) => selectedNow.includes(id));
    updated[sectionIdx].questions = allSelected
      ? selectedNow.filter((id) => !filterIds.includes(id))
      : [...new Set([...selectedNow, ...filterIds])];

    setFormData({ ...formData, sections: updated });
  };

  const removeSection = (idx: number) => {
    setFormData((prev: any) => {
      let updatedSections = prev.sections.filter((_: any, i: number) => i !== idx);
      if (updatedSections.length === 0) {
        updatedSections = [
          { sectionName: "", questionSets: [], questions: [] },
        ];
        setActiveSectionIdx(0);
        setActiveTab("Sections");
      } else {
        if (activeSectionIdx !== null) {
          if (idx === activeSectionIdx) {
            setActiveSectionIdx(0);
          } else if (idx < activeSectionIdx) {
            setActiveSectionIdx((prevIdx) =>
              prevIdx !== null ? prevIdx - 1 : null
            );
          }
        }
      }
      return { ...prev, sections: updatedSections };
    });
  };

  // ---------- Validation ----------
  const validateCurrentTab = () => {
    const errors: Record<string, string> = {};

    if (activeTab === "Details") {
      if (!formData.name.trim()) errors.name = "Test name is required";
      if (!formData.code.trim()) errors.code = "Test code is required";
      if (!formData.description.trim()) errors.description = "Description is required";
    }

    if (activeTab === "Sections") {
      if (formData.sections.length === 0) {
        errors.sections = "At least one section is required";
      } else {
        formData.sections.forEach((section, idx) => {
          if (!section.sectionName.trim()) {
            errors[`section_${idx}`] = `Section ${idx + 1} name is required`;
          }
        });
      }
    }

    if (activeTab === "Questions") {
      const hasQuestions = formData.sections.some((s) => s.questions.length > 0);
      if (!hasQuestions) {
        errors.questions = "At least one question must be selected";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------- Save ----------
  const handleSubmit = async () => {
    if (!validateCurrentTab()) {
      toast.error("Please fix validation errors");
      return;
    }

    try {
      setLoading(true);
      const cleanedSections = formData.sections
        .filter((s) => s.questions && s.questions.length > 0)
        .map((s) => ({
          sectionName: s.sectionName,
          questionSets: s.questionSets,
          questions: s.questions,
        }));

      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        sections: cleanedSections,
        createdBy: user?.id,
        lastUpdatedBy: user?.id,
      };

      if (formData._id) {
        await api.put(
          `/test/update/${formData._id}`,
          payload
        );
        toast.success("Test updated successfully");
      } else {
        await api.post("/test/create", payload);
        toast.success("Test created successfully");
      }
      navigate("/view-tests");
    } catch {
      toast.error("Failed to save test");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQuestion = (sectionIdx: number, qId: string) => {
    setFormData((prev: any) => {
      const updatedSections = [...prev.sections];
      updatedSections[sectionIdx].questions = updatedSections[
        sectionIdx
      ].questions.filter((q: any) =>
        typeof q === "string" ? q !== qId : q._id !== qId
      );
      return { ...prev, sections: updatedSections };
    });
  };

  // ---------- Navigation ----------
  const goToNextTab = (nextTab: string) => {
    if (!validateCurrentTab()) {
      return;
    }
    setActiveTab(nextTab);
  };

  const getCurrentTabIndex = () => tabs.findIndex(tab => tab.id === activeTab);
  const getNextTab = () => tabs[getCurrentTabIndex() + 1]?.id;
  const getPrevTab = () => tabs[getCurrentTabIndex() - 1]?.id;

  // Get validation status for each tab
  const getTabValidationStatus = (tabId: string) => {
    if (tabId === "Details") {
      return formData.name && formData.code && formData.description;
    }
    if (tabId === "Sections") {
      return formData.sections.length > 0 && formData.sections.every(s => s.sectionName.trim());
    }
    if (tabId === "Questions") {
      return formData.sections.some(s => s.questions.length > 0);
    }
    return true;
  };

  return (
    <div className="min-h-screen w-full">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-t-xl border shadow-md sticky top-0 z-50 w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <BackButton />
            <div className="flex items-center gap-3">
              <FileText size={24} className="text-blue-600 sm:w-7 sm:h-7" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formData._id ? "Edit Test" : "Create New Test"}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate max-w-xs sm:max-w-none">
                  {formData.name || "Untitled Test"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => navigate("/view-tests")}
              className="px-3 py-2 sm:px-4 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {activeTab === "Preview" && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 sm:px-6 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                <Save size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {loading ? "Saving..." : formData._id ? "Update Test" : "Create Test"}
                </span>
                <span className="sm:hidden">
                  {loading ? "Saving..." : "Save"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 sm:mt-6 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const isCompleted = getTabValidationStatus(tab.id);
              const isPast = getCurrentTabIndex() > index;
              return (
                <button
                  key={tab.id}
                  onClick={() => goToNextTab(tab.id)}
                  className={`flex items-center gap-2 sm:gap-3 px-1 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                      ? "border-blue-600 text-blue-600"
                      : isPast && isCompleted
                        ? "border-green-600 text-green-600 hover:text-green-700"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {isPast && isCompleted ? (
                      <CheckCircle size={16} className="text-green-600 sm:w-5 sm:h-5" />
                    ) : isActive ? (
                      <tab.icon size={16} className="sm:w-5 sm:h-5" />
                    ) : !isCompleted ? (
                      <AlertCircle size={16} className="text-gray-400 sm:w-5 sm:h-5" />
                    ) : (
                      <tab.icon size={16} className="sm:w-5 sm:h-5" />
                    )}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 sm:px-6 py-4 sm:py-8">
        <div className="w-full max-w-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* Details Tab */}
              {activeTab === "Details" && (
                <div className="w-full max-w-4xl mx-auto">
                  <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-6">
                    <div className="border-b pb-4">
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Test Information</h2>
                      <p className="text-gray-600 mt-1 text-sm">Provide basic details about your test</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${validationErrors.name ? "border-red-300" : "border-gray-300"
                            }`}
                          placeholder="Enter test name"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (validationErrors.name) {
                              setValidationErrors(prev => ({ ...prev, name: "" }));
                            }
                          }}
                        />
                        {validationErrors.name && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${validationErrors.code ? "border-red-300" : "border-gray-300"
                            }`}
                          placeholder="Enter test code"
                          value={formData.code}
                          onChange={(e) => {
                            setFormData({ ...formData, code: e.target.value });
                            if (validationErrors.code) {
                              setValidationErrors(prev => ({ ...prev, code: "" }));
                            }
                          }}
                        />
                        {validationErrors.code && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.code}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${validationErrors.description ? "border-red-300" : "border-gray-300"
                          }`}
                        placeholder="Enter test description"
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                          if (validationErrors.description) {
                            setValidationErrors(prev => ({ ...prev, description: "" }));
                          }
                        }}
                      />
                      {validationErrors.description && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
                      )}
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                      <button
                        onClick={() => goToNextTab("Sections")}
                        className="flex items-center gap-2 px-4 py-2 sm:px-6 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Next: Sections
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections Tab */}
              {activeTab === "Sections" && (
                <div className="w-full max-w-4xl mx-auto">
                  <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-4 sm:p-6 border-b">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Test Sections</h2>
                          <p className="text-gray-600 mt-1 text-sm">Organize your test into sections</p>
                        </div>
                        <button
                          onClick={addSection}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Plus size={16} />
                          Add Section
                        </button>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4">
                      {formData.sections.map((section, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                            <div className="flex-1 w-full">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Section {idx + 1} Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                className={`w-full px-3 py-2 border bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${validationErrors[`section_${idx}`] ? "border-red-300" : "border-gray-300"
                                  }`}
                                placeholder="Enter section name"
                                value={section.sectionName}
                                onChange={(e) => {
                                  updateSection(idx, "sectionName", e.target.value);
                                  if (validationErrors[`section_${idx}`]) {
                                    setValidationErrors(prev => ({ ...prev, [`section_${idx}`]: "" }));
                                  }
                                }}
                              />
                              {validationErrors[`section_${idx}`] && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors[`section_${idx}`]}</p>
                              )}
                            </div>
                            <button
                              onClick={() => removeSection(idx)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-0 sm:mt-6 self-start"
                              title="Remove section"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {validationErrors.sections && (
                        <p className="text-red-500 text-sm">{validationErrors.sections}</p>
                      )}
                    </div>
                    <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row justify-between gap-4">
                      <button
                        onClick={() => goToNextTab("Details")}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <ChevronRight size={16} className="rotate-180" />
                        Previous
                      </button>
                      <button
                        onClick={() => goToNextTab("Questions")}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Next: Questions
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions Tab */}
              {activeTab === "Questions" && (
                <div className="w-full">
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
                    <div className="xl:col-span-1">
                      <SectionSidebar
                        sections={formData.sections}
                        activeSectionIdx={activeSectionIdx}
                        setActiveSectionIdx={setActiveSectionIdx}
                        questions={questions}
                        removeSection={removeSection}
                      />
                    </div>
                    <div className="xl:col-span-3 space-y-4 sm:space-y-6">
                      {activeSectionIdx !== null && formData.sections[activeSectionIdx] && (
                        <>
                          <QuestionSetSelector
                            questionSets={questionSets}
                            section={formData.sections[activeSectionIdx]}
                            updateSection={(field, val) =>
                              updateSection(activeSectionIdx, field, val)
                            }
                          />
                          <QuestionList
                            section={formData.sections[activeSectionIdx]}
                            questions={questions}
                            toggleQuestion={(id) => toggleQuestion(activeSectionIdx, id)}
                            toggleSelectAll={(allIds, filter) =>
                              toggleSelectAll(activeSectionIdx, allIds, filter)
                            }
                            updateSection={(field, val) =>
                              updateSection(activeSectionIdx, field, val)
                            }
                          />
                        </>
                      )}
                      {validationErrors.questions && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-600 text-sm">{validationErrors.questions}</p>
                        </div>
                      )}
                      <div className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row justify-between gap-4">
                        <button
                          onClick={() => goToNextTab("Sections")}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          <ChevronRight size={16} className="rotate-180" />
                          Previous
                        </button>
                        <button
                          onClick={() => goToNextTab("Preview")}
                          className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Next: Preview
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Tab */}
              {activeTab === "Preview" && (
                <div className="w-full">
                  <PreviewTab
                    formData={formData}
                    questions={questions}
                    handleSubmit={handleSubmit}
                    loading={loading}
                    onRemoveQuestion={handleRemoveQuestion}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default TestBuilder;
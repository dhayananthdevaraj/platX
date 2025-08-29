import React, { useState } from "react";

interface PreviewTabProps {
  formData: any;
  questions: Record<string, any[]>; // keyed by questionSetId
  handleSubmit: () => void;
  loading: boolean;
  editMode?: boolean; // ✅ to detect edit vs create
  onRemoveQuestion?: (sectionIdx: number, qId: string) => void;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-50 border-green-300",
  medium: "bg-yellow-50 border-yellow-300",
  hard: "bg-red-50 border-red-300",
};

const PreviewTab: React.FC<PreviewTabProps> = ({
  formData,
  questions,
  handleSubmit,
  loading,
  editMode = false,
  onRemoveQuestion,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ Resolve selected questions + attach QS name
  const getSelectedQuestions = (section: any) => {
    if (!section.questions || section.questions.length === 0) return [];

    const selectedIds = section.questions;
    const resolved: any[] = [];

    (section.questionSets || []).forEach((qs: any) => {
      const qsId = typeof qs === "string" ? qs : qs._id;
      const qsName = typeof qs === "string" ? "" : qs.name; // ✅ if object contains name

      const qsQuestions = questions[qsId] || [];
      qsQuestions.forEach((q) => {
        if (selectedIds.includes(q._id)) {
          resolved.push({ ...q, questionSetName: qsName });
        }
      });
    });

    return resolved;
  };

  // ✅ count difficulty for popup
  const getStats = () => {
    let total = 0;
    const counts = { easy: 0, medium: 0, hard: 0, unknown: 0 };

    formData.sections.forEach((section: any) => {
      
      const selectedQuestions = getSelectedQuestions(section);
      total += selectedQuestions.length;

      console.log(selectedQuestions,"selectedQuestions");
      
      selectedQuestions.forEach((q) => {
        const diff = (q.difficulty || "").toLowerCase();
        if (diff === "easy") counts.easy++;
        else if (diff === "medium") counts.medium++;
        else if (diff === "hard") counts.hard++;
        else counts.unknown++;
      });
    });


    return { total, counts };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Test meta */}
      <div className="bg-white border rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-2">Test Details</h2>
        <p>
          <strong>Name:</strong> {formData.name}
        </p>
        <p>
          <strong>Code:</strong> {formData.code}
        </p>
        <p>
          <strong>Description:</strong> {formData.description}
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Sections</h2>

        {formData.sections.map((section: any, sIdx: number) => {
          const selectedQuestions = getSelectedQuestions(section);

          return (
            <div key={sIdx} className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold mb-3">
                {section.sectionName || `Section ${sIdx + 1}`}
              </h3>

              {selectedQuestions.length === 0 ? (
                <p className="text-sm text-gray-500">No questions selected.</p>
              ) : (
                <div className="space-y-3">
                  {selectedQuestions.map((q, qIdx) => {
                    const diff = (q.difficulty || "unknown").toLowerCase();
                    const diffStyle =
                      difficultyColors[diff] ||
                      "bg-gray-50 border-gray-200";

                    return (
                      <div
                        key={q._id || `${sIdx}-${qIdx}`}
                        className={`border rounded-lg p-4 ${diffStyle}`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-medium">
                            Q{qIdx + 1}. {q.text}
                          </p>
                          {onRemoveQuestion && (
                            <button
                              className="text-red-600 text-xs border border-red-300 rounded px-2 py-0.5 hover:bg-red-50"
                              onClick={() => onRemoveQuestion(sIdx, q._id)}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Options */}
                        <ul className="mt-2 space-y-1">
                          {(q.options || []).map((opt: string, i: number) => {
                            const isCorrect = q.correctAnswerIndex === i;
                            return (
                              <li
                                key={i}
                                className={`text-sm px-2 py-1 rounded ${
                                  isCorrect
                                    ? "font-bold text-green-700"
                                    : ""
                                }`}
                              >
                                {i + 1}) {opt}
                                {isCorrect && " ✅"}
                              </li>
                            );
                          })}
                        </ul>

                        <p className="text-xs text-gray-600 mt-2">
                          Marks: {q.marks ?? "-"} | Negative:{" "}
                          {q.negativeMarks ?? "-"} | Difficulty:{" "}
                          {q.difficulty || "-"}
                        </p>

                        {/* ✅ Question Set Name */}
                        {q.questionSetId.name && (
                          <p className="text-xs mt-1 text-blue-600 italic">
                            Question Set: {q.questionSetId.name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit / Update */}
      <div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          onClick={() => setShowConfirm(true)}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : editMode
            ? "Update Test"
            : "Submit Test"}
        </button>
      </div>

      {/* ✅ Confirmation Popup */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">
              Confirm {editMode ? "Update" : "Create"} Test
            </h3>
            <p className="mb-2">
              Total Questions: <strong>{stats.total}</strong>
            </p>
            <ul className="mb-4 text-sm space-y-1">
              <li>Easy: {stats.counts.easy}</li>
              <li>Medium: {stats.counts.medium}</li>
              <li>Hard: {stats.counts.hard}</li>
              <li>Unknown: {stats.counts.unknown}</li>
            </ul>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewTab;

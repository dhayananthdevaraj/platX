import React, { useState, useEffect } from "react";

const difficultyColors: Record<string, string> = {
  Easy: "bg-green-200 text-green-800",
  Medium: "bg-yellow-200 text-yellow-800",
  Hard: "bg-red-200 text-red-800",
};

interface QuestionListProps {
  section: any;
  questions: Record<string, any[]>; // grouped by QS id
  toggleQuestion: (id: string) => void;
  toggleSelectAll: (allIds: string[], filter: string) => void;
  updateSection: (field: string, value: any) => void;
}

const QuestionList: React.FC<QuestionListProps> = ({
  section,
  questions,
  toggleQuestion,
  toggleSelectAll,
  updateSection,
}) => {
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalDifficulty, setGlobalDifficulty] = useState("All");
  const [qsFilters, setQsFilters] = useState<
    Record<string, { search: string; difficulty: string }>
  >({});
  const [openQS, setOpenQS] = useState<string | null>(null);

  const selected: string[] = section.questions || [];

  // ✅ Cleanup effect: remove questions if their QS is removed
  useEffect(() => {
    if (!section.questionSets) return;

    // gather all valid question IDs from active QS
    const validIds = section.questionSets.flatMap(
      (qsId: string) => (questions[qsId] || []).map((q) => q._id)
    );

    // keep only valid ones
    const cleaned = selected.filter((id) => validIds.includes(id));

    if (cleaned.length !== selected.length) {
      updateSection("questions", cleaned);
    }
  }, [section.questionSets, questions]);

  const updateQsFilter = (qsId: string, field: string, value: string) => {
    setQsFilters((prev) => ({
      ...prev,
      [qsId]: {
        search: prev[qsId]?.search || "",
        difficulty: prev[qsId]?.difficulty || "All",
        [field]: value,
      },
    }));
  };

  const handleToggleSelectAll = (qsId: string, allIds: string[]) => {
    toggleSelectAll(allIds, qsFilters[qsId]?.difficulty || "All");
  };

  return (
    <div className="space-y-4">
      {/* Global filters */}
      <div className="flex gap-2">
        <input
          className="border rounded p-2 flex-1"
          placeholder="Global search across all QS"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
        />
        <select
          className="border rounded p-2"
          value={globalDifficulty}
          onChange={(e) => setGlobalDifficulty(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {/* Loop QS */}
      {(section.questionSets || []).map((qsId: string) => {
        const qsFilter = qsFilters[qsId] || { search: "", difficulty: "All" };
        const qsQuestions = (questions[qsId] || [])
          .filter((q) =>
            q.text.toLowerCase().includes(globalSearch.toLowerCase())
          )
          .filter((q) =>
            globalDifficulty === "All" ? true : q.difficulty === globalDifficulty
          )
          .filter((q) =>
            q.text.toLowerCase().includes(qsFilter.search.toLowerCase())
          )
          .filter((q) =>
            qsFilter.difficulty === "All"
              ? true
              : q.difficulty === qsFilter.difficulty
          );

        const allIds = qsQuestions.map((q) => q._id);

        const diffCount = { Easy: 0, Medium: 0, Hard: 0 };
        selected.forEach((id) => {
          const q = (questions[qsId] || []).find((x) => x._id === id);
          if (q?.difficulty) diffCount[q.difficulty]++;
        });

        return (
          <div key={qsId} className="border rounded">
            {/* QS header */}
            <div
              className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
              onClick={() => setOpenQS(openQS === qsId ? null : qsId)}
            >
              <span className="font-semibold">
                {/* ✅ Show QS name instead of ID */}
                {questions[qsId]?.[0]?.questionSetId?.name || "Unnamed QS"}
              </span>
              <span className="text-xs text-gray-600">
                Selected: {diffCount.Easy + diffCount.Medium + diffCount.Hard} | E:
                {diffCount.Easy} | M:{diffCount.Medium} | H:{diffCount.Hard}
              </span>
            </div>

            {openQS === qsId && (
              <div className="p-3 space-y-3">
                {/* Per-QS filters */}
                <div className="flex gap-2 mb-2">
                  <input
                    className="border rounded p-1 flex-1 text-sm"
                    placeholder="Search inside this QS"
                    value={qsFilter.search}
                    onChange={(e) =>
                      updateQsFilter(qsId, "search", e.target.value)
                    }
                  />
                  <select
                    className="border rounded p-1 text-sm"
                    value={qsFilter.difficulty}
                    onChange={(e) =>
                      updateQsFilter(qsId, "difficulty", e.target.value)
                    }
                  >
                    <option value="All">All</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Select All */}
                <button
                  className="text-xs bg-gray-200 px-2 py-1 rounded"
                  onClick={() => handleToggleSelectAll(qsId, allIds)}
                >
                  Select/Unselect All in QS
                </button>

                {/* Questions */}
                {qsQuestions.map((q) => (
                  <div
                    key={q._id}
                    className={`border rounded p-3 transition ${
                      selected.includes(q._id) ? "bg-green-50" : "bg-white"
                    }`}
                  >
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.includes(q._id)}
                        onChange={() => toggleQuestion(q._id)}
                      />
                      <div>
                        <p className="font-medium">{q.text}</p>
                        <ul className="list-disc pl-5 text-sm">
                          {q.options.map((opt: string, i: number) => (
                            <li
                              key={i}
                              className={
                                q.correctAnswerIndex === i
                                  ? "font-bold text-green-600"
                                  : ""
                              }
                            >
                              {opt}
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 mt-1">
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              difficultyColors[q.difficulty]
                            }`}
                          >
                            {q.difficulty}
                          </span>
                          {q.tags?.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs rounded border text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}

                {qsQuestions.length === 0 && (
                  <p className="text-gray-500 text-sm">No questions found.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default QuestionList;

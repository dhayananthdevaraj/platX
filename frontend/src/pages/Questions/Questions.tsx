// src/pages/Questions.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { PlusCircle, Pencil, Trash2, Search } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Select from "react-select";
import { useAuth } from "../../contexts/AuthContext"; // adjust path if needed



interface Question {
    _id: string;
    text: string;
    difficulty: "Easy" | "Medium" | "Hard";
    isActive: boolean;
    marks: number;
    negativeMarks: number;
    options: string[];
    correctAnswerIndex?: number;
    explanation?: string;
    createdAt: string;
    updatedAt: string;
    questionSetId?: any;
}

const Questions: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    const { user } = useAuth();

    // ✅ Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // ✅ Search & Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState<
        "all" | "Easy" | "Medium" | "Hard"
    >("all");

    // ✅ Toggle Explanations
    const [showExplanations, setShowExplanations] = useState(false);

    const [showMoveModal, setShowMoveModal] = useState(false);
    const [allQuestionSets, setAllQuestionSets] = useState<any[]>([]);
    const [selectedTargetSet, setSelectedTargetSet] = useState<string>("");

    const navigate = useNavigate();
    const { questionSetId } = useParams<{ questionSetId: string }>();

    const fetchQuestions = async () => {
        try {
            const res = await axios.get(
                `http://localhost:7071/api/question/questionset/${questionSetId}`
            );
            const data = res.data;

            let list: Question[] = [];
            if (Array.isArray(data)) list = data;
            else if (Array.isArray(data.questions)) list = data.questions;
            else list = [data];

            // ✅ only active questions
            setQuestions(list.filter((q) => q.isActive));
        } catch (error) {
            console.error("Failed to fetch questions", error);
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedIds([]);
        } else {
            setSelectedIds(questions.map((q) => q._id));
        }
        setSelectAll(!selectAll);
    };

    const toggleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((sid) => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const filteredQuestions = questions.filter((q) => {
        const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
            difficultyFilter === "all" || q.difficulty === difficultyFilter;
        return matchesSearch && matchesFilter;
    });

    const handleBulkAction = async (action: string) => {
        if (selectedIds.length === 0) {
            toast.error("Please select at least one question");
            return;
        }

        try {
            switch (action) {
                case "delete":
                    for (const id of selectedIds) {
                        await axios.put(
                            `http://localhost:7071/api/question/update/${id}`,
                            { isActive: false }
                        );
                    }
                    toast.success("Deleted successfully");
                    setSelectedIds([]);
                    setSelectAll(false);
                    fetchQuestions();
                    break;

                case "move":
                    openMoveModal();
                    break;

                case "clone":
                    try {
                        const res = await axios.post(
                            `http://localhost:7071/api/question/clone`,
                            {
                                questionIds: selectedIds,
                                targetQuestionSetId: questionSetId,
                                createdBy: user?.id,        // ✅ send user id
                                lastUpdatedBy: user?.id     // ✅ send user id
                            }
                        );

                        toast.success(res.data?.message || "Cloned successfully");
                        setSelectedIds([]);
                        setSelectAll(false);
                        fetchQuestions();
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to clone questions");
                    }
                    break;

                default:
                    break;
            }
        } catch (err) {
            console.error(err);
            toast.error("Action failed");
        }
    };

    const openMoveModal = async () => {
        try {
            const res = await axios.get("http://localhost:7071/api/questionset/all");
            console.log("API response:", res.data);

            const data = res.data;

            if (Array.isArray(data.questionSets)) {
                setAllQuestionSets(data.questionSets); // ✅ correct key
            } else {
                setAllQuestionSets([]);
            }

            setShowMoveModal(true);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch question sets");
        }
    };

    const handleMoveQuestions = async () => {
        if (!selectedTargetSet || selectedIds.length === 0) {
            toast.error("Select target question set first");
            return;
        }

        try {
            const res = await axios.post(`http://localhost:7071/api/question/move`, {
                questionIds: selectedIds,
                targetQuestionSetId: selectedTargetSet
            });

            toast.success(res.data?.message || "Questions moved successfully");
            setShowMoveModal(false);
            setSelectedIds([]);
            setSelectAll(false);
            fetchQuestions();
        } catch (err) {
            console.error(err);
            toast.error("Failed to move questions");
        }
    };



    const handleDeleteOne = async (id: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this question?");
        if (!confirmDelete) return;

        try {
            await axios.put(
                `http://localhost:7071/api/question/update/${id}`,
                { isActive: false }
            );

            // ✅ Update local state so UI refreshes instantly
            setQuestions((prev) => prev.filter((q) => q._id !== id));
            toast.success("Question deleted successfully");
        } catch (err) {
            console.error("Delete failed", err);
            toast.error("Failed to delete question");
        }
    };

    console.log(allQuestionSets)

    return (
        <div className="px-4 md:px-10 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                    Questions
                </h1>
                <Link
                    to={`/questions/${questionSetId}/add`}
                    className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-700 transition-all"
                >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Add Question
                </Link>
            </div>

            {/* Bulk Actions + Search + Filter + Toggle */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center">
                <select
                    onChange={(e) => {
                        handleBulkAction(e.target.value);
                        e.currentTarget.value = ""; // ✅ reset dropdown
                    }}
                    defaultValue=""
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="" disabled>
                        Bulk Actions
                    </option>
                    <option value="delete">Delete</option>
                    <option value="move">Move</option>
                    <option value="clone">Clone</option>
                </select>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by question text..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <select
                    value={difficultyFilter}
                    onChange={(e) =>
                        setDifficultyFilter(
                            e.target.value as "all" | "Easy" | "Medium" | "Hard"
                        )
                    }
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                </select>

                <button
                    onClick={() => setShowExplanations(!showExplanations)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm bg-gray-100 hover:bg-gray-200"
                >
                    {showExplanations ? "Hide Explanations" : "Show Explanations"}
                </button>
            </div>

            {/* Select All Checkbox */}
            {filteredQuestions.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                    <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Select All</span>
                </div>
            )}

            {/* Questions List */}
            {loading ? (
                <p className="text-center text-gray-500">Loading...</p>
            ) : (
                <div className="space-y-4">
                    {filteredQuestions.map((q, index) => (
                        <div
                            key={q._id}
                            className="bg-white border border-gray-200 rounded-2xl shadow hover:shadow-lg p-5 transition relative"
                        >
                            {/* Checkbox + Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(q._id)}
                                        onChange={() => toggleSelectOne(q._id)}
                                        className="w-4 h-4"
                                    />
                                    <h2 className="text-lg font-semibold line-clamp-2">
                                        Q{index + 1}. {q.text}
                                    </h2>
                                </div>
                                <div className="flex gap-2 text-gray-500">
                                    <button
                                        onClick={() =>
                                            navigate(`/questions/edit/${q._id}`)
                                        }
                                        title="Edit"
                                        className="hover:text-yellow-500 transition"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDeleteOne(q._id)
                                        }
                                        title="Delete"
                                        className="hover:text-red-600 transition"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Difficulty & Marks */}
                            <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
                                <span
                                    className={`px-2 py-1 rounded-full font-medium ${q.difficulty === "Easy"
                                        ? "bg-green-100 text-green-700"
                                        : q.difficulty === "Medium"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {q.difficulty}
                                </span>
                                <span>
                                    Marks: {q.marks} | Negative: {q.negativeMarks}
                                </span>
                            </div>

                            {/* MCQ Options */}
                            <div className="space-y-2 mb-3">
                                {q.options.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-2 border rounded-lg ${idx === q.correctAnswerIndex
                                            ? "border-green-500 bg-green-50"
                                            : "border-gray-200 bg-gray-50"
                                            }`}
                                    >
                                        <span className="font-medium">{idx + 1}.</span>
                                        <span className="text-gray-700">{opt}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Explanation */}
                            {showExplanations && q.explanation && (
                                <div className="mb-3 text-sm text-gray-700">
                                    <strong>Explanation:</strong> {q.explanation}
                                </div>
                            )}

                            {/* Dates */}
                            <div className="flex justify-between text-xs text-gray-500 border-t pt-2">
                                <p>
                                    <strong>Created:</strong>{" "}
                                    {new Date(q.createdAt).toLocaleString()}
                                </p>
                                <p>
                                    <strong>Updated:</strong>{" "}
                                    {new Date(q.updatedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}

                    {filteredQuestions.length === 0 && (
                        <p className="text-center text-gray-500">No questions found.</p>
                    )}
                </div>
            )}

            {showMoveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Move Questions</h2>

                        <Select
                            options={allQuestionSets.map(qs => ({
                                value: qs._id,
                                label: qs.name
                            }))}
                            value={allQuestionSets.find(qs => qs._id === selectedTargetSet)
                                ? { value: selectedTargetSet, label: allQuestionSets.find(qs => qs._id === selectedTargetSet)?.name }
                                : null}
                            placeholder="Select Question Set"
                            isClearable
                            onChange={(option) => setSelectedTargetSet(option?.value || "")}
                        />

                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowMoveModal(false)}
                                className="px-4 py-2 rounded bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMoveQuestions}
                                className="px-4 py-2 rounded bg-blue-600 text-white"
                            >
                                Move
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Questions;
// src/pages/Questions.tsx
// src/pages/Questions.tsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { PlusCircle, Pencil, Trash2, Search, Filter } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Select from "react-select";
import { useAuth } from "../../contexts/AuthContext"; // adjust path if needed
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus } from "react-icons/fa6";
import BackButton from "../../components/BackButton";
import { FiEdit } from "react-icons/fi";
 


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

    // ✅ Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState<
        "all" | "Easy" | "Medium" | "Hard"
    >("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);

    // ✅ UI Toggles
    const [showFilters, setShowFilters] = useState(false);
    const [showExplanations, setShowExplanations] = useState(false);

    // ✅ Bulk actions state
    const [bulkAction, setBulkAction] = useState("");

    const [showMoveModal, setShowMoveModal] = useState(false);
    const [allQuestionSets, setAllQuestionSets] = useState<any[]>([]);
    const [selectedTargetSet, setSelectedTargetSet] = useState<string>("");

    const navigate = useNavigate();
    const { questionSetId } = useParams<{ questionSetId: string }>();

    const topRef = useRef<HTMLDivElement | null>(null);

    // scroll to top when page changes
    useEffect(() => {
        if (topRef.current) {
            topRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentPage]);

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

            setQuestions(list); // don’t filter active here → use statusFilter
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
        const matchesDifficulty =
            difficultyFilter === "all" || q.difficulty === difficultyFilter;
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && q.isActive) ||
            (statusFilter === "inactive" && !q.isActive);
        return matchesSearch && matchesDifficulty && matchesStatus;
    });

    const totalPages = Math.ceil(filteredQuestions.length / rowsPerPage);
    const paginatedQuestions = filteredQuestions.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const resetFilters = () => {
        setSearchTerm("");
        setDifficultyFilter("all");
        setStatusFilter("all");
        setRowsPerPage(25);
        setCurrentPage(1);
    };

    const handleBulkAction = async (action: string) => {
        if (selectedIds.length === 0) {
            toast.error("Please select at least one question");
            setBulkAction("");
            return;
        }

        try {
            switch (action) {
                case "delete":
                    for (const id of selectedIds) {
                        await axios.put(`http://localhost:7071/api/question/update/${id}`, {
                            isActive: false,
                        });
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
                                createdBy: user?.id,
                                lastUpdatedBy: user?.id,
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
        } finally {
            setBulkAction("");
        }
    };

    const openMoveModal = async () => {
        try {
            const res = await axios.get("http://localhost:7071/api/questionset/all");
            const data = res.data;

            if (Array.isArray(data.questionSets)) {
                setAllQuestionSets(data.questionSets);
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
                targetQuestionSetId: selectedTargetSet,
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
            await axios.put(`http://localhost:7071/api/question/update/${id}`, {
                isActive: false,
            });

            setQuestions((prev) => prev.filter((q) => q._id !== id));
            toast.success("Question deleted successfully");
        } catch (err) {
            console.error("Delete failed", err);
            toast.error("Failed to delete question");
        }
    };

    return (
        <div ref={topRef} className="px-4 md:px-10 py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div className="flex justify-center items-center gap-8">
                <BackButton />
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Questions</h1>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap gap-3 mb-4 items-center">
                    {/* Bulk Actions */}
                    <select
                        value={bulkAction}
                        onChange={(e) => {
                            setBulkAction(e.target.value);
                            handleBulkAction(e.target.value);
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="" disabled>
                            Bulk Actions
                        </option>
                        <option value="delete">Delete</option>
                        <option value="move">Move</option>
                        <option value="clone">Clone</option>
                    </select>

                    <div className="flex items-center gap-3">
                        {/* Filters Toggle */}
                        <button
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-2"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <motion.span
                                animate={{ rotate: showFilters ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="inline-block"
                            >
                                ▼
                            </motion.span>
                            Filters
                        </button>
                    </div>

                    {/* Toggle Explanations */}
                    <button
                        onClick={() => setShowExplanations(!showExplanations)}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-sm bg-gray-100 hover:bg-gray-200"
                    >
                        {showExplanations ? "Hide Explanations" : "Show Explanations"}
                    </button>

                    <Link
                        to={`/questions/${questionSetId}/add`}
                        className="inline-flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-all"
                    >
                        <FaPlus size={20} />

                    </Link>
                </div>

                
            </div>

            

            {/* Filters Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4"
                    >
                        <div className="p-4 bg-gray-50 rounded-xl border flex flex-wrap gap-3">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by question text..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Difficulty Filter */}
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

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value as "all" | "active" | "inactive")
                                }
                                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            {/* Rows Per Page */}
                            <select
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={10}>10 Rows</option>
                                <option value={25}>25 Rows</option>
                                <option value={50}>50 Rows</option>
                                <option value={100}>100 Rows</option>
                            </select>

                            {/* Clear Filters */}
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Select All Checkbox */}
            {paginatedQuestions.length > 0 && (
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
                        {paginatedQuestions.map((q, index) => (
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
                                            {/* ✅ Fix numbering with offset */}
                                            Q{(currentPage - 1) * rowsPerPage + (index + 1)}. {q.text}
                                        </h2>
                                    </div>
                                    <div className="flex gap-2 text-gray-500">
                                        <button
                                            onClick={() => navigate(`/questions/edit/${q._id}`)}
                                            title="Edit"
                                            className="hover:text-yellow-500 transition"
                                        >
                                            <FiEdit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOne(q._id)}
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

                    {paginatedQuestions.length === 0 && (
                        <p className="text-center text-gray-500">No questions found.</p>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border disabled:opacity-50"
                    >
                        Prev
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`px-3 py-1 rounded border ${currentPage === i + 1 ? "bg-blue-600 text-white" : ""
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Move Modal */}
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
// src/pages/Questions.tsx
// src/pages/Questions.tsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { PlusCircle, Pencil, Trash2, Search, Filter, BookOpen } from "lucide-react";
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
    tags: string[];
    isActive: boolean;
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
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // ✅ Bulk actions state
    const [bulkAction, setBulkAction] = useState("");

    const [showMoveModal, setShowMoveModal] = useState(false);
    const [allQuestionSets, setAllQuestionSets] = useState<any[]>([]);
    const [selectedTargetSet, setSelectedTargetSet] = useState<string>("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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

            setQuestions(list); // don't filter active here → use statusFilter
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

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleDeleteOne = (id: string) => {
        setDeleteTargetId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        try {
            await axios.put(`http://localhost:7071/api/question/update/${deleteTargetId}`, {
                isActive: false,
            });

            setQuestions((prev) => prev.filter((q) => q._id !== deleteTargetId));
            toast.success("Question deleted successfully");
        } catch (err) {
            console.error("Delete failed", err);
            toast.error("Failed to delete question");
        } finally {
            setShowDeleteModal(false);
            setDeleteTargetId(null);
        }
    };


    return (
        <div ref={topRef} className="px-2 sm:px-4 md:px-10 py-4 sm:py-6">
            {/* Header */}
            <div className="bg-white p-3 sm:p-4 rounded-t-xl border shadow-md flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    {/* Left Section */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <BackButton />
                        <div className="flex-1 sm:flex-none">
                            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-gray-800">
                                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                                Questions
                            </h2>
                            {questions.length > 0 && questions[0].questionSetId?.name && (
                                <p className="text-xs sm:text-sm text-gray-500">
                                    Question Set:{" "}
                                    <span className="font-medium">
                                        {questions[0].questionSetId.name}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Section - Mobile responsive */}
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto">
                        {/* Bulk Actions */}
                        <select
                            value={bulkAction}
                            onChange={(e) => {
                                setBulkAction(e.target.value);
                                handleBulkAction(e.target.value);
                            }}
                            className="px-2 sm:px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0 flex-shrink-0"
                        >
                            <option value="" disabled>
                                <span className="hidden sm:inline">Bulk Actions</span>
                                <span className="sm:hidden">Bulk</span>
                            </option>
                            <option value="delete">Delete</option>
                            <option value="move">Move</option>
                            <option value="clone">Clone</option>
                        </select>

                        {/* Filters Toggle */}
                        <button
                            className="px-2 sm:px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-1 sm:gap-2 text-sm flex-shrink-0"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <motion.span
                                animate={{ rotate: showFilters ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="inline-block text-xs"
                            >
                                ▼
                            </motion.span>
                            <span className="hidden sm:inline">Filters</span>
                            <Filter className="w-4 h-4 sm:hidden" />
                        </button>

                        {/* Toggle Explanations */}
                        <button
                            onClick={() => setShowExplanations(!showExplanations)}
                            className="px-2 sm:px-4 py-2 rounded-lg border border-gray-300 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 flex-shrink-0"
                        >
                            <span className="hidden sm:inline">
                                {showExplanations ? "Hide More" : "Show More"}
                            </span>
                            <span className="sm:hidden">
                                {showExplanations ? "Less" : "More"}
                            </span>
                        </button>

                        {/* Add Question */}
                        <Link
                            to={`/questions/${questionSetId}/add`}
                            className="inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-all flex-shrink-0"
                        >
                            <FaPlus size={16} className="sm:hidden" />
                            <FaPlus size={20} className="hidden sm:block" />
                        </Link>
                    </div>
                </div>

                {/* Filters (Animated Collapse) */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden"
                        >
                            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mt-2">
                                {/* Search - Full width on mobile */}
                                <div className="relative w-full sm:w-60">
                                    <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Search by question text..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input input-bordered pl-9 w-full text-sm"
                                    />
                                </div>

                                {/* Filter dropdowns in a row on mobile */}
                                <div className="flex gap-2 sm:contents">
                                    {/* Difficulty Filter */}
                                    <select
                                        value={difficultyFilter}
                                        onChange={(e) =>
                                            setDifficultyFilter(
                                                e.target.value as "all" | "Easy" | "Medium" | "Hard"
                                            )
                                        }
                                        className="input input-bordered flex-1 sm:w-40 text-sm"
                                    >
                                        <option value="all">
                                            <span className="hidden sm:inline">All Difficulties</span>
                                            <span className="sm:hidden">All Levels</span>
                                        </option>
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
                                        className="input input-bordered flex-1 sm:w-40 text-sm"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 sm:contents">
                                    {/* Rows Per Page */}
                                    <select
                                        value={rowsPerPage}
                                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                        className="input input-bordered flex-1 sm:w-40 text-sm"
                                    >
                                        <option value={10}>10 Rows</option>
                                        <option value={25}>25 Rows</option>
                                        <option value={50}>50 Rows</option>
                                        <option value={100}>100 Rows</option>
                                    </select>

                                    {/* Clear Filters - pushed to right */}
                                    <button
                                        onClick={resetFilters}
                                        className="px-3 sm:px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 hover:bg-gray-200 text-sm flex-1 sm:flex-none sm:ml-auto"
                                    >
                                        <span className="hidden sm:inline">Clear Filters</span>
                                        <span className="sm:hidden">Clear</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Select All Checkbox */}
            {paginatedQuestions.length > 0 && (
                <div className="flex items-center gap-2 mx-2 sm:mx-3 my-2 sm:my-3">
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
                <div className="flex justify-center items-center py-8">
                    <p className="text-center text-gray-500">Loading...</p>
                </div>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {paginatedQuestions.map((q, index) => (
                        <div
                            key={q._id}
                            className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow hover:shadow-lg p-3 sm:p-5 transition relative cursor-pointer"
                            onClick={(e) => {
                                // Prevent expand when clicking on buttons or checkboxes
                                if (!(e.target as HTMLElement).closest('button, input')) {
                                    toggleExpand(q._id);
                                }
                            }}
                        >
                            {/* Checkbox + Header */}
                            <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(q._id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            toggleSelectOne(q._id);
                                        }}
                                        className="w-4 h-4 mt-1 flex-shrink-0"
                                    />
                                    <h2 className="text-base sm:text-lg font-semibold line-clamp-3 sm:line-clamp-2 break-words">
                                        <span className="text-gray-600">
                                            Q{(currentPage - 1) * rowsPerPage + (index + 1)}.
                                        </span>{" "}
                                        {q.text}
                                    </h2>
                                </div>
                                <div className="flex gap-1 sm:gap-2 text-gray-500 flex-shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/questions/${questionSetId}/edit/${q._id}`);
                                        }}
                                        title="Edit"
                                        className="p-2 rounded-full bg-yellow-200 text-gray-500 hover:bg-yellow-500 shadow-md transition"
                                    >
                                        <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteOne(q._id);
                                        }}
                                        title="Delete"
                                        className="p-2 rounded-full bg-red-200 text-gray-500 hover:bg-red-300 shadow-md transition"
                                    >
                                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Difficulty & Marks */}
                            <div className="flex justify-between items-center mb-3 text-xs sm:text-sm text-gray-600">
                                <span
                                    className={`px-2 py-1 rounded-full font-medium text-xs ${q.difficulty === "Easy"
                                            ? "bg-green-100 text-green-700"
                                            : q.difficulty === "Medium"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-red-100 text-red-700"
                                        }`}
                                >
                                    {q.difficulty}
                                </span>
                            </div>

                            {/* Tags */}
                            {q.tags && q.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                                    {q.tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Explanation - Show when either toggle is on OR card is expanded */}
                            {(showExplanations || expandedId === q._id) && q.explanation && (
                                <div className="space-y-3">
                                    {/* MCQ Options */}
                                    <div className="space-y-2 mb-3">
                                        {q.options.map((opt, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg ${idx === q.correctAnswerIndex
                                                        ? "border-green-500 bg-green-50"
                                                        : "border-gray-200 bg-gray-50"
                                                    }`}
                                            >
                                                <span className="font-medium flex-shrink-0 text-sm">
                                                    {idx + 1}.
                                                </span>
                                                <span className="text-gray-700 text-sm break-words">
                                                    {opt}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mb-3 text-sm text-gray-700">
                                        <strong>Explanation:</strong> {q.explanation}
                                    </div>
                                </div>
                            )}

                            {/* Dates */}
                            <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 border-t pt-2 gap-1 sm:gap-0">
                                <p>
                                    <strong>Created:</strong>{" "}
                                    <span className="block sm:inline">
                                        {new Date(q.createdAt).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </p>
                                <p>
                                    <strong>Updated:</strong>{" "}
                                    <span className="block sm:inline">
                                        {new Date(q.updatedAt).toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}

                    {paginatedQuestions.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No questions found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 sm:mt-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2 sm:px-3 py-1 sm:py-2 rounded border disabled:opacity-50 text-sm flex-shrink-0"
                    >
                        Prev
                    </button>
                    <div className="flex gap-1 overflow-x-auto max-w-xs sm:max-w-none">
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-2 sm:px-3 py-1 sm:py-2 rounded border text-sm flex-shrink-0 ${currentPage === pageNum ? "bg-blue-600 text-white" : ""
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 sm:px-3 py-1 sm:py-2 rounded border disabled:opacity-50 text-sm flex-shrink-0"
                    >
                        Next
                    </button>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-4 sm:p-6 rounded-xl w-full max-w-sm">
                        <h2 className="text-lg sm:text-xl font-semibold mb-3 text-red-600">
                            Confirm Delete
                        </h2>
                        <p className="text-gray-700 mb-4">
                            Are you sure you want to delete this question? This action cannot be undone.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-end gap-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded bg-gray-300 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded bg-red-600 text-white text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {showMoveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-4 sm:p-6 rounded-xl w-full max-w-md max-h-full overflow-y-auto">
                        <h2 className="text-lg sm:text-xl font-semibold mb-4">Move Questions</h2>
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
                            className="text-sm"
                        />

                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
                            <button
                                onClick={() => setShowMoveModal(false)}
                                className="px-4 py-2 rounded bg-gray-300 text-sm order-2 sm:order-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMoveQuestions}
                                className="px-4 py-2 rounded bg-blue-600 text-white text-sm order-1 sm:order-2"
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
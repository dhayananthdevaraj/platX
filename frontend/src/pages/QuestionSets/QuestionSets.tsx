import React, { useEffect, useState } from "react";
import axios from "axios";
import { PlusCircle, Pencil, Trash2, Eye, X, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface UserRef {
  _id: string;
  name: string;
  email: string;
}

interface Ref {
  _id: string;
  name: string;
}

interface QuestionSet {
  _id: string;
  name: string;
  code?: string;
  isActive: boolean;
  examId?: Ref | null;
  subjectId?: Ref | null;
  chapterId?: Ref | null;
  instituteId?: Ref[];
  createdBy?: UserRef;
  lastUpdatedBy?: UserRef;
  createdAt: string;
  updatedAt: string;
}

const QuestionSets = () => {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);

  // ✅ Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // ✅ Search
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // ✅ Clone Modal State
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneCode, setCloneCode] = useState("");

  const navigate = useNavigate();

  const fetchQuestionSets = async () => {
    try {
      const res = await axios.get("http://localhost:7071/api/questionset/all");
      // show only active sets
      const activeSets = (res.data.questionSets || []).filter(
        (s: QuestionSet) => s.isActive
      );
      setQuestionSets(activeSets);
    } catch (error) {
      console.error("Failed to fetch question sets", error);
      setQuestionSets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionSets();
  }, []);

  // ✅ Open Clone Modal
  const openCloneModal = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one question set to clone");
      return;
    }
    setShowCloneModal(true);
  };

  // ✅ Handle Clone
  const handleClone = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.id;

    try {
      const res = await axios.post("http://localhost:7071/api/questionset/clone", {
        questionSetIds: selectedIds,
        createdBy: userId,
        name: cloneName,
        code: cloneCode,
      });

      toast.success(`${res.data.clonedSets?.length || 0} Question Set(s) cloned successfully`);
      setSelectedIds([]);
      setSelectAll(false);
      setShowCloneModal(false);
      setCloneName("");
      setCloneCode("");
      fetchQuestionSets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to clone question sets");
    }
  };

  // ✅ Soft Delete One
  const handleSoftDelete = async (id: string) => {
    try {
      await axios.put(`http://localhost:7071/api/questionset/update/${id}`, {
        isActive: false,
      });
      toast.success("Question set marked inactive");
      fetchQuestionSets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
  };

  // ✅ Bulk Delete
  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedIds.map((id) =>
          axios.put(`http://localhost:7071/api/questionset/update/${id}`, {
            isActive: false,
          })
        )
      );
      toast.success("Selected sets marked inactive");
      setSelectedIds([]);
      setSelectAll(false);
      fetchQuestionSets();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to bulk delete");
    }
  };

  // ✅ Handle Select All
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questionSets.map((s) => s._id));
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

  // ✅ Apply Search
  const filteredSets = questionSets.filter((set) => {
    return (
      set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // ✅ Bulk Actions
  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one question set");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user.id;

    console.log(userId)

    switch (action) {
      case "clone":
        openCloneModal();
        break;

      case "delete":
        setConfirmBulkDelete(true);
        break;

      // case "edit":
      //   navigate(`/questionsets/edit/${selectedIds[0]}`);
      //   break;

      case "share":
        toast.success("Share action triggered");
        break;

      default:
        break;
    }

    // ✅ reset dropdown value
    const selectElement =
      document.querySelector<HTMLSelectElement>("select");
    if (selectElement) {
      selectElement.value = "";
    }
  };

  return (
    <div className="px-4 md:px-10 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          Question Sets
        </h1>
        <Link
          to="/questionsets/add"
          className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl shadow hover:bg-blue-700 transition-all"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Question Set
        </Link>
      </div>

      {/* Bulk Actions + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          onChange={(e) => handleBulkAction(e.target.value)}
          defaultValue=""
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" disabled>
            Bulk Actions
          </option>
          <option value="clone">Clone</option>
          <option value="delete">Delete</option>
          {/* <option value="edit">Edit</option> */}
          <option value="share">Share</option>
        </select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-xl border border-gray-200">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-blue-600 text-left text-sm font-semibold text-white">
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSets.map((set, idx) => (
                <tr
                  key={set._id}
                  className={`border-t transition cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-gray-100"
                    } hover:bg-blue-100`}
                  onClick={() => navigate(`/questions/${set._id}`)}
                >
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(set._id)}
                      onChange={() => toggleSelectOne(set._id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {set.name}
                  </td>
                  <td className="px-6 py-4">{set.code || "-"}</td>
                  <td
                    className="px-6 py-4 flex items-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      to={`/questionsets/edit/${set._id}`}
                      className="text-gray-500 hover:text-yellow-500 transition"
                      title="Edit"
                    >
                      <Pencil className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setConfirmDeleteId(set._id)}
                      className="text-gray-500 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedSet(set)}
                      className="text-gray-500 hover:text-blue-600 transition"
                      title="Show More"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSets.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No question sets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Popup Modal */}
      {selectedSet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:w-[90%] md:w-[600px] relative animate-fadeIn">
            <button
              onClick={() => setSelectedSet(null)}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-red-100 transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {selectedSet.name}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <p>
                <strong>Code:</strong> {selectedSet.code || "-"}
              </p>
              <p>
                <strong>Exam:</strong> {selectedSet.examId?.name || "-"}
              </p>
              <p>
                <strong>Subject:</strong> {selectedSet.subjectId?.name || "-"}
              </p>
              <p>
                <strong>Chapter:</strong> {selectedSet.chapterId?.name || "-"}
              </p>
              <p>
                <strong>Institutes:</strong>{" "}
                {selectedSet.instituteId?.length
                  ? selectedSet.instituteId.map((i) => i.name).join(", ")
                  : "-"}
              </p>
              <p>
                <strong>Created By:</strong>{" "}
                {selectedSet.createdBy?.name || "-"}
              </p>
              <p>
                <strong>Last Updated By:</strong>{" "}
                {selectedSet.lastUpdatedBy?.name || "-"}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(selectedSet.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Updated At:</strong>{" "}
                {new Date(selectedSet.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete One */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg w-96 text-center">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete this Question Set?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSoftDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Bulk Delete */}
      {confirmBulkDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg w-96 text-center">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete {selectedIds.length} Question
              Sets?
            </h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmBulkDelete(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleBulkDelete(); // ✅ call delete function
                  setConfirmBulkDelete(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Clone Question Set</h3>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Enter new name"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              />
              <input
                type="text"
                placeholder="Enter new code"
                value={cloneCode}
                onChange={(e) => setCloneCode(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              />
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowCloneModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={!cloneName || !cloneCode}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Clone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionSets;

import React, { useEffect, useState } from "react";
import { api } from "../../api/axiosInstance"; 
import {
  Search,
  Power,
  Eye,
  FileText,
  Calendar
} from "lucide-react";
import { FaPlus } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Test {
  _id: string;
  name: string;
  code: string;
  description: string;
  sections?: any[];
  isActive: boolean;
  createdAt: string;
  createdBy: { _id: string; name: string; email: string };
  lastUpdatedBy: { _id: string; name: string; email: string };
}

const Tests: React.FC = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("active");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Column selector dropdown
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Columns toggle (defaults)
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name", "code", "description", "createdBy", "createdAt"
  ]);

  // View Modal
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const navigate = useNavigate();

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/test/all");
      // Ensure data is always an array
      const data = Array.isArray(res.data) ? res.data : res.data.tests || [];
      setTests(data);
    } catch (err) {
      toast.error("Failed to load tests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/test/update/${id}`, {
        isActive: !currentStatus,
      });
      toast.success(`Test ${!currentStatus ? "activated" : "deactivated"}`);
      fetchTests();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Apply Search + Filters
  const filtered = tests.filter((test) => {
    const matchesSearch =
      test.name.toLowerCase().includes(searchText.toLowerCase()) ||
      test.code?.toLowerCase().includes(searchText.toLowerCase()) ||
      test.description?.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && test.isActive) ||
      (filterStatus === "inactive" && !test.isActive);

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const allColumns = [
    { key: "name", label: "Test Name" },
    { key: "code", label: "Test Code" },
    { key: "description", label: "Description" },
    { key: "createdBy", label: "Created By" },
    { key: "lastUpdatedBy", label: "Last Updated By" },
    { key: "createdAt", label: "Created At" },
    { key: "sectionsCount", label: "Sections" },
  ];

  const resetFilters = () => {
    setSearchText("");
    setFilterStatus("all");
    setRowsPerPage(25);
    setCurrentPage(1);
    setVisibleColumns(["name", "code", "description", "createdBy", "createdAt"]);
  };

  return (
    <div className="space-y-6 fade-in p-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-t-xl border shadow-md flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Tests</h1>
            <FileText size={32} className="text-gray-800" />
          </div>
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
            {/* Add Test */}
            <Link
              to="/tests"
              className="inline-flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-all"
            >
              <FaPlus size={20} />
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
            >
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {/* Left-aligned controls */}
                <div className="relative w-full md:w-60">
                  <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search tests..."
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="input input-bordered pl-9 w-full"
                  />
                </div>
                <select
                  className="input input-bordered w-40"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value as "all" | "active" | "inactive");
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  className="input input-bordered w-40"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[25, 50, 75, 100].map((count) => (
                    <option key={count} value={count}>
                      {count} per page
                    </option>
                  ))}
                </select>

                {/* Right-aligned controls */}
                <div className="flex gap-4 ml-auto">
                  <div className="relative">
                    <button
                      onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                      Select Columns ▼
                    </button>
                    {showColumnDropdown && (
                      <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        {allColumns.map((col) => (
                          <label key={col.key} className="flex items-center gap-2 text-sm py-1">
                            <input
                              type="checkbox"
                              checked={visibleColumns.includes(col.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setVisibleColumns([...visibleColumns, col.key]);
                                } else {
                                  setVisibleColumns(visibleColumns.filter((c) => c !== col.key));
                                }
                              }}
                            />
                            {col.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-lg border border-gray-200 bg-white">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm">
            <tr>
              {allColumns
                .filter((col) => visibleColumns.includes(col.key))
                .map((col) => (
                  <th key={col.key} className="px-6 py-4 font-semibold">
                    {col.label}
                  </th>
                ))}
              <th className="px-6 py-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="text-center py-10 text-gray-500 text-base font-medium">
                  Loading tests...
                </td>
              </tr>
            ) : paginated.length > 0 ? (
              paginated.map((test) => (
                <tr
                  key={test._id}
                  className="group hover:bg-blue-50 transition-all cursor-pointer"
                  onClick={() => navigate(`/tests/edit/${test._id}`)}
                >
                  {allColumns
                    .filter((col) => visibleColumns.includes(col.key))
                    .map((col) => (
                      <td key={col.key} className="px-6 py-4 text-gray-700">
                        {col.key === "name" ? (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{test.name}</span>
                          </div>
                        ) : col.key === "createdAt" ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(test.createdAt).toLocaleDateString()}
                          </div>
                        ) : col.key === "createdBy" || col.key === "lastUpdatedBy" ? (
                          test[col.key as "createdBy" | "lastUpdatedBy"]?.name || "-"
                        ) : col.key === "sectionsCount" ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {test.sections?.length || 0} sections
                          </span>
                        ) : col.key === "description" ? (
                          <span className="truncate max-w-xs block" title={test.description}>
                            {test.description || "-"}
                          </span>
                        ) : (
                          (test as any)[col.key] || "-"
                        )}
                      </td>
                    ))}
                  <td
                    className="px-6 py-4 flex items-center justify-center gap-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* View */}
                    <button
                      onClick={() => setSelectedTest(test)}
                      className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 shadow-md transition"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    {/* Edit */}
                    {/* <Link
                      to={`/tests/edit/${test._id}`}
                      className="p-2 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 shadow-md transition"
                      title="Edit Test"
                    >
                      <FiEdit size={18} />
                    </Link> */}
                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggleActive(test._id, test.isActive)}
                      className={`p-2 rounded-full transition shadow-md ${test.isActive
                          ? "bg-green-100 text-green-600 hover:bg-green-200"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                      title={test.isActive ? "Deactivate Test" : "Activate Test"}
                    >
                      <Power className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="text-center py-10 text-gray-500 text-base font-medium">
                  No tests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 
                  bg-white border border-gray-200 shadow-md rounded-b-xl mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className={`px-3 py-1 rounded-md text-sm font-medium border shadow-sm
        ${currentPage === 1
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-blue-600 bg-gray-50 hover:bg-blue-100"
              }`}
          >
            Prev
          </button>
          <div className="flex gap-2">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              let page;
              if (totalPages <= 10) {
                page = i + 1;
              } else if (currentPage <= 5) {
                page = i + 1;
              } else if (currentPage >= totalPages - 4) {
                page = totalPages - 9 + i;
              } else {
                page = currentPage - 4 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md text-sm font-medium border shadow-sm transition
            ${currentPage === page
                      ? "bg-blue-600 text-white shadow"
                      : "bg-gray-50 text-gray-700 hover:bg-blue-100"
                    }`}
                >
                  {page}
                </button>
              );
            })}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className={`px-3 py-1 rounded-md text-sm font-medium border shadow-sm
        ${currentPage === totalPages
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-blue-600 bg-gray-50 hover:bg-blue-100"
              }`}
          >
            Next
          </button>
        </div>
      )}

      {/* View Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-800">{selectedTest.name}</h2>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Test Code:</label>
                  <p className="text-gray-800">{selectedTest.code}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Status:</label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${selectedTest.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                    }`}>
                    {selectedTest.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Created By:</label>
                  <p className="text-gray-800">{selectedTest.createdBy?.name || "-"}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Sections:</label>
                  <p className="text-gray-800">{selectedTest.sections?.length || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Created At:</label>
                  <p className="text-gray-800">{new Date(selectedTest.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Last Updated By:</label>
                  <p className="text-gray-800">{selectedTest.lastUpdatedBy?.name || "-"}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Description:</label>
              <p className="text-gray-800 mt-1">{selectedTest.description || "No description provided"}</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setSelectedTest(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
              <Link
                to={`/tests/edit/${selectedTest._id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                onClick={() => setSelectedTest(null)}
              >
                Edit Test
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;
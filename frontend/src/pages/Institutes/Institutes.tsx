import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Mail,
  Power,
  X,
  Search
} from 'lucide-react';
import { FaPlus } from "react-icons/fa6";
import { FiEdit, FiInfo } from "react-icons/fi";
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Institute {
  _id: string;
  name: string;
  code: string;
  email: string;
  address: string;
  contact: string;
  location: string;
  subscriptionType: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}


const Institutes = () => {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);

  // 🔍 Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // 📄 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  const fetchInstitutes = async () => {
    try {
      const res = await axios.get('http://localhost:7071/api/institutes');
      setInstitutes(res.data.institutes);
    } catch (error) {
      console.error('Failed to fetch institutes', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(`http://localhost:7071/api/institutes/${id}`, {
        isActive: !currentStatus,
      });
      toast.success(`Marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
      fetchInstitutes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // ✅ Apply Search & Filter
  const filteredInstitutes = institutes.filter((inst) => {
    const matchesSearch =
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'active' && inst.isActive) ||
      (statusFilter === 'inactive' && !inst.isActive);

    return matchesSearch && matchesFilter;
  });

  // 🔢 Pagination logic
  const totalPages = Math.ceil(filteredInstitutes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInstitutes = filteredInstitutes.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="px-4 md:px-10 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          Institutes
        </h1>
        <Link
          to="/institutes/create"
          className="inline-flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-all"
          title="Add Institute"
        >
          <FaPlus size={20} />
        </Link>

      </div>

      {/* 🔍 Search + Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, code, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset page
            }}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
            setCurrentPage(1); // reset page
          }}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl shadow-xl border border-gray-200">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-blue-600 text-left text-sm font-semibold text-white">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInstitutes.map((institute, idx) => (
                  <tr
                    key={institute._id}
                    className={`border-t transition cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                      } hover:bg-blue-100`}
                    onClick={() => navigate(`/institutes/${institute._id}/batches`)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-800 align-middle">
                      {institute.name}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      {institute.code || '-'}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-1 text-gray-700 align-middle">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {institute.email || '-'}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${institute.isActive
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                          }`}
                      >
                        {institute.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 flex items-center gap-3 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to={`/institutes/edit/${institute._id}`}
                        className="text-gray-500 hover:text-yellow-500 transition"
                        title="Edit"
                      >
                        <FiEdit size={20}/>
                      </Link>
                      <button
                        onClick={() =>
                          handleToggleActive(institute._id, institute.isActive)
                        }
                        className="text-gray-500 hover:text-red-600 transition"
                        title={institute.isActive ? 'Mark Inactive' : 'Mark Active'}
                      >
                        <Power className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedInstitute(institute)}
                        className="text-gray-500 hover:text-blue-600 transition"
                        title="Show More"
                      >
                        <FiInfo size={20}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedInstitutes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500 align-middle">
                      No institutes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 🔽 Pagination Controls */}
            {totalPages > 1 && (
              <div className="fixed bottom-0 left-0 right-0  py-3 shadow-md">
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => handlePageChange(i + 1)}
                      className={`px-3 py-1 rounded-lg border ${currentPage === i + 1 ? 'bg-blue-600 text-white' : ''
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
        </>
      )}

      {/* Popup Modal */}
      {selectedInstitute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:w-[90%] md:w-[600px] relative animate-fadeIn">
            <button
              onClick={() => setSelectedInstitute(null)}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-red-100 transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {selectedInstitute.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
              <p><strong>Code:</strong> {selectedInstitute.code || '-'}</p>
              <p><strong>Email:</strong> {selectedInstitute.email || '-'}</p>
              <p><strong>Contact:</strong> {selectedInstitute.contact || '-'}</p>
              <p><strong>Location:</strong> {selectedInstitute.location || '-'}</p>
              <p><strong>Capacity:</strong> {selectedInstitute.capacity || '-'}</p>
              <p><strong>Subscription:</strong> {selectedInstitute.subscriptionType || '-'}</p>
              <div className="sm:col-span-2">
                <strong>Address:</strong> {selectedInstitute.address || '-'}
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-400 border-t pt-3">
              Created on: {new Date(selectedInstitute.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Institutes;
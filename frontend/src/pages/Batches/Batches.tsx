import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  PlusCircle,
  Pencil,
  Power,
  Search,
} from 'lucide-react';
import { FaPlus } from "react-icons/fa6";
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import BackButton from '../../components/BackButton';
import { FiEdit } from 'react-icons/fi';

interface Batch {
  _id: string;
  name: string;
  code: string;
  year: string;
  isActive: boolean;
  createdAt: string;
}

const Batches = () => {
  const { instituteId } = useParams();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔍 Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const navigate = useNavigate();

  const fetchBatches = async () => {
    try {
      if (instituteId) {
        localStorage.setItem('selectedInstituteId', instituteId);
      }
      const res = await axios.get(
        `http://localhost:7071/api/batch/institute/${instituteId}`
      );
      setBatches(res.data.batches);
    } catch (error) {
      console.error('Failed to fetch batches', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [instituteId]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(`http://localhost:7071/api/batches/${id}`, {
        isActive: !currentStatus,
      });
      toast.success(`Marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
      fetchBatches();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // ✅ Filtering
  const filteredBatches = batches.filter((batch) => {
    const matchesSearch =
      batch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear =
      !yearFilter || batch.year.includes(yearFilter.trim());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && batch.isActive) ||
      (statusFilter === 'inactive' && !batch.isActive);

    return matchesSearch && matchesYear && matchesStatus;
  });

  return (
    <div className="px-4 md:px-10 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {/* Left Section: Back + Title */}
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
            Batches
          </h1>
        </div>

        {/* Right Section: Add Button */}
        <Link
          to={`/batches/create?instituteId=${instituteId}`}
          className="flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-all"
        >
          <FaPlus size={20} />
        </Link>
      </div>

      {/* 🔍 Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <input
          type="text"
          placeholder={`Year (e.g. ${new Date().getFullYear()})`}
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button
          onClick={() => {
            setSearchQuery('');
            setYearFilter('');
            setStatusFilter('all');
          }}
          className="px-4 py-2 bg-gray-100 text-sm text-gray-700 rounded-md hover:bg-gray-200"
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-xl border border-gray-200">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-blue-600 text-left text-sm font-semibold text-white">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Year</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch, idx) => (
                <tr
                  key={batch._id}
                  className={`border-t transition cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                    } hover:bg-blue-100`}
                  onClick={() => navigate(`/batches/${batch._id}/students`)}
                >
                  <td className="px-6 py-4 font-medium text-gray-800 align-middle">
                    {batch.name}
                  </td>
                  <td className="px-6 py-4 align-middle">{batch.code || '-'}</td>
                  <td className="px-6 py-4 align-middle">{batch.year}</td>
                  <td className="px-6 py-4 align-middle">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${batch.isActive
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                        }`}
                    >
                      {batch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 flex items-center gap-3 align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      to={`/batches/edit/${batch._id}`}
                      className="text-gray-500 hover:text-yellow-500 transition"
                      title="Edit"
                    >
                      <FiEdit size={20}/>
                    </Link>
                    <button
                      onClick={() => handleToggleActive(batch._id, batch.isActive)}
                      className="text-gray-500 hover:text-red-600 transition"
                      title={batch.isActive ? 'Mark Inactive' : 'Mark Active'}
                    >
                      <Power className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Batches;

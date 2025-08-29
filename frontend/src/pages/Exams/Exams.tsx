import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  X,
  Search,
  Edit3,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import ManageExamForm from './ManageExamForm';

interface Exam {
  _id: string;
  name: string;
  examCode: string;
  isActive: boolean;
  createdAt: string;
  instituteId: string[];
}

interface Institute {
  _id: string;
  name: string;
}

const Exams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);

  const [showExamPage, setShowExamPage] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [toggleExam, setToggleExam] = useState<Exam | null>(null);

  const [searchText, setSearchText] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [resExams, resInstitutes] = await Promise.all([
        axios.get('http://localhost:7071/api/exam/all'),
        axios.get('http://localhost:7071/api/institutes'),
      ]);
      setExams(resExams.data.exams || []);
      setInstitutes(resInstitutes.data.institutes || []);
    } catch {
      toast.error('Failed to load exams or institutes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (exam: Exam) => {
    try {
      await axios.put(`/exam/${exam._id}`, { isActive: !exam.isActive });
      toast.success('Status updated');
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesInstitute =
      filterInstitute === 'all' || exam.instituteId.includes(filterInstitute);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && exam.isActive) ||
      (filterStatus === 'inactive' && !exam.isActive);
    return matchesSearch && matchesInstitute && matchesStatus;
  });

  return (
    <div className="space-y-6 fade-in p-6">
      {showExamPage ? (
        <>
          <button
            onClick={() => setShowExamPage(false)}
            className="inline-flex items-center text-blue-600 hover:underline mb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <ManageExamForm
            examToEdit={editExam ?? undefined}
            institutes={institutes}
            onClose={() => {
              setShowExamPage(false);
              fetchData();
            }}
          />
        </>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Exams</h1>
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={() => {
                setEditExam(null);
                setShowExamPage(true);
              }}
            >
              <PlusCircle className="w-5 h-5" />
              Add Exam
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-3 w-full md:w-auto flex-1">
              <div className="relative w-full md:w-60">
                <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="input input-bordered pl-9 w-full"
                />
              </div>

              <select
                className="input input-bordered w-40"
                value={filterInstitute}
                onChange={(e) => setFilterInstitute(e.target.value)}
              >
                <option value="all">All Institutes</option>
                {institutes.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name}
                  </option>
                ))}
              </select>

              <select
                className="input input-bordered w-36"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <button
              className="btn btn-secondary flex items-center gap-2"
              onClick={() => {
                setSearchText('');
                setFilterInstitute('all');
                setFilterStatus('all');
              }}
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl shadow-xl border border-gray-200 mt-4">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-blue-600 text-left text-sm font-semibold text-white">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Exam Code</th>
                  <th className="px-6 py-3">Institute</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.length > 0 ? (
                  filteredExams.map((exam, idx) => (
                    <tr
                      key={exam._id}
                      className={`border-t transition cursor-pointer ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'
                      } hover:bg-blue-50`}
                      onClick={() => navigate(`/exams/${exam._id}/subjects`)}
                    >
                      <td className="px-6 py-4 font-medium text-gray-800">{exam.name}</td>
                      <td className="px-6 py-4">{exam.examCode}</td>
                      <td className="px-6 py-4">
                        {exam.instituteId
                          .map((id) => institutes.find((i) => i._id === id)?.name || 'Unknown')
                          .join(', ')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            exam.isActive
                              ? 'bg-green-100 text-green-700 border border-green-200'
                              : 'bg-red-100 text-red-700 border border-red-200'
                          }`}
                        >
                          {exam.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(exam.createdAt).toLocaleDateString()}
                      </td>
                      <td
                        className="px-6 py-4 flex items-center gap-3"
                        onClick={(e) => e.stopPropagation()} // ✅ Prevent row navigation when clicking action buttons
                      >
                        <button
                          onClick={() => {
                            setEditExam(exam);
                            setShowExamPage(true);
                          }}
                          title="Edit"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => setToggleExam(exam)}
                          title={exam.isActive ? 'Deactivate' : 'Activate'}
                          className={exam.isActive ? 'text-green-600' : 'text-gray-400'}
                        >
                          {exam.isActive ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <XCircle className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No exams found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Toggle Confirm Modal */}
          {toggleExam && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4">
              <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full">
                <h3 className="text-lg font-bold mb-4">
                  {toggleExam.isActive ? 'Deactivate' : 'Activate'} this exam?
                </h3>
                <div className="flex justify-end gap-3">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setToggleExam(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleToggleStatus(toggleExam);
                      setToggleExam(null);
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Exams;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Plus, Edit3, Eye, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useParams, useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';

interface Subject {
  _id: string;
  name: string;
  subjectCode: string;
  isActive: boolean;
  examId: string;
  instituteId?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Exam {
  _id: string;
  name: string;
  examCode: string;
  instituteId?: string[];
}

interface Institute {
  _id: string;
  name: string;
}

const Subjects = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggleSubject, setToggleSubject] = useState<Subject | null>(null);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchData = async () => {
    if (!examId) return;
    try {
      const [examRes, subRes, instRes] = await Promise.all([
        axios.get(`http://localhost:7071/api/exam/${examId}`),
        axios.get(`http://localhost:7071/api/subject/exam/${examId}`),
        axios.get(`http://localhost:7071/api/institutes`),
      ]);

      console.log("examRes.data"+examRes.data);
      setExam(examRes.data);
      setSubjects(subRes.data || []);
      setInstitutes(instRes.data.institutes || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [examId]);

  const handleToggleStatus = async (subject: Subject) => {
    try {
      await axios.put(`/subject/${subject._id}`, { isActive: !subject.isActive });
      toast.success('Status updated');
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = subject.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesInstitute =
      filterInstitute === 'all' || subject.instituteId?.includes(filterInstitute);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && subject.isActive) ||
      (filterStatus === 'inactive' && !subject.isActive);
    return matchesSearch && matchesInstitute && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <BackButton />

      {exam && (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-6 rounded-xl shadow-md text-white">
          <h2 className="text-3xl font-bold">{exam.name}</h2>
          <p className="text-sm mt-1 opacity-90">
            Exam Code: <span className="font-mono">{exam.examCode}</span>
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Subjects</h1>
        <button
          onClick={() => navigate(`/exams/${examId}/subjects/add`)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Subject
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full md:w-60">
            <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search subjects..."
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

      {/* Subjects */}
      {loading ? (
        <p className="text-center text-gray-500">Loading subjects...</p>
      ) : filteredSubjects.length === 0 ? (
        <p className="text-center text-gray-500">No subjects found for this exam.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject._id}
              className="bg-white p-5 rounded-lg border shadow hover:shadow-lg transition"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-800">{subject.name}</h2>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => navigate(`/exams/${examId}/subjects/add?edit=${subject._id}`)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setToggleSubject(subject)}
                    className={`rounded-full p-1 ${
                      subject.isActive ? 'text-green-600' : 'text-gray-400'
                    }`}
                    title={subject.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {subject.isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-1">Code: {subject.subjectCode}</p>

              <div className="mt-3 text-[11px] text-gray-500 space-y-1 leading-tight">
                <div>
                  <span className="font-semibold text-gray-600">Created:</span>{' '}
                  {new Date(subject.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Updated:</span>{' '}
                  {new Date(subject.updatedAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-semibold text-gray-600">By:</span>{' '}
                  <span className="truncate">{subject.createdBy}</span>
                </div>
              </div>

              <div className="mt-3">
                <Link
                  to={`/subjects/${subject._id}/chapters`}
                  className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Chapters
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toggle Confirmation */}
      {toggleSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 px-4">
          <div className="bg-white p-6 rounded-lg shadow max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">
              {toggleSubject.isActive ? 'Deactivate' : 'Activate'} this subject?
            </h3>
            <div className="flex justify-end gap-3">
              <button className="btn btn-secondary" onClick={() => setToggleSubject(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleToggleStatus(toggleSubject);
                  setToggleSubject(null);
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

export default Subjects;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface Institute {
  _id: string;
  name: string;
}

interface ExamPayload {
  name: string;
  examCode: string;
  createdBy?: string;
  instituteId?: string[];
}

interface Props {
  examToEdit?: {
    _id: string;
    name: string;
    examCode: string;
    instituteId: string[];
  };
  institutes: Institute[];
  onClose: () => void;
}

const ManageExamForm: React.FC<Props> = ({ examToEdit, institutes, onClose }) => {
  const { user } = useAuth();
  const [examName, setExamName] = useState('');
  const [examCode, setExamCode] = useState('');
  const [instituteIds, setInstituteIds] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (examToEdit) {
      setExamName(examToEdit.name);
      setExamCode(examToEdit.examCode);
      setInstituteIds(examToEdit.instituteId || []);
    }
  }, [examToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!examName.trim() || !examCode.trim()) {
      toast.error('Exam name and code are required');
      return;
    }

    const payload: ExamPayload = {
      name: examName.trim(),
      examCode: examCode.trim(),
      createdBy: user?.id,
      instituteId: instituteIds.length > 0 ? instituteIds : undefined,
    };

    try {
      setLoading(true);
      if (examToEdit) {
        await axios.put(`/exam/${examToEdit._id}`, payload);
        toast.success('Exam updated successfully');
      } else {
        await axios.post('/exam/create', payload);
        toast.success('Exam created successfully');
      }
      onClose();
      setExamName('');
      setExamCode('');
      setInstituteIds([]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredInstitutes = institutes.filter((inst) =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-gray-200 max-w-xl mx-auto"
    >
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
        {examToEdit ? 'Edit Exam' : 'Create New Exam'}
      </h2>

      {/* Exam Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Exam Name</label>
        <input
          type="text"
          placeholder="Enter exam name"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
        />
      </div>

      {/* Exam Code */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Exam Code</label>
        <input
          type="text"
          placeholder="Enter unique exam code"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          value={examCode}
          onChange={(e) => setExamCode(e.target.value)}
        />
      </div>

      {/* Institutes Dropdown */}
      <div className="space-y-2 relative">
        <label className="block text-sm font-medium text-gray-700">
          Institutes (Optional)
        </label>
        <div
          className="w-full px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {instituteIds.length > 0
            ? `${instituteIds.length} selected`
            : '— Select Institutes —'}
        </div>

        {dropdownOpen && (
          <div className="absolute mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
            {/* Search */}
            <input
              className="w-full px-3 py-2 border-b text-sm outline-none"
              placeholder="Search institute..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="max-h-48 overflow-y-auto">
              {/* None */}
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                onClick={() => {
                  setInstituteIds([]);
                  setDropdownOpen(false);
                }}
              >
                <input type="checkbox" checked={instituteIds.length === 0} readOnly />
                None
              </div>

              {/* Select All */}
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                onClick={() => {
                  if (instituteIds.length === institutes.length) {
                    setInstituteIds([]);
                  } else {
                    setInstituteIds(institutes.map((i) => i._id));
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={instituteIds.length === institutes.length}
                  readOnly
                />
                Select All
              </div>

              {/* Institutes */}
              {filteredInstitutes.map((inst) => (
                <div
                  key={inst._id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                  onClick={() => {
                    if (instituteIds.includes(inst._id)) {
                      setInstituteIds((prev) => prev.filter((id) => id !== inst._id));
                    } else {
                      setInstituteIds((prev) => [...prev, inst._id]);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={instituteIds.includes(inst._id)}
                    readOnly
                  />
                  {inst.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button Centered */}
      <div className="flex justify-center pt-4">
        <button
          type="submit"
          className="px-8 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : examToEdit ? 'Update Exam' : 'Create Exam'}
        </button>
      </div>
    </form>
  );
};

export default ManageExamForm;
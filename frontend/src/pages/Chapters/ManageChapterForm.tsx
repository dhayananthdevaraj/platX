import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; // ✅ Import your Auth Context

interface Institute {
  _id: string;
  name: string;
}

interface Chapter {
  _id?: string;
  name: string;
  chapterCode: string;
  subjectId: string;
  examId: string;
  instituteId?: string[];
  createdBy?: string;
}

interface Subject {
  _id: string;
  name: string;
  examId: string; // ✅ Needed for chapter creation
  instituteId?: string[];
}

interface Props {
  subject: Subject;
  chapterToEdit?: Chapter | null;
  onSuccess: (chapter: Chapter) => void;
  onClose: () => void;
}

const ManageChapterForm: React.FC<Props> = ({ subject, chapterToEdit, onSuccess, onClose }) => {
  const { user } = useAuth(); // ✅ Get logged-in user
  const [name, setName] = useState(chapterToEdit?.name || '');
  const [chapterCode, setChapterCode] = useState(chapterToEdit?.chapterCode || '');
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [selectedInstitutes, setSelectedInstitutes] = useState<string[]>(chapterToEdit?.instituteId || []);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (subject.instituteId && subject.instituteId.length > 0) {
      const fetchInstitutes = async () => {
        try {
          const res = await axios.get('/institutes');
          const subjectInstitutes = res.data.institutes.filter((inst: Institute) =>
            subject.instituteId?.includes(inst._id)
          );
          setInstitutes(subjectInstitutes);
        } catch {
          toast.error('Failed to load institutes');
        }
      };
      fetchInstitutes();
    }
  }, [subject]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleInstitute = (instituteId: string) => {
    setSelectedInstitutes((prev) =>
      prev.includes(instituteId)
        ? prev.filter((id) => id !== instituteId)
        : [...prev, instituteId]
    );
  };

  const handleSelectAll = () => {
    const ids = filteredInstitutes.map((i) => i._id);
    if (selectedInstitutes.length === ids.length) {
      setSelectedInstitutes([]);
    } else {
      setSelectedInstitutes(ids);
    }
  };

  const filteredInstitutes = institutes.filter((inst) =>
    inst.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Chapter Name is required');
    if (!chapterCode.trim()) return toast.error('Chapter Code is required');

    const payload: Chapter = {
      name: name.trim(),
      chapterCode: chapterCode.trim(),
      subjectId: subject._id,
      examId: subject.examId, // ✅ Send examId from subject
      createdBy: user?.id,    // ✅ Current user id
    };

    if (subject.instituteId && subject.instituteId.length > 0 && selectedInstitutes.length > 0) {
      payload.instituteId = selectedInstitutes;
    }

    try {
      const res = chapterToEdit
        ? await axios.put(`/chapter/update/${chapterToEdit._id}`, payload)
        : await axios.post('/chapter/create', payload);

      toast.success(`Chapter ${chapterToEdit ? 'updated' : 'created'} successfully`);
      onSuccess(res.data.chapter || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save chapter');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Chapter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input input-bordered w-full"
      />

      <input
        type="text"
        placeholder="Chapter Code"
        value={chapterCode}
        onChange={(e) => setChapterCode(e.target.value)}
        className="input input-bordered w-full"
      />

      {subject.instituteId && subject.instituteId.length > 0 && (
        <div>
          <label className="block text-sm text-gray-700 mb-1">Select Institutes</label>
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              className="input input-bordered w-full flex justify-between items-center"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {selectedInstitutes.length > 0
                ? `${selectedInstitutes.length} selected`
                : 'Select Institutes'}
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow p-3 max-h-60 overflow-auto space-y-2">
                <input
                  type="text"
                  placeholder="Search institutes..."
                  className="input input-bordered w-full mb-2"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedInstitutes.length === filteredInstitutes.length &&
                      filteredInstitutes.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                  <span className="font-medium">Select All</span>
                </label>

                {filteredInstitutes.map((institute) => (
                  <label key={institute._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedInstitutes.includes(institute._id)}
                      onChange={() => toggleInstitute(institute._id)}
                    />
                    <span>{institute.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn btn-outline">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {chapterToEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default ManageChapterForm;

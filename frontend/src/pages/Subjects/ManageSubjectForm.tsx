// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import toast from 'react-hot-toast';
// import { useAuth } from '../../contexts/AuthContext';

// interface Props {
//   exam: any;
//   subjectToEdit: any;
//   onSuccess: (subject: any) => void;
//   onClose: () => void;
// }

// const ManageSubjectForm: React.FC<Props> = ({ exam, subjectToEdit, onSuccess, onClose }) => {
//   const { user } = useAuth();
//   const [name, setName] = useState(subjectToEdit?.name || '');
//   const [instituteId, setInstituteId] = useState(subjectToEdit?.instituteId?.[0] || exam?.instituteId?.[0] || '');
//   const [institutes, setInstitutes] = useState<any[]>([]);

//   useEffect(() => {
//     const fetchInstitutes = async () => {
//       try {
//         const res = await axios.get('/institutes');
//         setInstitutes(res.data.institutes || []);
//       } catch {
//         toast.error('Failed to load institutes');
//       }
//     };
//     fetchInstitutes();
//   }, []);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!name.trim()) return toast.error('Name is required');

//     const payload: any = {
//       name: name.trim(),
//       examId: exam._id,
//       createdBy: user?.id,
//     };

//     // Add instituteId if exam has institute binding
//     if (exam?.instituteId?.length > 0) {
//       if (!instituteId) return toast.error('Institute is required');
//       payload.instituteId = [instituteId];
//     }

//     try {
//       const res = subjectToEdit
//         ? await axios.put(`/subject/${subjectToEdit._id}`, payload)
//         : await axios.post('/subject/create', payload);

//       toast.success(`Subject ${subjectToEdit ? 'updated' : 'created'} successfully`);
//       onSuccess(res.data.subject || res.data); // for both POST and PUT responses
//     } catch (err: any) {
//       toast.error(err.response?.data?.message || 'Operation failed');
//     }
//   };

//   const getInstituteName = (id: string) =>
//     institutes.find((inst) => inst._id === id)?.name || 'Unknown Institute';

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <input
//         type="text"
//         className="input input-bordered w-full"
//         placeholder="Subject Name"
//         value={name}
//         onChange={(e) => setName(e.target.value)}
//       />

//       {exam?.instituteId?.length > 0 && (
//         <div>
//           <label className="block text-sm text-gray-700 mb-1">Institute</label>
//           <input
//             type="text"
//             className="input input-bordered w-full bg-gray-100 cursor-not-allowed"
//             value={getInstituteName(instituteId)}
//             disabled
//           />
//         </div>
//       )}

//       <div className="flex justify-end gap-3 pt-2">
//         <button type="button" onClick={onClose} className="btn btn-outline">
//           Cancel
//         </button>
//         <button type="submit" className="btn btn-primary">
//           {subjectToEdit ? 'Update' : 'Create'}
//         </button>
//       </div>
//     </form>
//   );
// };

// export default ManageSubjectForm;
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown } from 'lucide-react';

interface Institute {
  _id: string;
  name: string;
}

interface Subject {
  _id?: string;
  name: string;
  subjectCode: string;
  examId: string;
  instituteId?: string[];
  createdBy?: string;
}

interface Exam {
  _id: string;
  name: string;
  examCode: string;
  instituteId?: string[];
}

interface Props {
  exam: Exam;
  subjectToEdit?: Subject | null;
  onSuccess: (subject: Subject) => void;
  onClose: () => void;
}

const ManageSubjectForm: React.FC<Props> = ({ exam, subjectToEdit, onSuccess, onClose }) => {
  const { user } = useAuth();
  const [name, setName] = useState(subjectToEdit?.name || '');
  const [subjectCode, setSubjectCode] = useState(subjectToEdit?.subjectCode || '');
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [selectedInstitutes, setSelectedInstitutes] = useState<string[]>(subjectToEdit?.instituteId || []);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const res = await axios.get('/institutes');
        setInstitutes(res.data.institutes || []);
      } catch {
        toast.error('Failed to load institutes');
      }
    };
    fetchInstitutes();
  }, []);

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

  const filteredInstitutes = institutes.filter(
    (inst) => exam.instituteId?.includes(inst._id) &&
      inst.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Subject Name is required');
    if (!subjectCode.trim()) return toast.error('Subject Code is required');

    const payload: Subject = {
      name: name.trim(),
      subjectCode: subjectCode.trim(),
      examId: exam._id,
      createdBy: user?.id,
    };

    if (exam.instituteId && exam.instituteId.length > 0) {
      if (selectedInstitutes.length === 0) return toast.error('Select at least one institute');
      payload.instituteId = selectedInstitutes;
    }

    try {
      const res = subjectToEdit
        ? await axios.put(`/subject/${subjectToEdit._id}`, payload)
        : await axios.post('/subject/create', payload);

      toast.success(`Subject ${subjectToEdit ? 'updated' : 'created'} successfully`);
      onSuccess(res.data.subject || res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        className="input input-bordered w-full"
        placeholder="Subject Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="text"
        className="input input-bordered w-full"
        placeholder="Subject Code"
        value={subjectCode}
        onChange={(e) => setSubjectCode(e.target.value)}
      />

      {exam.instituteId && exam.instituteId.length > 0 && (
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

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn btn-outline">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {subjectToEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default ManageSubjectForm;

import React, { useState, useEffect } from 'react';
import UploadSubjectExcel from './UploadSubjectExcel';
import ManageSubjectForm from './ManageSubjectForm';
import BackButton from '../../components/BackButton';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from "../../api/axiosInstance"; 
import toast from 'react-hot-toast';

const AddSubject = () => {
  const [mode, setMode] = useState<'form' | 'excel'>('form');
  const { examId } = useParams<{ examId: string }>();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [subjectToEdit, setSubjectToEdit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examRes, subjectRes] = await Promise.all([
          api.get(`/exam/${examId}`),
          editId ? api.get(`/subject/${editId}`) : Promise.resolve({ data: null }),
        ]);
        setExam(examRes.data);
        setSubjectToEdit(subjectRes.data);
      } catch {
        toast.error('Failed to load exam or subject data');
      } finally {
        setLoading(false);
      }
    };

    if (examId) fetchData();
  }, [examId, editId]);

  if (loading) return <p className="text-center py-10 text-gray-500 text-lg">Loading...</p>;
  if (!exam) return <p className="text-center py-10 text-red-600 text-lg">Exam not found</p>;

  return (
    <div className="max-w-1xl mx-auto px-4 py-4">
      <BackButton />
      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        {editId ? 'Edit Subject' : 'Add Subject'}
      </h1>
      <hr className="my-6 border-gray-300" />


      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setMode('form')}
          className={`px-5 py-2 rounded-lg font-semibold transition ${
            mode === 'form'
              ? 'bg-indigo-600 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          {editId ? 'Edit Form' : 'Add via Form'}
        </button>
        {!editId && (
          <button
            onClick={() => setMode('excel')}
            className={`px-5 py-2 rounded-lg font-semibold transition ${
              mode === 'excel'
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Upload Excel
          </button>
        )}
      </div>

      {/* No card here, direct content */}
      {mode === 'form' ? (
        <ManageSubjectForm
          exam={exam}
          subjectToEdit={subjectToEdit}
          onSuccess={() => navigate(-1)}
          onClose={() => navigate(-1)}
        />
      ) : (
        <UploadSubjectExcel examId={examId} />
      )}
    </div>
  );
};

export default AddSubject;

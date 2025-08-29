import React, { useEffect, useState } from 'react';
import UploadChapterExcel from './UploadChapterExcel';
import ManageChapterForm from './ManageChapterForm';
import BackButton from '../../components/BackButton';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddChapter = () => {
  const [mode, setMode] = useState<'form' | 'excel'>('form');
  const { subjectId } = useParams<{ subjectId: string }>();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [chapterToEdit, setChapterToEdit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectRes, chapterRes] = await Promise.all([
          axios.get(`/subject/${subjectId}`),
          editId ? axios.get(`/chapter/${editId}`) : Promise.resolve({ data: null }),
        ]);
        setSubject(subjectRes.data);
        setChapterToEdit(chapterRes.data);
      } catch {
        toast.error('Failed to load subject or chapter');
      } finally {
        setLoading(false);
      }
    };

    if (subjectId) fetchData();
  }, [subjectId, editId]);

  if (loading) return <p className="text-center">Loading...</p>;
  if (!subject) return <p className="text-center text-red-600">Subject not found</p>;

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-semibold mb-4">
        {editId ? 'Edit Chapter' : 'Add Chapter'}
      </h1>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setMode('form')}
          className={`btn ${mode === 'form' ? 'btn-primary' : 'btn-outline'}`}
        >
          {editId ? 'Edit Form' : 'Add via Form'}
        </button>
        {!editId && (
          <button
            onClick={() => setMode('excel')}
            className={`btn ${mode === 'excel' ? 'btn-primary' : 'btn-outline'}`}
          >
            Upload Excel
          </button>
        )}
      </div>

      {mode === 'form' ? (
        <ManageChapterForm
          subject={subject}
          chapterToEdit={chapterToEdit}
          onSuccess={() => navigate(-1)}
          onClose={() => navigate(-1)}
        />
      ) : (
        <UploadChapterExcel subjectId={subjectId} />
      )}
    </div>
  );
};

export default AddChapter;

// import React, { useEffect, useState } from 'react';
// import UploadChapterExcel from './UploadChapterExcel';
// import ManageChapterForm from './ManageChapterForm';
// import BackButton from '../../components/BackButton';
// import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import toast from 'react-hot-toast';

// const AddChapter = () => {
//   const [mode, setMode] = useState<'form' | 'excel'>('form');
//   const { subjectId } = useParams<{ subjectId: string }>();
//   const [searchParams] = useSearchParams();
//   const editId = searchParams.get('edit');
//   const navigate = useNavigate();

//   const [subject, setSubject] = useState(null);
//   const [chapterToEdit, setChapterToEdit] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         let subjectRes;
//         let chapterRes = { data: null };

//         if (editId) {
//           // First fetch chapter by editId
//           chapterRes = await axios.get(`/chapter/${editId}`);
//           // Then fetch subject using chapter's subjectId
//           subjectRes = await axios.get(`/subject/${chapterRes.data.subjectId}`);
//         } else {
//           // Add mode: fetch subject from URL param
//           subjectRes = await axios.get(`/subject/${subjectId}`);
//         }

//         setSubject(subjectRes.data);
//         setChapterToEdit(chapterRes.data);
//       } catch {
//         toast.error('Failed to load subject or chapter');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [subjectId, editId]);

//   if (loading) return <p className="text-center">Loading...</p>;
//   if (!subject) return <p className="text-center text-red-600">Subject not found</p>;

//   return (
//     <div>
//       <BackButton />
//       <h1 className="text-2xl font-semibold mb-4">
//         {editId ? 'Edit Chapter' : 'Add Chapter'}
//       </h1>

//       <div className="flex space-x-4 mb-6">
//         <button
//           onClick={() => setMode('form')}
//           className={`btn ${mode === 'form' ? 'btn-primary' : 'btn-outline'}`}
//         >
//           {editId ? 'Edit Form' : 'Add via Form'}
//         </button>
//         {!editId && (
//           <button
//             onClick={() => setMode('excel')}
//             className={`btn ${mode === 'excel' ? 'btn-primary' : 'btn-outline'}`}
//           >
//             Upload Excel
//           </button>
//         )}
//       </div>

//       {mode === 'form' ? (
//         <ManageChapterForm
//           subject={subject}
//           chapterToEdit={chapterToEdit}
//           onSuccess={() => navigate(-1)}
//           onClose={() => navigate(-1)}
//         />
//       ) : (
//         <UploadChapterExcel subjectId={subjectId} />
//       )}
//     </div>
//   );
// };

// export default AddChapter;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/BackButton';
import ManageStudentForm from './ManageStudentForm';
import UploadStudentExcel from './UploadStudentExcel';

const AddStudent = () => {
  const [mode, setMode] = useState<'form' | 'excel'>('form');
  const navigate = useNavigate();

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-semibold mb-4">Add Student</h1>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setMode('form')}
          className={`btn ${mode === 'form' ? 'btn-primary' : 'btn-outline'}`}
        >
          Add via Form
        </button>
        <button
          onClick={() => setMode('excel')}
          className={`btn ${mode === 'excel' ? 'btn-primary' : 'btn-outline'}`}
        >
          Upload Excel
        </button>
      </div>

      {mode === 'form' ? <ManageStudentForm /> : <UploadStudentExcel />}
    </div>
  );
};

export default AddStudent;

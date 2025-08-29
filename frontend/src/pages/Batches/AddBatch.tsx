import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import UploadBatchExcel from './UploadBatchExcel';
import ManageBatchForm from './ManageBatchForm';
import BackButton from '../../components/BackButton';

const AddBatch = () => {
  const instituteId  = localStorage.getItem("selectedInstituteId");
  const [mode, setMode] = useState<'form' | 'excel'>('form');

  return (
    <div>
      <BackButton />
      <h1 className="text-2xl font-semibold mb-4">Add Batch</h1>

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

      {mode === 'form' ? (
        <ManageBatchForm />
      ) : instituteId ? (
        <UploadBatchExcel instituteId={instituteId} />
      ) : (
        <p className="text-red-600">Missing institute ID.</p>
      )}
    </div>
  );
};

export default AddBatch;

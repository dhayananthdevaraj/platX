import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

interface BatchFormData {
  name: string;
  code: string;
  year: string;
  isActive: boolean;
}

const initialFormData: BatchFormData = {
  name: '',
  code: '',
  year: new Date().getFullYear().toString(),
  isActive: true
};

interface Props {
  instituteId?: string | null;
}

const ManageBatchForm: React.FC<Props> = ({ instituteId }) => {
  const { id } = useParams(); // for edit
  const [searchParams] = useSearchParams();
  const instIdFromQuery = searchParams.get('instituteId');

  const navigate = useNavigate();
  const [formData, setFormData] = useState<BatchFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<BatchFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const finalInstituteId = instituteId || instIdFromQuery;
  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      axios
        .get(`http://localhost:7071/api/batches/${id}`)
        .then((res) => setFormData(res.data))
        .catch(() => toast.error('Failed to fetch batch details'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const validate = (): boolean => {
    const newErrors: Partial<BatchFormData> = {};
    if (!formData.name.trim() || formData.name.length < 3)
      newErrors.name = 'Name must be at least 3 characters';
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    if (!/^\d{4}$/.test(formData.year)) newErrors.year = 'Year must be in YYYY format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!localStorage.getItem("selectedInstituteId")) {
      toast.error('Institute ID is missing.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        await axios.put(`http://localhost:7071/api/batches/${id}`, {
          ...formData,
          instituteId: localStorage.getItem("selectedInstituteId")
        });
        toast.success('Batch updated successfully');
      } else {
        console.log("formData", {
          ...formData,
          instituteId: finalInstituteId
        });
        
        await axios.post('http://localhost:7071/api/batch/create', {
          ...formData,
          instituteId: localStorage.getItem("selectedInstituteId")
        });
        toast.success('Batch created successfully');
        setFormData(initialFormData);
      }
      navigate(-1);
    } catch (error: any) {
        console.log("error",error);
        
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        {isEditMode ? 'Edit Batch' : 'Add Batch'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="label">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input"
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Code */}
        <div>
          <label className="label">Code</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="input uppercase"
          />
          {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
        </div>

        {/* Year */}
        <div>
          <label className="label">Year</label>
          <input
            type="text"
            name="year"
            value={formData.year}
            onChange={handleChange}
            placeholder={new Date().getFullYear().toString()}
            className="input"
          />
          {errors.year && <p className="text-sm text-red-600">{errors.year}</p>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <button
          type="submit"
          className="btn btn-primary w-full md:w-auto"
          disabled={submitting}
        >
          {submitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
            ? 'Update Batch'
            : 'Create Batch'}
        </button>

        {isEditMode && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary w-full md:w-auto"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ManageBatchForm;

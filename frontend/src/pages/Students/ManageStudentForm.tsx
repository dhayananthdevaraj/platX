import React, { useEffect, useState } from "react";
import { api } from "../../api/axiosInstance";
import toast from "react-hot-toast";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import FloatingInput from "../../components/FloatingInput";

interface StudentFormData {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: string;
}

const initialFormData: StudentFormData = {
  name: "",
  email: "",
  mobile: "",
  password: "Password@123",
  role: "student",
};

interface Props {
  instituteId?: string | null;
  batchId?: string | null;
}

const ManageStudentForm: React.FC<Props> = ({ instituteId: propInstituteId, batchId: propBatchId }) => {
  const { id } = useParams(); // Edit mode if ID exists
  const [searchParams] = useSearchParams();
  const instIdFromQuery = searchParams.get("instituteId");
  const batchIdFromQuery = searchParams.get("batchId");

  const navigate = useNavigate();

  const [formData, setFormData] = useState<StudentFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<StudentFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const finalInstituteId = propInstituteId || instIdFromQuery || localStorage.getItem("selectedInstituteId");
  const finalBatchId = propBatchId || batchIdFromQuery || localStorage.getItem("selectedBatchId");

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true);
      api
        .get(`/users/${id}`)
        .then((res) => {
          // ensure we only pick needed fields (API may return extra)
          const data = res.data || {};
          setFormData({
            name: data.name || "",
            email: data.email || "",
            mobile: data.mobile || "",
            password: data.password || initialFormData.password,
            role: data.role || "student",
          });
        })
        .catch(() => toast.error("Failed to fetch student details"))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = (): boolean => {
    const newErrors: Partial<StudentFormData> = {};
    if (!formData.name.trim() || formData.name.length < 2) newErrors.name = "Name is required (min 2 chars)";
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Enter a valid email";
    // keep the original format requirement: +91-XXXXXXXXXX
    if (!/^\+91-\d{10}$/.test(formData.mobile)) newErrors.mobile = "Format: +91-XXXXXXXXXX";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if ((errors as any)[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!finalInstituteId || !finalBatchId) {
      toast.error("Missing institute or batch. Please select before proceeding.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEditMode) {
        await api.put(`/users/${id}`, {
          ...formData,
          instituteId: finalInstituteId,
          batchId: finalBatchId,
        });
        toast.success("Student updated successfully");
      } else {
        await api.post("/createUser", {
          ...formData,
          instituteId: finalInstituteId,
          batchId: finalBatchId,
        });
        toast.success("Student created successfully");
        setFormData(initialFormData);
      }
      navigate(-1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-b-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-2">
        {isEditMode ? "Edit Student" : "Add Student"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <FloatingInput name="name" value={formData.name} onChange={handleChange} label="Full Name" />
          {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <FloatingInput type="email" name="email" value={formData.email} onChange={handleChange} label="Email" />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
        </div>

        {/* Mobile */}
        <div>
          <FloatingInput
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            label="Mobile (+91-XXXXXXXXXX)"
            placeholder="+91-XXXXXXXXXX"
          />
          {errors.mobile && <p className="text-sm text-red-600 mt-1">{errors.mobile}</p>}
        </div>

        {/* Password */}
        <div>
          <FloatingInput
            type="text"
            name="password"
            value={formData.password}
            onChange={handleChange}
            label="Password"
          />
        </div>

        {/* Role (kept as select for future extensibility) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          >
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <button
          type="submit"
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-md w-full md:w-auto"
          disabled={submitting}
        >
          {submitting ? (isEditMode ? "Updating..." : "Creating...") : isEditMode ? "Update Student" : "Create Student"}
        </button>

        {isEditMode && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition shadow-md w-full md:w-auto"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ManageStudentForm;

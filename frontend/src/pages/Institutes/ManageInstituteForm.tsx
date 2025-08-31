import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../components/BackButton";
import FloatingInput from "../../components/FloatingInput";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css";
import { GraduationCap } from "lucide-react";

interface FormData {
  name: string;
  code: string;
  email: string;
  address: string;
  contact: string;
  location: string;
  subscriptionType: string;
  capacity: number;
}

const initialFormData: FormData = {
  name: "",
  code: "",
  email: "",
  address: "",
  contact: "",
  location: "",
  subscriptionType: "",
  capacity: 100,
};

const ManageInstituteForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      axios
        .get(`http://localhost:7071/api/institutes/${id}`)
        .then((res) => setFormData(res.data))
        .catch(() => toast.error("Failed to fetch institute details"))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim() || formData.name.length < 3)
      newErrors.name = "Name must be at least 3 characters";
    if (!formData.code.trim()) newErrors.code = "Code is required";
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Valid email is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.contact.trim() || !/^\+\d{6,15}$/.test(formData.contact))
      newErrors.contact = "Enter a valid phone number with country code";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.subscriptionType.trim())
      newErrors.subscriptionType = "Subscription type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));

    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEditMode) {
        await axios.put(`http://localhost:7071/api/institutes/${id}`, formData);
        toast.success("Institute updated successfully");
      } else {
        await axios.post("http://localhost:7071/api/institute/create", formData);
        toast.success("Institute created successfully");
        setFormData(initialFormData);
      }
      navigate("/institutes");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* 🔹 Header section */}
      <div className="bg-white p-5 rounded-t-xl border shadow-md flex items-center gap-3">
        <BackButton />
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          {isEditMode ? "Edit Institute" : "Add Institute"}
        </h2>
      </div>

      {/* 🔹 Form section */}
      <div className="bg-white rounded-b-xl shadow-md p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name */}
            <div>
              <FloatingInput
                name="name"
                value={formData.name}
                onChange={handleChange}
                label="Name"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Code */}
            <div>
              <FloatingInput
                name="code"
                value={formData.code}
                onChange={handleChange}
                label="Code"
              />
              {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
            </div>

            {/* Email */}
            <div>
              <FloatingInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                label="Email"
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
            </div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Contact Number
  </label>
  <PhoneInput
    defaultCountry="in"
    value={formData.contact}
    onChange={(phone) =>
      setFormData((prev) => ({ ...prev, contact: phone }))
    }
    className="w-full"
    inputClassName="!w-full !pl-12 !pr-3 !py-2 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
  />
  {errors.contact && (
    <p className="text-sm text-red-600 mt-1">{errors.contact}</p>
  )}
</div>


            {/* Location */}
            <div>
              <FloatingInput
                name="location"
                value={formData.location}
                onChange={handleChange}
                label="Location"
              />
              {errors.location && (
                <p className="text-sm text-red-600">{errors.location}</p>
              )}
            </div>

          <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Subscription Type
  </label>
  <select
    name="subscriptionType"
    value={formData.subscriptionType}
    onChange={handleChange}
    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
  >
    <option value="">Select</option>
    <option value="basic">Basic</option>
    <option value="pro">Pro</option>
    <option value="enterprise">Enterprise</option>
  </select>
  {errors.subscriptionType && (
    <p className="text-sm text-red-600 mt-1">{errors.subscriptionType}</p>
  )}
</div>


            {/* Capacity */}
            <div>
              <FloatingInput
                type="number"
                name="capacity"
                value={formData.capacity.toString()}
                onChange={handleChange}
                label="Capacity"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <FloatingInput
                name="address"
                value={formData.address}
                onChange={handleChange}
                label="Address"
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-md"
              disabled={submitting}
            >
              {submitting
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Institute"
                : "Create Institute"}
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition shadow-md"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageInstituteForm;

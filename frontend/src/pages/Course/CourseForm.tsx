import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

interface Course {
  _id?: string;
  courseCode: string;
  name: string;
  isActive?: boolean;
}

const API_BASE = "http://localhost:7071/api";

const CourseForm: React.FC = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState<Course>({
    courseCode: "",
    name: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      axios
        .get(`${API_BASE}/course/${id}`)
        .then((res) => setFormData(res.data))
        .catch(() => toast.error("Failed to fetch course"));
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "isActive" ? value === "true" : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await axios.put(`${API_BASE}/course/update/${id}`, formData);
        toast.success("Course updated");
      } else {
        await axios.post(`${API_BASE}/course/create`, formData);
        toast.success("Course created");
      }
      navigate("/courses");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {id ? "✏️ Edit Course" : "➕ Create Course"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 shadow-lg rounded-xl space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Course Code</label>
          <input
            type="text"
            name="courseCode"
            value={formData.courseCode}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Course Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded-lg"
          />
        </div>
        {id && (
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="isActive"
              value={formData.isActive ? "true" : "false"}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Saving..." : id ? "Update Course" : "Create Course"}
        </button>
      </form>
    </div>
  );
};

export default CourseForm;

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Course {
  _id: string;
  courseCode: string;
  name: string;
  isActive: boolean;
}

const API_BASE = "http://localhost:7071/api";

const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${API_BASE}/course/all`);
      setCourses(res.data.courses);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await axios.delete(`${API_BASE}/course/${id}`); // ✅ corrected endpoint
      toast.success("Course deleted");
      fetchCourses();
    } catch {
      toast.error("Failed to delete course");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📚 Courses</h1>
        <Link
          to="/courses/create"
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Add Course
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow">
          <table className="w-full bg-white">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Course Code</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, idx) => (
                <tr
                  key={course._id}
                  className={`border-t cursor-pointer ${
                    idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-gray-100`}
                  onClick={() => navigate(`/courses/${course._id}`)} // ✅ navigate to detail
                >
                  <td className="px-4 py-2">{course.courseCode}</td>
                  <td className="px-4 py-2">{course.name}</td>
                  <td className="px-4 py-2">
                    {course.isActive ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 font-medium">Inactive</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-2 flex space-x-3"
                    onClick={(e) => e.stopPropagation()} // ✅ prevent row click firing
                  >
                    <button
                      onClick={() => navigate(`/courses/edit/${course._id}`)}
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="text-red-600 hover:text-red-800 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    No courses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CourseList;

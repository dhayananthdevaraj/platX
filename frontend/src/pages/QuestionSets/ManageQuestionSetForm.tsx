import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";

interface FormData {
    name: string;
    code: string;
    chapterId: string;
    examId: string;
    subjectId: string;
    instituteId: string[];
    isActive: boolean;
    createdBy?: string | null;
    lastUpdatedBy?: string | null;
}

const initialFormData: FormData = {
    name: "",
    code: "",
    chapterId: "",
    examId: "",
    subjectId: "",
    instituteId: [],
    isActive: true,
};

const ManageQuestionSetForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    const [chapters, setChapters] = useState<any[]>([]);
    const isEditMode = Boolean(id);

    // fetch chapters
    useEffect(() => {
        axios
            .get("http://localhost:7071/api/chapter/all")
            .then((res) => {
                const chapterList = Array.isArray(res.data)
                    ? res.data
                    : res.data.chapters || [];
                setChapters(chapterList);
            })
            .catch(() => toast.error("Failed to load chapters"));
    }, []);

    // fetch data if editing
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            axios
                .get(`http://localhost:7071/api/questionset/${id}`)
                .then((res) => {
                    const data = res.data;
                    setFormData({
                        name: data.name || "",
                        code: data.code || "",
                        chapterId: data.chapterId?._id || "",
                        examId: data.examId?._id || "",
                        subjectId: data.subjectId?._id || "",
                        instituteId: data.instituteId?.map((i: any) => i._id) || [],
                        isActive: data.isActive ?? true,
                    });
                })
                .catch(() => toast.error("Failed to fetch question set details"))
                .finally(() => setLoading(false));
        }
    }, [id]);

    const validate = (): boolean => {
        const newErrors: Partial<FormData> = {};
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.code.trim()) newErrors.code = "Code is required";
        if (!formData.chapterId) newErrors.chapterId = "Chapter is required";
        if (!formData.examId) newErrors.examId = "Exam is required";
        if (!formData.subjectId) newErrors.subjectId = "Subject is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // When selecting chapter → auto fill examId & subjectId
    const handleChapterChange = (selected: any) => {
        if (selected) {
            const chapter = chapters.find((ch) => ch._id === selected.value);
            setFormData((prev) => ({
                ...prev,
                chapterId: selected.value,
                examId: chapter?.examId?._id || "",
                subjectId: chapter?.subjectId?._id || "",
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                chapterId: "",
                examId: "",
                subjectId: "",
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            let userId: string | null = null;
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    userId = parsedUser?.id || parsedUser?._id || null;
                } catch {
                    console.warn("Invalid user object in localStorage");
                }
            }

            if (isEditMode) {
                // Update
                const payload = {
                    ...formData,
                    lastUpdatedBy: userId,
                };
                await axios.put(
                    `http://localhost:7071/api/questionset/update/${id}`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`, // or wherever you store it
                        },
                    }
                );
                toast.success("Question Set updated successfully");
            } else {
                // Create
                const payload = {
                    ...formData,
                    createdBy: userId,
                };
                await axios.post(
                    "http://localhost:7071/api/questionset/create",
                    payload
                );
                toast.success("Question Set created successfully");
                setFormData(initialFormData);
            }
            navigate("/questionsets");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading)
        return <p className="text-center text-gray-500">Loading...</p>;

    const chapterOptions =
        Array.isArray(chapters) && chapters.length > 0
            ? chapters.map((ch) => ({
                value: ch._id,
                label: `${ch.name} - ${ch.subjectId?.name || "N/A"
                    } - ${ch.examId?.name || "N/A"}`,
            }))
            : [];

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-6 rounded shadow"
        >
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
                {isEditMode ? "Edit Question Set" : "Add Question Set"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                    <label className="label">Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="input"
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600">{errors.name}</p>
                    )}
                </div>

                {/* Code */}
                <div>
                    <label className="label">Code</label>
                    <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="input uppercase"
                    />
                    {errors.code && (
                        <p className="text-sm text-red-600">{errors.code}</p>
                    )}
                </div>

                {/* Chapter Dropdown */}
                <div className="col-span-2">
                    <label className="label">Chapter</label>
                    <Select
                        options={chapterOptions}
                        value={chapterOptions.find(
                            (opt) => opt.value === formData.chapterId
                        )}
                        onChange={handleChapterChange}
                        placeholder="Search and select chapter..."
                        isClearable
                        isSearchable
                    />
                    {errors.chapterId && (
                        <p className="text-sm text-red-600">{errors.chapterId}</p>
                    )}
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4"
                    />
                    <label className="label">Active</label>
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
                            ? "Updating..."
                            : "Creating..."
                        : isEditMode
                            ? "Update Question Set"
                            : "Create Question Set"}
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

export default ManageQuestionSetForm;
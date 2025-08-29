import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";


interface QuestionFormData {
    text: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
    marks: number;
    negativeMarks: number;
    questionSetId: string;
    difficulty: "Easy" | "Medium" | "Hard";
    tags: string[];
    isActive: boolean;
}


const ManageQuestionForm: React.FC = () => {
    const { questionSetId, id } = useParams<{ questionSetId?: string; id?: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<QuestionFormData>({
        text: "",
        options: ["", ""],
        correctAnswerIndex: 0,
        explanation: "",
        marks: 1,
        negativeMarks: 0,
        questionSetId: "",
        difficulty: "Medium",
        tags: [],
        isActive: true,
    });

    const [loading, setLoading] = useState(false);


    // ✅ Auto-attach questionSetId if new question
    useEffect(() => {
        if (questionSetId && !id) {
            setFormData((prev) => ({
                ...prev,
                questionSetId,
            }));
        }
    }, [questionSetId, id]);

    // ✅ Fetch Question if editing
    useEffect(() => {
        if (id) {
            setLoading(true);
            axios
                .get(`http://localhost:7071/api/question/${id}`)
                .then((res) => setFormData(res.data))
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [id]);

    // ✅ Handle Input Changes
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
        index?: number
    ) => {
        const { name, value } = e.target;

        if (name === "options" && index !== undefined) {
            const updatedOptions = [...formData.options];
            updatedOptions[index] = value;
            setFormData({ ...formData, options: updatedOptions });
        } else if (name === "tags") {
            setFormData({ ...formData, tags: value.split(",").map((t) => t.trim()) });
        } else if (name === "marks" || name === "negativeMarks") {
            setFormData({ ...formData, [name]: Number(value) });
        } else if (name === "questionSetId") {
            setFormData({ ...formData, questionSetId: value });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // ✅ Set Correct Answer
    const handleCorrectAnswer = (index: number) => {
        setFormData({ ...formData, correctAnswerIndex: index });
    };

    // ✅ Add Option
    const addOption = () => setFormData({ ...formData, options: [...formData.options, ""] });

    // ✅ Remove Option
    const removeOption = (index: number) => {
        if (formData.options.length > 2) {
            const updatedOptions = formData.options.filter((_, i) => i !== index);
            setFormData({
                ...formData,
                options: updatedOptions,
                correctAnswerIndex:
                    formData.correctAnswerIndex >= updatedOptions.length ? 0 : formData.correctAnswerIndex,
            });
        }
    };

    // ✅ Submit Form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const token = localStorage.getItem("accessToken");

            if (!user.id) {
                throw new Error("User ID not found in localStorage");
            }

            const body = {
                ...formData,
                createdBy: user.id,   // ✅ Add userId
                lastUpdatedBy: user.id // ✅ Add userId
            };

            if (id) {
                // Update question
                await axios.put(`http://localhost:7071/api/question/update/${id}`, body, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                // Create new question
                await axios.post(`http://localhost:7071/api/question/create`, body, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            navigate(`/questions/${formData.questionSetId}`);
        } catch (err) {
            console.error("Error saving question:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="p-6 bg-white shadow rounded-xl">
            <h2 className="text-2xl font-bold mb-4">{id ? "Edit Question" : "Add Question"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Difficulty */}
                <div>
                    <label className="block font-semibold mb-1">Difficulty</label>
                    <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>

                {/* Question Text */}
                <div>
                    <label className="block font-semibold mb-1">Question</label>
                    <textarea
                        name="text"
                        value={formData.text}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                        required
                    />
                </div>

                {/* Options with radio for correct answer */}
                <div>
                    <label className="block font-semibold mb-1">Options</label>
                    {formData.options.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-2">
                            <input
                                type="radio"
                                name="correctAnswer"
                                checked={formData.correctAnswerIndex === idx}
                                onChange={() => handleCorrectAnswer(idx)}
                            />
                            <input
                                type="text"
                                name="options"
                                value={opt}
                                onChange={(e) => handleChange(e, idx)}
                                className="flex-1 border p-2 rounded"
                                required
                            />
                            {formData.options.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => removeOption(idx)}
                                    className="px-2 py-1 bg-red-500 text-white rounded"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addOption}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
                    >
                        + Add Option
                    </button>
                </div>

                {/* Explanation */}
                <div>
                    <label className="block font-semibold mb-1">Explanation</label>
                    <textarea
                        name="explanation"
                        value={formData.explanation}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />
                </div>

                {/* Marks & Negative Marks */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-semibold mb-1">Marks</label>
                        <input
                            type="number"
                            name="marks"
                            value={formData.marks}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-semibold mb-1">Negative Marks</label>
                        <input
                            type="number"
                            name="negativeMarks"
                            value={formData.negativeMarks}
                            onChange={handleChange}
                            className="w-full border p-2 rounded"
                        />
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block font-semibold mb-1">Tags (comma separated)</label>
                    <input
                        type="text"
                        name="tags"
                        value={formData.tags.join(", ")}
                        onChange={handleChange}
                        className="w-full border p-2 rounded"
                    />
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <label>Active</label>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
                >
                    {id ? "Update Question" : "Create Question"}
                </button>
            </form>
        </div>
    );
};

export default ManageQuestionForm;
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Select from "react-select";
import { X, Plus } from "lucide-react";
import axios from "axios";

// --- FloatingInput (reusable) ---
const FloatingInput: React.FC<{
    label: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, type = "text", value, onChange }) => (
    <div className="relative">
        <input
            type={type}
            value={value}
            onChange={onChange}
            className="peer h-12 w-full border-b-2 border-gray-300 text-gray-900 placeholder-transparent focus:border-blue-600 focus:outline-none"
            placeholder={label}
        />
        <label className="absolute left-0 -top-3.5 text-gray-600 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
            {label}
        </label>
    </div>
);

const ManageQuestionForm: React.FC = () => {
    const { id } = useParams(); // get id from URL
    const [loading, setLoading] = useState(false);

    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
    const [explanation, setExplanation] = useState("");
    const [marks, setMarks] = useState(1);
    const [negativeMarks, setNegativeMarks] = useState(0);
    const [tags, setTags] = useState("");
    const [difficulty, setDifficulty] = useState<any>(null);
    const [isActive, setIsActive] = useState(true);

    const difficultyOptions = [
        { value: "easy", label: "Easy" },
        { value: "medium", label: "Medium" },
        { value: "hard", label: "Hard" },
    ];

    // --- Fetch Question if Editing ---
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        axios
            .get(`http://localhost:7071/api/question/${id}`)
            .then((res) => {
                const q = res.data;
                setQuestionText(q.text || "");
                setOptions(q.options || ["", ""]);
                setCorrectAnswerIndex(q.correctAnswerIndex ?? 0);
                setExplanation(q.explanation || "");
                setMarks(q.marks ?? 1);
                setNegativeMarks(q.negativeMarks ?? 0);
                setTags(q.tags || "");
                setDifficulty(
                    difficultyOptions.find((d) => d.value === q.difficulty) || null
                );
                setIsActive(q.isActive ?? true);
            })
            .catch((err) => {
                console.error("Failed to fetch question", err);
            })
            .finally(() => setLoading(false));
    }, [id]);

    const handleOptionChange = (index: number, value: string) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    };

    const addOption = () => setOptions([...options, ""]);
    const removeOption = (index: number) =>
        setOptions(options.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            text: questionText,
            options,
            correctAnswerIndex,
            explanation,
            marks,
            negativeMarks,
            tags,
            difficulty: difficulty?.value || null,
            isActive,
        };

        if (id) {
            // --- Update Question ---
            axios
                .put(`http://localhost:7071/api/question/${id}`, payload)
                .then(() => {
                    alert("Question updated successfully!");
                })
                .catch((err) => {
                    console.error("Update failed", err);
                });
        } else {
            // --- Create New Question ---
            axios
                .post(`http://localhost:7071/api/question`, payload)
                .then(() => {
                    alert("Question created successfully!");
                })
                .catch((err) => {
                    console.error("Creation failed", err);
                });
        }
    };

    return (
        <div className="p-8 bg-white shadow-lg rounded-2xl min-h-screen mx-auto">
            {/* Only show header if adding */}
            {!id && (
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                    Manage Question
                </h2>
            )}

            {loading ? (
                <p className="text-gray-600">Loading...</p>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Question Text */}
                    <div>
                        <label className="block text-gray-700 mb-2">Question</label>
                        <textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            rows={6}
                            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter question text"
                        />
                    </div>

                    {/* Options */}
                    <div>
                        <label className="block text-gray-700 mb-2">Options</label>
                        <div className="space-y-3">
                            {options.map((opt, index) => (
                                <div
                                    key={index}
                                    className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg"
                                >
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={correctAnswerIndex === index}
                                        onChange={() => setCorrectAnswerIndex(index)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                        className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            className="p-2 text-red-600 hover:text-red-800"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addOption}
                            className="mt-3 flex items-center text-blue-600 hover:text-blue-800"
                        >
                            <Plus size={18} className="mr-1" /> Add Option
                        </button>
                    </div>

                    {/* Explanation */}
                    <div>
                        <label className="block text-gray-700 mb-2">Explanation</label>
                        <textarea
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            rows={10}
                            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter explanation (optional)"
                        />
                    </div>

                    {/* Marks & Negative Marks */}
                    <div className="grid grid-cols-2 gap-8">
                        <FloatingInput
                            label="Marks"
                            type="number"
                            value={marks}
                            onChange={(e) => setMarks(Number(e.target.value))}
                        />
                        <FloatingInput
                            label="Negative Marks"
                            type="number"
                            value={negativeMarks}
                            onChange={(e) => setNegativeMarks(Number(e.target.value))}
                        />
                    </div>

                    {/* Tags */}
                    <FloatingInput
                        label="Tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />

                    {/* Difficulty */}
                    <div>
                        <label className="block text-gray-700 mb-2">Difficulty</label>
                        <Select
                            value={difficulty}
                            onChange={setDifficulty}
                            options={difficultyOptions}
                            placeholder="Select Difficulty"
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => setIsActive(!isActive)}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="text-gray-700">Active</span>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-40 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                    >
                        {id ? "Update Question" : "Save Question"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ManageQuestionForm;
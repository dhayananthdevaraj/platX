import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { X, Plus, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// --- Validation Types ---
interface ValidationErrors {
    questionText?: string;
    options?: string[];
    explanation?: string;
    tags?: string;
    difficulty?: string;
    general?: string;
}

// --- FloatingInput (reusable) ---
const FloatingInput: React.FC<{
    label: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    required?: boolean;
}> = ({ label, type = "text", value, onChange, error, required = false }) => (
    <div className="relative">
        <input
            type={type}
            value={value}
            onChange={onChange}
            className={`peer h-12 w-full border-b-2 ${error
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-600'
                } text-gray-900 placeholder-transparent focus:outline-none transition-colors`}
            placeholder={label}
            required={required}
        />
        <label className={`absolute left-0 -top-3.5 ${error ? 'text-red-500' : 'text-gray-600'
            } text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:-top-3.5 peer-focus:${error ? 'text-red-500' : 'text-gray-600'
            } peer-focus:text-sm`}>
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {error && (
            <div className="flex items-center mt-1 text-red-500 text-sm">
                <AlertCircle size={14} className="mr-1" />
                {error}
            </div>
        )}
    </div>
);

const ManageQuestionForm: React.FC = () => {
    const navigate = useNavigate();
    const { questionSetId, id } = useParams<{ questionSetId?: string; id?: string }>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState<string[]>(["", "", "", ""]);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
    const [explanation, setExplanation] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [difficulty, setDifficulty] = useState<any>(null);
    const [isActive, setIsActive] = useState(true);

    const difficultyOptions = [
        { value: "Easy", label: "Easy" },
        { value: "Medium", label: "Medium" },
        { value: "Hard", label: "Hard" },
    ];

    // --- Validation Functions ---
    const validateQuestion = (text: string): string | undefined => {
        if (!text.trim()) return "Question text is required";
        if (text.trim().length < 10) return "Question must be at least 10 characters long";
        if (text.trim().length > 1000) return "Question must not exceed 1000 characters";
        return undefined;
    };

    const validateOptions = (opts: string[]): string[] | undefined => {
        const errors: string[] = [];
        const nonEmptyOptions = opts.filter(opt => opt.trim());

        if (nonEmptyOptions.length < 2) {
            return ["At least 2 options are required"];
        }

        opts.forEach((opt, index) => {
            if (!opt.trim()) {
                errors[index] = "Option cannot be empty";
            } else if (opt.trim().length < 1) {
                errors[index] = "Option must have at least 1 character";
            } else if (opt.trim().length > 200) {
                errors[index] = "Option must not exceed 200 characters";
            }
        });

        // Check for duplicate options
        const trimmedOptions = opts.map(opt => opt.trim().toLowerCase());
        const duplicates = trimmedOptions.filter((opt, index) =>
            opt && trimmedOptions.indexOf(opt) !== index
        );

        if (duplicates.length > 0) {
            opts.forEach((opt, index) => {
                if (duplicates.includes(opt.trim().toLowerCase())) {
                    errors[index] = "Duplicate option found";
                }
            });
        }

        return errors.length > 0 ? errors : undefined;
    };

    const validateExplanation = (text: string): string | undefined => {
        if (text && text.length > 2000) return "Explanation must not exceed 2000 characters";
        return undefined;
    };

    const validateTags = (tagList: string[]): string | undefined => {
        if (tagList.length > 10) return "Maximum 10 tags allowed";
        const invalidTags = tagList.filter(tag => tag.length > 30);
        if (invalidTags.length > 0) return "Each tag must not exceed 30 characters";
        return undefined;
    };

    const validateDifficulty = (diff: any): string | undefined => {
        if (!diff) return "Difficulty level is required";
        return undefined;
    };

    const validateForm = (): ValidationErrors => {
        const newErrors: ValidationErrors = {};

        const questionError = validateQuestion(questionText);
        if (questionError) newErrors.questionText = questionError;

        const optionErrors = validateOptions(options);
        if (optionErrors) newErrors.options = optionErrors;

        const explanationError = validateExplanation(explanation);
        if (explanationError) newErrors.explanation = explanationError;

        const tagError = validateTags(tags);
        if (tagError) newErrors.tags = tagError;

        const difficultyError = validateDifficulty(difficulty);
        if (difficultyError) newErrors.difficulty = difficultyError;

        // Validate correct answer
        const nonEmptyOptions = options.filter(opt => opt.trim());
        if (correctAnswerIndex >= nonEmptyOptions.length) {
            newErrors.general = "Please select a valid correct answer";
        }

        return newErrors;
    };

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
                setTags(q.tags || []);
                setDifficulty(
                    difficultyOptions.find((d) => d.value === q.difficulty) || null
                );
                setIsActive(q.isActive ?? true);
            })
            .catch((err) => {
                console.error("Failed to fetch question", err);
                toast.error("Failed to load question data");
            })
            .finally(() => setLoading(false));
    }, [id]);

    // --- Clear errors on input change ---
    useEffect(() => {
        if (errors.questionText && questionText.trim()) {
            setErrors(prev => ({ ...prev, questionText: undefined }));
        }
    }, [questionText]);

    useEffect(() => {
        if (errors.options) {
            setErrors(prev => ({ ...prev, options: undefined }));
        }
    }, [options]);

    useEffect(() => {
        if (errors.difficulty && difficulty) {
            setErrors(prev => ({ ...prev, difficulty: undefined }));
        }
    }, [difficulty]);

    const handleOptionChange = (index: number, value: string) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    };

    const addOption = () => {
        if (options.length < 6) {
            setOptions([...options, ""]);
        } else {
            toast.error("Maximum 6 options allowed");
        }
    };

    const removeOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
            // Adjust correct answer index if needed
            if (correctAnswerIndex >= newOptions.length) {
                setCorrectAnswerIndex(Math.max(0, newOptions.length - 1));
            } else if (correctAnswerIndex > index) {
                setCorrectAnswerIndex(correctAnswerIndex - 1);
            }
        } else {
            toast.error("Minimum 2 options required");
        }
    };

    // --- Handle Enter for Tags ---
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && tagInput.trim() !== "") {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (tags.length >= 10) {
                toast.error("Maximum 10 tags allowed");
                return;
            }
            if (newTag.length > 30) {
                toast.error("Tag must not exceed 30 characters");
                return;
            }
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
                setTagInput("");
            } else {
                toast.error("Tag already exists");
            }
        }
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            toast.error("Please fix the validation errors");
            return;
        }

        setSubmitting(true);
        setErrors({});

        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            const payload = {
                text: questionText.trim(),
                options: options.filter(opt => opt.trim()).map(opt => opt.trim()),
                correctAnswerIndex,
                explanation: explanation.trim(),
                tags,
                difficulty: difficulty?.value || null,
                isActive,
                questionSetId,
                createdBy: user?.id,
                lastUpdatedBy: user?.id,
            };

            if (id) {
                // Update Question
                await axios.put(`http://localhost:7071/api/question/update/${id}`, payload);
                toast.success("Question updated successfully!");
            } else {
                // Create New Question
                await axios.post(`http://localhost:7071/api/question/create`, payload);
                toast.success("Question created successfully!");
            }

            navigate(`/questions/${questionSetId}`);
        } catch (err: any) {
            console.error("Submit failed", err);
            const errorMessage = err.response?.data?.message || "Operation failed. Please try again.";
            toast.error(errorMessage);
            setErrors({ general: errorMessage });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading question data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
            <div className="w-full">
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    {/* Header */}

                    {/* Form */}
                    <div className="px-6 py-8 sm:px-8">
                        {errors.general && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                                <span className="text-red-700">{errors.general}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Question Text */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Question Text <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    rows={4}
                                    className={`w-full border rounded-lg p-4 focus:outline-none focus:ring-2 transition-all resize-none ${errors.questionText
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                    placeholder="Enter your question text here..."
                                    maxLength={1000}
                                />
                                <div className="flex justify-between items-center">
                                    <div>
                                        {errors.questionText && (
                                            <div className="flex items-center text-red-500 text-sm">
                                                <AlertCircle size={14} className="mr-1" />
                                                {errors.questionText}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-400">
                                        {questionText.length}/1000
                                    </span>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Answer Options <span className="text-red-500">*</span>
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        (Select the correct answer)
                                    </span>
                                </label>

                                <div className="space-y-3">
                                    {options.map((opt, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${correctAnswerIndex === index
                                                    ? 'border-green-300 bg-green-50'
                                                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="correctAnswer"
                                                    checked={correctAnswerIndex === index}
                                                    onChange={() => setCorrectAnswerIndex(index)}
                                                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300"
                                                />
                                                {/* {correctAnswerIndex === index && (
                                                    // <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                                                )} */}
                                            </div>

                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={opt}
                                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                                    placeholder={`Option ${index + 1}`}
                                                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all ${errors.options?.[index]
                                                            ? 'border-red-300 focus:ring-red-500'
                                                            : 'border-gray-300 focus:ring-blue-500'
                                                        }`}
                                                    maxLength={200}
                                                />
                                                {errors.options?.[index] && (
                                                    <div className="flex items-center mt-1 text-red-500 text-xs">
                                                        <AlertCircle size={12} className="mr-1" />
                                                        {errors.options[index]}
                                                    </div>
                                                )}
                                            </div>

                                            {options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(index)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Remove option"
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
                                    disabled={options.length >= 6}
                                    className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus size={18} className="mr-2" />
                                    Add Option {options.length >= 6 && "(Max: 6)"}
                                </button>

                                {errors.options?.[0] && !errors.options.some((err, i) => i > 0 && err) && (
                                    <div className="flex items-center text-red-500 text-sm">
                                        <AlertCircle size={14} className="mr-1" />
                                        {errors.options[0]}
                                    </div>
                                )}
                            </div>

                            {/* Difficulty */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Difficulty Level <span className="text-red-500">*</span>
                                </label>
                                <Select
                                    value={difficulty}
                                    onChange={(selected) => setDifficulty(selected)}
                                    options={difficultyOptions}
                                    placeholder="Select difficulty level"
                                    className={`react-select-container ${errors.difficulty ? 'react-select-error' : ''}`}
                                    classNamePrefix="react-select"
                                    styles={{
                                        control: (base, state) => ({
                                            ...base,
                                            borderColor: errors.difficulty
                                                ? '#f87171'
                                                : state.isFocused ? '#3b82f6' : '#d1d5db',
                                            boxShadow: state.isFocused
                                                ? `0 0 0 1px ${errors.difficulty ? '#f87171' : '#3b82f6'}`
                                                : 'none',
                                            '&:hover': {
                                                borderColor: errors.difficulty ? '#f87171' : '#9ca3af'
                                            }
                                        })
                                    }}
                                />
                                {errors.difficulty && (
                                    <div className="flex items-center text-red-500 text-sm">
                                        <AlertCircle size={14} className="mr-1" />
                                        {errors.difficulty}
                                    </div>
                                )}
                            </div>

                            {/* Explanation */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Explanation (Optional)
                                </label>
                                <textarea
                                    value={explanation}
                                    onChange={(e) => setExplanation(e.target.value)}
                                    rows={6}
                                    className={`w-full border rounded-lg p-4 focus:outline-none focus:ring-2 transition-all resize-none ${errors.explanation
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                        }`}
                                    placeholder="Provide an explanation for the correct answer (optional)"
                                    maxLength={2000}
                                />
                                <div className="flex justify-between items-center">
                                    <div>
                                        {errors.explanation && (
                                            <div className="flex items-center text-red-500 text-sm">
                                                <AlertCircle size={14} className="mr-1" />
                                                {errors.explanation}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-400">
                                        {explanation.length}/2000
                                    </span>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Tags (Optional)
                                    <span className="text-sm font-normal text-gray-500 ml-2">
                                        Max: 10 tags
                                    </span>
                                </label>
                                <div className={`min-h-[3rem] flex flex-wrap gap-2 border rounded-lg p-3 ${errors.tags ? 'border-red-300' : 'border-gray-300'
                                    } focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all`}>
                                    {tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(index)}
                                                className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        placeholder={tags.length === 0 ? "Type a tag and press Enter" : "Add more tags"}
                                        className="flex-1 min-w-[120px] border-none focus:ring-0 focus:outline-none bg-transparent"
                                        maxLength={30}
                                        disabled={tags.length >= 10}
                                    />
                                </div>
                                {errors.tags && (
                                    <div className="flex items-center text-red-500 text-sm">
                                        <AlertCircle size={14} className="mr-1" />
                                        {errors.tags}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500">
                                    Press Enter to add tags. Each tag can be up to 30 characters.
                                </p>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 sm:flex-none sm:w-48 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            {id ? "Updating..." : "Creating..."}
                                        </>
                                    ) : (
                                        id ? "Update Question" : "Create Question"
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate(`/questions/${questionSetId}`)}
                                    disabled={submitting}
                                    className="flex-1 sm:flex-none sm:w-32 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageQuestionForm;
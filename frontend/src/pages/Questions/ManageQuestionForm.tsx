import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import { X, Plus, AlertCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { v4 as uuidv4 } from "uuid";

// --- Validation Types ---
interface ValidationErrors {
    questionText?: string;
    options?: string[];
    explanation?: string;
    tags?: string;
    difficulty?: string;
    general?: string;
}

interface DifficultyOption {
    value: string;
    label: string;
}

// --- Component ---
const ManageQuestionForm: React.FC = () => {
    const navigate = useNavigate();
    const { questionSetId, id } = useParams<{ questionSetId?: string; id?: string }>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const quillRef = useRef<ReactQuill>(null);

    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState<string[]>(["", "", "", ""]);
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0);
    const [explanation, setExplanation] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    
    const [isActive, setIsActive] = useState(true);

    // --- React Quill Image Handling ---
    const [quillImageMap, setQuillImageMap] = useState<Map<string, File>>(new Map());

    const difficultyOptions: DifficultyOption[] = [
        { value: "Easy", label: "Easy" },
        { value: "Medium", label: "Medium" },
        { value: "Hard", label: "Hard" },
    ];

    // allow DifficultyOption or null
    const [difficulty, setDifficulty] = useState<DifficultyOption | null>(
        difficultyOptions[0] // default Easy
    );
    
    // --- Helper function to convert base64 to File ---
    const base64ToFile = (base64: string, filename: string = 'pasted-image.png'): File => {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    // --- Custom Image Upload Handler ---
    function handleImageUpload() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size must be less than 5MB');
                return;
            }

            // Convert to Base64 for immediate display in editor
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target?.result as string;

                // Store binary file mapped to Base64 for later processing
                setQuillImageMap(prev => new Map(prev.set(base64, file)));

                // Get current selection/cursor position
                const quill = quillRef.current?.getEditor();
                if (!quill) return;

                const range = quill.getSelection(true);
                const index = range ? range.index : quill.getLength();

                // Insert image with Base64 for immediate display (keep Base64 in editor)
                quill.insertEmbed(index, 'image', base64);
            };

            reader.readAsDataURL(file);
        };
    }

    // --- Handle paste events for images ---
    const handleQuillChange = (content: string, delta: any, source: any, editor: any) => {
        setQuestionText(content);

        // Check if content contains any base64 images that aren't in our map
        const base64Images = content.match(/data:image\/[^;]+;base64,[^"'\s>]+/g) || [];

        base64Images.forEach((base64: string) => {
            if (!quillImageMap.has(base64)) {
                // This is a pasted image that we haven't processed yet
                try {
                    const file = base64ToFile(base64, `pasted-image-${Date.now()}.png`);

                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        toast.error('Pasted image size must be less than 5MB');
                        // Remove the image from editor
                        const quill = quillRef.current?.getEditor();
                        if (quill) {
                            const newContent = content.replace(base64, '');
                            quill.root.innerHTML = newContent;
                        }
                        return;
                    }

                    // Add to our image map
                    setQuillImageMap(prev => new Map(prev.set(base64, file)));

                    toast.success('Pasted image processed successfully!');
                } catch (error) {
                    console.error('Error processing pasted image:', error);
                    toast.error('Error processing pasted image');
                }
            }
        });

        // Clean up image map - remove entries for base64 strings no longer in content
        setQuillImageMap(prev => {
            const newMap = new Map();
            prev.forEach((file, base64) => {
                if (content.includes(base64)) {
                    newMap.set(base64, file);
                }
            });
            return newMap;
        });
    };

    // --- React Quill Configuration ---
    const quillModules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: handleImageUpload
            }
        },
        clipboard: {
            // Allow pasted images
            matchVisual: false,
        }
    }), []);

    const quillFormats = [
        'header', 'bold', 'italic', 'underline', 'strike',
        'color', 'background', 'list', 'bullet', 'indent',
        'align', 'link', 'image'
    ];

    // --- Validation Functions ---
    const validateQuestion = (text: string): string | undefined => {
        const strippedText = text.replace(/<[^>]*>/g, '').trim(); // Remove HTML tags for length check
        if (!strippedText) return "Question text is required";
        if (strippedText.length < 10) return "Question must be at least 10 characters long";
        if (strippedText.length > 1000) return "Question must not exceed 1000 characters";
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
            } else if (opt.trim().length > 200) {
                errors[index] = "Option must not exceed 200 characters";
            }
        });

        const trimmedOptions = opts.map(opt => opt.trim().toLowerCase());
        const duplicates = trimmedOptions.filter((opt, index) => opt && trimmedOptions.indexOf(opt) !== index);

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

        const nonEmptyOptions = options.filter(opt => opt.trim());
        if (correctAnswerIndex >= nonEmptyOptions.length) {
            newErrors.general = "Please select a valid correct answer";
        }

        return newErrors;
    };

    // --- Process Quill Content for Backend (ON SUBMIT ONLY) ---
    const processQuillContentForSubmit = (content: string) => {
        let processedContent = content;
        const quillImages: File[] = [];
        const base64ToFileMap: { [dummyUrl: string]: File } = {};

        // Find all Base64 images in content and replace with dummy URLs
        quillImageMap.forEach((file, base64) => {
            if (content.includes(base64)) {
                // Generate dummy URL for this image
                const dummyUrl = `temp-image-${quillImages.length}`;

                // Replace Base64 with dummy URL in content
                // Escape special regex characters in Base64 string
                const escapedBase64 = base64.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                processedContent = processedContent.replace(
                    new RegExp(escapedBase64, 'g'),
                    dummyUrl
                );

                // Store file and mapping
                quillImages.push(file);
                base64ToFileMap[dummyUrl] = file;
            }
        });

        return {
            content: processedContent,
            images: quillImages,
            mapping: base64ToFileMap
        };
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
                setDifficulty(difficultyOptions.find((d) => d.value === q.difficulty) || null);
                setIsActive(q.isActive ?? true);
            })
            .catch((err) => {
                console.error("Failed to fetch question", err);
                toast.error("Failed to load question data");
            })
            .finally(() => setLoading(false));
    }, [id]);

    // --- Clear errors ---
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
            if (correctAnswerIndex >= newOptions.length) {
                setCorrectAnswerIndex(Math.max(0, newOptions.length - 1));
            } else if (correctAnswerIndex > index) {
                setCorrectAnswerIndex(correctAnswerIndex - 1);
            }
        } else {
            toast.error("Minimum 2 options required");
        }
    };

    // --- Tags ---
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

    // --- Submit ---
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

            // Process Quill content: Replace Base64 with dummy URLs, extract binary files
            const { content: processedContent, images: quillImages } = processQuillContentForSubmit(questionText);

            const formData = new FormData();
            formData.append("text", processedContent);
            formData.append("options", JSON.stringify(options.filter(opt => opt.trim())));
            formData.append("correctAnswerIndex", String(correctAnswerIndex));
            formData.append("explanation", explanation.trim());
            formData.append("tags", JSON.stringify(tags));
            formData.append("difficulty", difficulty?.value || "");
            formData.append("isActive", String(isActive));
            formData.append("questionSetId", questionSetId || "");
            formData.append("createdBy", user?.id);
            formData.append("lastUpdatedBy", user?.id);

            // Add Quill embedded images
            quillImages.forEach((file) => {
                formData.append("quillImages", file);
            });

            console.log('Submitting images:', quillImages.length, 'files');
            quillImages.forEach((file, index) => {
                console.log(`Image ${index}:`, file.name, file.type, file.size, 'bytes');
            });

            if (id) {
                await axios.put(`http://localhost:7071/api/question/update/${id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Question updated successfully!");
            } else {
                await axios.post(`http://localhost:7071/api/question/create`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                toast.success("Question created successfully!");
            }

            //   navigate(`/questions/${questionSetId}`);
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
                    <div className="px-6 py-8 sm:px-8">
                        {errors.general && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                                <span className="text-red-700">{errors.general}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">

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
                                />
                            </div>

                            
                            {/* Question Text with React Quill */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Question Text <span className="text-red-500">*</span>
                                </label>
                                <div className={`border rounded-lg ${errors.questionText
                                    ? "border-red-300"
                                    : "border-gray-300"
                                    }`}>
                                    <ReactQuill
                                        ref={quillRef}
                                        theme="snow"
                                        value={questionText}
                                        onChange={handleQuillChange}
                                        modules={quillModules}
                                        formats={quillFormats}
                                        placeholder="Enter your question text here... You can format text, add images, or paste screenshots."
                                        style={{
                                            minHeight: '200px',
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    {errors.questionText && (
                                        <div className="flex items-center text-red-500 text-sm">
                                            <AlertCircle size={14} className="mr-1" />
                                            {errors.questionText}
                                        </div>
                                    )}
                                    <span className="text-sm text-gray-400">
                                        Characters: {questionText.replace(/<[^>]*>/g, '').length}/1000
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <div>💡 Tip: Click the image icon in the toolbar to upload images or simply paste screenshots directly into the editor.</div>
                                    <div>🖼️ Images processed: {quillImageMap.size}</div>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Answer Options <span className="text-red-500">*</span>
                                </label>

                                <div className="space-y-3">
                                    {options.map((opt, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all ${correctAnswerIndex === index
                                                ? "border-green-300 bg-green-50"
                                                : "border-gray-200 bg-gray-50 hover:border-gray-300"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                checked={correctAnswerIndex === index}
                                                onChange={() => setCorrectAnswerIndex(index)}
                                                className="h-5 w-5 text-green-600"
                                            />

                                            <textarea
                                                value={opt}
                                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                                placeholder={`Option ${index + 1}`}
                                                className={`flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${errors.options?.[index]
                                                    ? "border-red-300 focus:ring-red-500"
                                                    : "border-gray-300 focus:ring-blue-500"
                                                    }`}
                                                maxLength={200}
                                            />

                                            {options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(index)}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg"
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
                                    className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                                >
                                    <Plus size={18} className="mr-2" />
                                    Add Option
                                </button>
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
                                    className="w-full border rounded-lg p-4"
                                    maxLength={2000}
                                    placeholder="Provide explanation (optional)"
                                />
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Tags (Optional)
                                </label>
                                <div className="flex flex-wrap gap-2 border rounded-lg p-3">
                                    {tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                                        >
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(index)}
                                                className="ml-2 text-blue-600 hover:text-blue-800"
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
                                        placeholder="Add tags"
                                        className="flex-1 border-none focus:ring-0 bg-transparent"
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex gap-4 pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? (id ? "Updating..." : "Creating...") : id ? "Update Question" : "Create Question"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/questions/${questionSetId}`)}
                                    disabled={submitting}
                                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 disabled:opacity-50"
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
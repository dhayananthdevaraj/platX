import React, { useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../../components/BackButton";
import ManageQuestionForm from "./ManageQuestionForm";
import UploadQuestionExcel from "./UploadQuestionExcel";

const AddQuestion: React.FC = () => {
    const { questionSetId, id } = useParams<{ questionSetId: string; id?: string }>();
    const instituteId = localStorage.getItem("selectedInstituteId");
    const [mode, setMode] = useState<"form" | "excel">("form");

    // If editing, skip header and toggle (just show form)
    if (id) {
        return <ManageQuestionForm />;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6">
            {/* Header - Only for Add Mode */}
            <div className="bg-white p-5 rounded-xl border shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BackButton />
                    <h1 className="text-2xl font-bold text-gray-800">Add New Question</h1>
                </div>

                {/* Toggle Buttons */}
                <div className="flex space-x-3">
                    <button
                        onClick={() => setMode("form")}
                        className={`px-4 py-2 rounded-lg font-medium shadow-md ${mode === "form"
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        Add via Form
                    </button>
                    <button
                        onClick={() => setMode("excel")}
                        className={`px-4 py-2 rounded-lg font-medium shadow-md ${mode === "excel"
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        Upload Excel
                    </button>
                </div>
            </div>

            {/* Content */}
            {mode === "form" ? (
                <ManageQuestionForm />
            ) : instituteId && questionSetId ? (
                <UploadQuestionExcel instituteId={instituteId} questionSetId={questionSetId} />
            ) : (
                <p className="text-red-600">Missing institute ID or question set ID.</p>
            )}
        </div>
    );
};

export default AddQuestion;

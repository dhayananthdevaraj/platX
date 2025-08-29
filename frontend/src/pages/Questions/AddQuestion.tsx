import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../../components/BackButton";
import ManageQuestionForm from "./ManageQuestionForm";
import UploadQuestionExcel from "./UploadQuestionExcel";

const AddQuestion: React.FC = () => {
    const navigate = useNavigate();
    const { questionSetId } = useParams(); // 👈 get from URL params
    const instituteId = localStorage.getItem("selectedInstituteId");
    const [mode, setMode] = useState<"form" | "excel">("form");

    return (
        <div className="px-4 md:px-10 py-6">
            <BackButton />

            <h1 className="text-2xl font-bold mb-4 text-gray-800">Add New Question</h1>

            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setMode("form")}
                    className={`btn ${mode === "form" ? "btn-primary" : "btn-outline"}`}
                >
                    Add via Form
                </button>
                <button
                    onClick={() => setMode("excel")}
                    className={`btn ${mode === "excel" ? "btn-primary" : "btn-outline"}`}
                >
                    Upload Excel
                </button>
            </div>

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

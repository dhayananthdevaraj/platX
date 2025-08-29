import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";
import ManageQuestionSetForm from "./ManageQuestionSetForm";
import UploadQuestionSetExcel from "./UploadQuestionSetExcel";

const AddQuestionSet: React.FC = () => {
    const navigate = useNavigate();
    const instituteId = localStorage.getItem("selectedInstituteId");
    const [mode, setMode] = useState<"form" | "excel">("form");

    return (
        <div className="px-4 md:px-10 py-6">
            <BackButton />

            <h1 className="text-2xl font-bold mb-4 text-gray-800">
                Add New Question Set
            </h1>

            {/* Toggle Buttons */}
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

            {/* Mode Switch */}
            {mode === "form" ? (
                <ManageQuestionSetForm />
            ) : instituteId ? (
                <UploadQuestionSetExcel instituteId={instituteId} />
            ) : (
                <p className="text-red-600">
                    Missing institute ID. Please select an institute.
                </p>
            )}
        </div>
    );
};

export default AddQuestionSet;

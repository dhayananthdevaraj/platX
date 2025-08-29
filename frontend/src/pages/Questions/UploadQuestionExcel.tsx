// src/pages/Questions/UploadQuestionExcel.tsx
import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

interface UploadQuestionExcelProps {
    instituteId: string;
    questionSetId: string;   // 👈 required
}

const UploadQuestionExcel: React.FC<UploadQuestionExcelProps> = ({ instituteId, questionSetId }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        if (selectedFile && !selectedFile.name.endsWith(".xlsx")) {
            toast.error("Please upload a valid Excel (.xlsx) file");
            return;
        }
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("No file selected");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("questionSetId", questionSetId);

        try {
            setUploading(true);
            const response = await axios.post("http://localhost:7071/api/importQuestions", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success(response.data.message || "Questions uploaded successfully");
            setFile(null);
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to upload Excel";
            toast.error(message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Questions via Excel</h2>
            <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-700 mb-4"
            />
            <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="btn btn-primary"
            >
                {uploading ? "Uploading..." : "Upload"}
            </button>
        </div>
    );
};

export default UploadQuestionExcel;

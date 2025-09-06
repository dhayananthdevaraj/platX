// import React, { useState } from 'react';
// import axios from 'axios';
// import toast from 'react-hot-toast';

// interface UploadBatchExcelProps {
//   instituteId: string;
// }

// const UploadBatchExcel: React.FC<UploadBatchExcelProps> = ({ instituteId }) => {
//   const [file, setFile] = useState<File | null>(null);
//   const [uploading, setUploading] = useState(false);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files?.[0] || null;
//     if (selectedFile && !selectedFile.name.endsWith('.xlsx')) {
//       toast.error('Please upload a valid Excel (.xlsx) file');
//       return;
//     }
//     setFile(selectedFile);
//   };

//   const handleUpload = async () => {
//     if (!file) {
//       toast.error('No file selected');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('instituteId', instituteId); // ⬅ Attach instituteId

//     try {
//       setUploading(true);
//       const response = await axios.post('http://localhost:7071/api/importBatches', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       toast.success(response.data.message || 'Batches uploaded successfully');
//       setFile(null);
//     } catch (error: any) {
//       const message = error.response?.data?.message || 'Failed to upload Excel';
//       toast.error(message);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div className="bg-white rounded shadow p-6">
//       <h2 className="text-lg font-semibold mb-4">Upload Batches via Excel</h2>
//       <input
//         type="file"
//         accept=".xlsx"
//         onChange={handleFileChange}
//         className="block w-full text-sm text-gray-700 mb-4"
//       />
//       <button
//         onClick={handleUpload}
//         disabled={uploading || !file}
//         className="btn btn-primary"
//       >
//         {uploading ? 'Uploading...' : 'Upload'}
//       </button>
//     </div>
//   );
// };

// export default UploadBatchExcel;


import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import FileUpload from "../../components/FileUpload"; // your custom uploader

interface UploadBatchExcelProps {
  instituteId: string;
}

const UploadBatchExcel: React.FC<UploadBatchExcelProps> = ({ instituteId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // get user id from localStorage (if available)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id || "";

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && !selectedFile.name.endsWith(".xlsx")) {
      toast.error("Please upload a valid Excel (.xlsx) file");
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return toast.error("No file selected");
    if (!instituteId && !localStorage.getItem("selectedInstituteId")) {
      return toast.error("Institute ID missing. Please select an institute.");
    }
    if (!userId) return toast.error("User not found. Please login again.");

    const formData = new FormData();
    formData.append("file", file);
    // server expects either single instituteId or comma-separated list
    formData.append("instituteIds", instituteId || localStorage.getItem("selectedInstituteId") || "");
    formData.append("createdBy", userId);

    try {
      setUploading(true);
      const token = localStorage.getItem("token");

      const response = await axios.post("http://localhost:7071/api/importBatches", formData, {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(response.data.message || "Batches uploaded successfully");
      setFile(null);
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.data?.error || "Failed to upload Excel";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded shadow p-6">
      <h2 className="text-lg font-semibold mb-6 text-center">Upload Batches via Excel</h2>

      {/* Centered File Upload */}
      <div className="flex justify-center mb-6">
        <FileUpload label="Browse Excel File (.xlsx)" onFileSelect={handleFileSelect} />
      </div>

      <div className="text-sm text-gray-600 mb-4">
        <p>Make sure your Excel has columns: <span className="font-medium">name, code, year, isActive</span> and an optional <span className="font-medium">instituteId</span> if uploading for multiple institutes.</p>
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="btn btn-primary mt-2 w-full"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
};

export default UploadBatchExcel;

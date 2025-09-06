// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import {
//   PlusCircle,
//   Pencil,
//   Power,
//   Search,
//   Phone,
//   User,
// } from 'lucide-react';
// import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import BackButton from '../../components/BackButton';
// import { FaPlus } from 'react-icons/fa6';
// import { FiEdit } from 'react-icons/fi';

// interface Student {
//   _id: string;
//   name: string;
//   email: string;
//   mobile: string;
//   isActive: boolean;
//   createdAt: string;
// }

// const Students = () => {
//   const { batchId } = useParams();
//   const [students, setStudents] = useState<Student[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const view = searchParams.get('view') || 'students';

//   const fetchStudents = async () => {
//     try {
//       const res = await axios.get(`http://localhost:7071/api/students/batch/${batchId}`);
//       setStudents(res.data.students);
//     } catch (error) {
//       console.error('Failed to fetch students', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (batchId) {
//       localStorage.setItem('selectedBatchId', batchId);
//       fetchStudents();
//     }
//   }, [batchId]);

//   const handleToggleActive = async (id: string, currentStatus: boolean) => {
//     try {
//       await axios.put(`http://localhost:7071/api/users/${id}`, {
//         isActive: !currentStatus,
//       });
//       toast.success(`Marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
//       fetchStudents();
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || 'Failed to update status');
//     }
//   };

//   // ✅ Filtering
//   const filteredStudents = students.filter((student) => {
//     const matchesSearch =
//       student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       student.email.toLowerCase().includes(searchQuery.toLowerCase());

//     const matchesStatus =
//       statusFilter === 'all' ||
//       (statusFilter === 'active' && student.isActive) ||
//       (statusFilter === 'inactive' && !student.isActive);

//     return matchesSearch && matchesStatus;
//   });

//   // ✅ Navigate to Groups when Groups tab is clicked
//   useEffect(() => {
//     if (view === 'groups' && batchId) {
//       navigate(`/batches/${batchId}/groups`);
//     }
//   }, [view, batchId, navigate]);

//   return (
//     <div className="px-4 md:px-10 py-6">

//       {/* Header */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
//         <div className="flex items-center gap-3">
//         <BackButton />
//         <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Students</h1>
//         </div>
//         <Link
//           to={`/students/create?batchId=${batchId}`}
//           className="flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-all"
//         >
//            <FaPlus size={20} />
//         </Link>
//       </div>

//       {/* ✅ Toggle between Students / Groups */}
//       <div className="flex gap-3 mb-6">
//         <button
//           className={`px-4 py-2 rounded-lg font-medium transition ${
//             view === 'students'
//               ? 'bg-blue-600 text-white shadow'
//               : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//           }`}
//         >
//           Students
//         </button>
//         <button
//           onClick={() => navigate(`/batches/${batchId}/groups`)}
//           className="px-4 py-2 rounded-lg font-medium transition bg-gray-100 text-gray-700 hover:bg-gray-200"
//         >
//           Groups
//         </button>
//       </div>

//       {/* Filters */}
//       <div className="flex flex-col sm:flex-row gap-3 mb-4">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search by name or email..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
//           className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//         >
//           <option value="all">All Status</option>
//           <option value="active">Active</option>
//           <option value="inactive">Inactive</option>
//         </select>

//         <button
//           onClick={() => {
//             setSearchQuery('');
//             setStatusFilter('all');
//           }}
//           className="px-4 py-2 bg-gray-100 text-sm text-gray-700 rounded-md hover:bg-gray-200"
//         >
//           Clear Filters
//         </button>
//       </div>

//       {/* Table */}
//       {loading ? (
//         <p className="text-center text-gray-500">Loading...</p>
//       ) : (
//         <div className="overflow-x-auto rounded-2xl shadow-xl border border-gray-200">
//           <table className="w-full border-collapse bg-white">
//             <thead>
//               <tr className="bg-blue-600 text-left text-sm font-semibold text-white">
//                 <th className="px-6 py-3">Name</th>
//                 <th className="px-6 py-3">Email</th>
//                 <th className="px-6 py-3">Mobile</th>
//                 <th className="px-6 py-3">Status</th>
//                 <th className="px-6 py-3">Created At</th>
//                 <th className="px-6 py-3">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredStudents.map((student, idx) => (
//                 <tr
//                   key={student._id}
//                   className={`border-t transition ${
//                     idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'
//                   } hover:bg-blue-50`}
//                 >
//                   <td className="px-6 py-4 font-medium text-gray-800 align-middle flex items-center gap-2">
//                     <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                       <User className="w-4 h-4 text-blue-600" />
//                     </div>
//                     {student.name}
//                   </td>
//                   <td className="px-6 py-4 align-middle">{student.email}</td>
//                   <td className="px-6 py-4 align-middle flex items-center gap-1">
//                     <Phone className="w-4 h-4 text-gray-400" />
//                     {student.mobile || '-'}
//                   </td>
//                   <td className="px-6 py-4 align-middle">
//                     <span
//                       className={`px-3 py-1 text-xs font-medium rounded-full ${
//                         student.isActive
//                           ? 'bg-green-100 text-green-700 border border-green-200'
//                           : 'bg-red-100 text-red-700 border border-red-200'
//                       }`}
//                     >
//                       {student.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 text-sm text-gray-500 align-middle">
//                     {new Date(student.createdAt).toLocaleDateString()}
//                   </td>
//                   <td className="px-6 py-4 flex items-center gap-3 align-middle">
//                     <Link
//                       to={`/students/edit/${student._id}`}
//                       className="text-gray-500 hover:text-yellow-500 transition"
//                       title="Edit"
//                     >
//                       <FiEdit size={20}/>
//                     </Link>
//                     <button
//                       onClick={() => handleToggleActive(student._id, student.isActive)}
//                       className="text-gray-500 hover:text-red-600 transition"
//                       title={student.isActive ? 'Mark Inactive' : 'Mark Active'}
//                     >
//                       <Power className="w-5 h-5" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}

//               {filteredStudents.length === 0 && (
//                 <tr>
//                   <td colSpan={6} className="text-center py-8 text-gray-500">
//                     No students found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Students;

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Power, Search, Phone, User } from "lucide-react";
// import { FaPlus } from "react-icons/fa6";
// import { FiEdit } from "react-icons/fi";
// import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
// import toast from "react-hot-toast";
// import BackButton from "../../components/BackButton";
// import { motion, AnimatePresence } from "framer-motion";

// interface Student {
//   _id: string;
//   name: string;
//   email: string;
//   mobile: string;
//   isActive: boolean;
//   createdAt: string;
// }

// const Students: React.FC = () => {
//   const { batchId } = useParams();
//   const [students, setStudents] = useState<Student[]>([]);
//   const [loading, setLoading] = useState(true);

//   // Filters & UI state
//   const [searchQuery, setSearchQuery] = useState("");
//   const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
//   const [showFilters, setShowFilters] = useState(false);

//   // Column selector
//   const [showColumnDropdown, setShowColumnDropdown] = useState(false);
//   const [visibleColumns, setVisibleColumns] = useState<string[]>([
//     "name",
//     "email",
//     "mobile",
//     "status",
//     "createdAt",
//   ]);

//   // Pagination
//   const [rowsPerPage, setRowsPerPage] = useState<number>(25);
//   const [currentPage, setCurrentPage] = useState<number>(1);

//   const [searchParams] = useSearchParams();
//   const navigate = useNavigate();
//   const view = searchParams.get("view") || "students";

//   const allColumns = [
//     { key: "name", label: "Name" },
//     { key: "email", label: "Email" },
//     { key: "mobile", label: "Mobile" },
//     { key: "status", label: "Status" },
//     { key: "createdAt", label: "Created At" },
//   ];

//   const fetchStudents = async () => {
//     try {
//       const res = await axios.get(`http://localhost:7071/api/students/batch/${batchId}`);
//       setStudents(res.data.students || []);
//     } catch (error) {
//       console.error("Failed to fetch students", error);
//       toast.error("Failed to fetch students");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (batchId) {
//       localStorage.setItem("selectedBatchId", batchId);
//       fetchStudents();
//     }
//   }, [batchId]);

//   // keep groups nav behavior
//   useEffect(() => {
//     if (view === "groups" && batchId) {
//       navigate(`/batches/${batchId}/groups`);
//     }
//   }, [view, batchId, navigate]);

//   const handleToggleActive = async (id: string, currentStatus: boolean) => {
//     try {
//       await axios.put(`http://localhost:7071/api/users/${id}`, {
//         isActive: !currentStatus,
//       });
//       toast.success(`Marked as ${!currentStatus ? "Active" : "Inactive"}`);
//       fetchStudents();
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Failed to update status");
//     }
//   };

//   // Filtering ✅ (fixed)
//   const filteredStudents = students.filter((student) => {
//     const matchesSearch =
//       student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       student.email.toLowerCase().includes(searchQuery.toLowerCase());

//     const matchesStatus =
//       statusFilter === "all" ||
//       (statusFilter === "active" && student.isActive) ||
//       (statusFilter === "inactive" && !student.isActive);

//     return matchesSearch && matchesStatus;
//   });

//   // Pagination calculations
//   const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage));
//   const paginated = filteredStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

//   const resetFilters = () => {
//     setSearchQuery("");
//     setStatusFilter("all");
//     setRowsPerPage(25);
//     setCurrentPage(1);
//     setVisibleColumns(["name", "email", "mobile", "status", "createdAt"]);
//   };

//   return (
//     <div className="space-y-6 fade-in p-6">
//       {/* Header */}
//       <div className="bg-white p-4 rounded-t-xl border shadow-md flex flex-col gap-4">
//         <div className="flex justify-between items-center">
//           <div className="flex items-center gap-3">
//             <BackButton />
//             <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Students</h1>
//           </div>

//           <div className="flex items-center gap-3">
//             {/* Filters Toggle */}
//             <button
//               className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-2"
//               onClick={() => setShowFilters(!showFilters)}
//             >
//               <motion.span
//                 animate={{ rotate: showFilters ? 180 : 0 }}
//                 transition={{ duration: 0.3 }}
//                 className="inline-block"
//               >
//                 ▼
//               </motion.span>
//               Filters
//             </button>

//             {/* Add Student */}
//             <Link
//               to={`/students/create?batchId=${batchId}`}
//               className="inline-flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-all"
//             >
//               <FaPlus size={20} />
//             </Link>
//           </div>
//         </div>

//         {/* Filters */}
//         <AnimatePresence>
//           {showFilters && (
//             <motion.div
//               initial={{ height: 0, opacity: 0 }}
//               animate={{ height: "auto", opacity: 1 }}
//               exit={{ height: 0, opacity: 0 }}
//               transition={{ duration: 0.28, ease: "easeInOut" }}
//             >
//               <div className="flex flex-wrap items-center gap-4 mt-2">
//                 {/* Search */}
//                 <div className="relative w-full md:w-60">
//                   <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
//                   <input
//                     type="text"
//                     placeholder="Search by name or email..."
//                     value={searchQuery}
//                     onChange={(e) => {
//                       setSearchQuery(e.target.value);
//                       setCurrentPage(1);
//                     }}
//                     className="input input-bordered pl-9 w-full"
//                   />
//                 </div>

//                 {/* Status */}
//                 <select
//                   className="input input-bordered w-40"
//                   value={statusFilter}
//                   onChange={(e) => {
//                     setStatusFilter(e.target.value as "all" | "active" | "inactive");
//                     setCurrentPage(1);
//                   }}
//                 >
//                   <option value="all">All Status</option>
//                   <option value="active">Active</option>
//                   <option value="inactive">Inactive</option>
//                 </select>

//                 {/* Rows per page */}
//                 <select
//                   className="input input-bordered w-40"
//                   value={rowsPerPage}
//                   onChange={(e) => {
//                     setRowsPerPage(Number(e.target.value));
//                     setCurrentPage(1);
//                   }}
//                 >
//                   {[25, 50, 75, 100].map((count) => (
//                     <option key={count} value={count}>
//                       {count} per page
//                     </option>
//                   ))}
//                 </select>

//                 {/* Right controls */}
//                 <div className="flex gap-4 ml-auto">
//                   <div className="relative">
//                     <button
//                       onClick={() => setShowColumnDropdown(!showColumnDropdown)}
//                       className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
//                     >
//                       Select Columns ▼
//                     </button>
//                     {showColumnDropdown && (
//                       <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
//                         {allColumns.map((col) => (
//                           <label key={col.key} className="flex items-center gap-2 text-sm py-1">
//                             <input
//                               type="checkbox"
//                               checked={visibleColumns.includes(col.key)}
//                               onChange={(e) => {
//                                 if (e.target.checked) {
//                                   setVisibleColumns([...visibleColumns, col.key]);
//                                 } else {
//                                   setVisibleColumns(visibleColumns.filter((c) => c !== col.key));
//                                 }
//                               }}
//                             />
//                             {col.label}
//                           </label>
//                         ))}
//                       </div>
//                     )}
//                   </div>

//                   <button className="btn btn-secondary" onClick={resetFilters}>
//                     Clear Filters
//                   </button>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto shadow-lg border border-gray-200 bg-white">
//         {loading ? (
//           <p className="text-center text-gray-500 p-6">Loading...</p>
//         ) : (
//           <table className="w-full text-sm text-left">
//             <thead className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm">
//               <tr>
//                 {allColumns
//                   .filter((col) => visibleColumns.includes(col.key))
//                   .map((col) => (
//                     <th key={col.key} className="px-6 py-4 font-semibold">
//                       {col.label}
//                     </th>
//                   ))}
//                 <th className="px-6 py-4 font-semibold text-center">Actions</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-200">
//               {paginated.length > 0 ? (
//                 paginated.map((student) => (
//                   <tr
//                     key={student._id}
//                      className="group hover:bg-blue-50 transition-all"
//                   >
//                     {allColumns
//                       .filter((col) => visibleColumns.includes(col.key))
//                       .map((col) => (
//                         <td key={col.key} className="px-6 py-4 text-gray-700 align-middle">
//                           {col.key === "name" ? (
//                             <div className="flex items-center gap-3">
//                               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                                 <User className="w-4 h-4 text-blue-600" />
//                               </div>
//                               <div className="font-medium text-gray-800">{student.name}</div>
//                             </div>
//                           ) : col.key === "email" ? (
//                             student.email || "-"
//                           ) : col.key === "mobile" ? (
//                             <div className="flex items-center gap-2">
//                               <Phone className="w-4 h-4 text-gray-400" />
//                               {student.mobile || "-"}
//                             </div>
//                           ) : col.key === "status" ? (
//                             <span
//                               className={`px-3 py-1 text-xs font-medium rounded-full ${
//                                 student.isActive
//                                   ? "bg-green-100 text-green-700 border border-green-200"
//                                   : "bg-red-100 text-red-700 border border-red-200"
//                               }`}
//                             >
//                               {student.isActive ? "Active" : "Inactive"}
//                             </span>
//                           ) : col.key === "createdAt" ? (
//                             new Date(student.createdAt).toLocaleDateString()
//                           ) : (
//                             (student as any)[col.key] || "-"
//                           )}
//                         </td>
//                       ))}
//                     <td
//                       className="px-6 py-4 flex items-center justify-center gap-3"
//                       onClick={(e) => e.stopPropagation()}
//                     >
//                       <Link
//                         to={`/students/edit/${student._id}`}
//                         className="p-2 rounded-full bg-yellow-200 text-gray-500 hover:bg-yellow-500 shadow-md transition"
//                         title="Edit"
//                       >
//                         <FiEdit size={18} />
//                       </Link>

//                       <button
//                         onClick={() => handleToggleActive(student._id, student.isActive)}
//                         className={`p-2 rounded-full transition ${
//                           student.isActive
//                             ? "bg-green-100 text-green-600 hover:bg-green-200"
//                             : "bg-gray-100 text-gray-400 hover:bg-gray-200"
//                         }`}
//                         title={student.isActive ? "Deactivate" : "Activate"}
//                       >
//                         <Power className="h-5 w-5" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan={visibleColumns.length + 1}
//                     className="text-center py-10 text-gray-500 text-base font-medium"
//                   >
//                     No students found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex justify-between items-center px-4 py-3 bg-white border border-gray-200 shadow-md rounded-b-xl mt-4">
//           <button
//             disabled={currentPage === 1}
//             onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//             className={`px-3 py-1 rounded-md text-sm font-medium border shadow-sm ${
//               currentPage === 1
//                 ? "text-gray-400 bg-gray-100 cursor-not-allowed"
//                 : "text-blue-600 bg-gray-50 hover:bg-blue-100"
//             }`}
//           >
//             Prev
//           </button>

//           <div className="flex gap-2">
//             {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//               <button
//                 key={page}
//                 onClick={() => setCurrentPage(page)}
//                 className={`px-3 py-1 rounded-md text-sm font-medium border shadow-sm transition ${
//                   currentPage === page ? "bg-blue-600 text-white shadow" : "bg-gray-50 text-gray-700 hover:bg-blue-100"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}
//           </div>

//           <button
//             disabled={currentPage === totalPages}
//             onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//             className={`px-3 py-1 rounded-md text-sm font-medium border shadow-sm ${
//               currentPage === totalPages
//                 ? "text-gray-400 bg-gray-100 cursor-not-allowed"
//                 : "text-blue-600 bg-gray-50 hover:bg-blue-100"
//             }`}
//           >
//             Next
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Students;

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Power, Search, Phone, User, GraduationCap } from "lucide-react";
import { FaPlus } from "react-icons/fa6";
import { FiEdit } from "react-icons/fi";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import BackButton from "../../components/BackButton";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  isActive: boolean;
  createdAt: string;
}

const Students: React.FC = () => {
  const { batchId } = useParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // show batch name in header
  const [batchName, setBatchName] = useState<string>("");

  // Filters & UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [showFilters, setShowFilters] = useState(false);

  // Column selector
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    "name",
    "email",
    "mobile",
    "status",
    "createdAt",
  ]);

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = searchParams.get("view") || "students";

  const allColumns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "mobile", label: "Mobile" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created At" },
  ];

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`http://localhost:7071/api/students/batch/${batchId}`);
      setStudents(res.data.students || []);
    } catch (error) {
      console.error("Failed to fetch students", error);
      toast.error("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  // fetch batch details to get the name
  const fetchBatchName = async () => {
    if (!batchId) return;
    try {
      const res = await axios.get(`http://localhost:7071/api/batches/${batchId}`);
      // handle both shapes: res.data or res.data.batch
      const batch = res.data?.batch || res.data;
      setBatchName(batch?.name || "");
    } catch (err) {
      // non-fatal — just log
      console.warn("Failed to fetch batch name", err);
    }
  };

  useEffect(() => {
    if (batchId) {
      localStorage.setItem("selectedBatchId", batchId);
      fetchStudents();
      fetchBatchName();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  // keep groups nav behavior
  useEffect(() => {
    if (view === "groups" && batchId) {
      navigate(`/batches/${batchId}/groups`);
    }
  }, [view, batchId, navigate]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await axios.put(`http://localhost:7071/api/users/${id}`, {
        isActive: !currentStatus,
      });
      toast.success(`Marked as ${!currentStatus ? "Active" : "Inactive"}`);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Filtering ✅ (fixed)
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && student.isActive) ||
      (statusFilter === "inactive" && !student.isActive);

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage));
  const paginated = filteredStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRowsPerPage(25);
    setCurrentPage(1);
    setVisibleColumns(["name", "email", "mobile", "status", "createdAt"]);
  };

  return (
    <div className="space-y-6 fade-in p-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-t-xl border shadow-md flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Students</h1>
              {batchName && (
                <p className="text-sm text-gray-500">
                  Batch: <span className="font-medium">{batchName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filters Toggle */}
            <button
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition flex items-center gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <motion.span
                animate={{ rotate: showFilters ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="inline-block"
              >
                ▼
              </motion.span>
              Filters
            </button>

            {/* Add Student */}
            <Link
              to={`/students/create?batchId=${batchId}`}
              className="inline-flex items-center justify-center w-11 h-11 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-all"
            >
              <FaPlus size={20} />
            </Link>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
            >
              <div className="flex flex-wrap items-center gap-4 mt-2">
                {/* Search */}
                <div className="relative w-full md:w-60">
                  <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="input input-bordered pl-9 w-full"
                  />
                </div>

                {/* Status */}
                <select
                  className="input input-bordered w-40"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "all" | "active" | "inactive");
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                {/* Rows per page */}
                <select
                  className="input input-bordered w-40"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[25, 50, 75, 100].map((count) => (
                    <option key={count} value={count}>
                      {count} per page
                    </option>
                  ))}
                </select>

                {/* Right controls */}
                <div className="flex gap-4 ml-auto">
                  <div className="relative">
                    <button
                      onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                      Select Columns ▼
                    </button>
                    {showColumnDropdown && (
                      <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                        {allColumns.map((col) => (
                          <label key={col.key} className="flex items-center gap-2 text-sm py-1">
                            <input
                              type="checkbox"
                              checked={visibleColumns.includes(col.key)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setVisibleColumns([...visibleColumns, col.key]);
                                } else {
                                  setVisibleColumns(visibleColumns.filter((c) => c !== col.key));
                                }
                              }}
                            />
                            {col.label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="btn btn-secondary" onClick={resetFilters}>
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-lg border border-gray-200 bg-white">
        {loading ? (
          <p className="text-center text-gray-500 p-6">Loading...</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm">
              <tr>
                {allColumns
                  .filter((col) => visibleColumns.includes(col.key))
                  .map((col) => (
                    <th key={col.key} className="px-6 py-4 font-semibold">
                      {col.label}
                    </th>
                  ))}
                <th className="px-6 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {paginated.length > 0 ? (
                paginated.map((student) => (
                  <tr
                    key={student._id}
                    className="group hover:bg-blue-50 transition-all"
                  >
                    {allColumns
                      .filter((col) => visibleColumns.includes(col.key))
                      .map((col) => (
                        <td key={col.key} className="px-6 py-4 text-gray-700 align-middle">
                          {col.key === "name" ? (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="font-medium text-gray-800">{student.name}</div>
                            </div>
                          ) : col.key === "email" ? (
                            student.email || "-"
                          ) : col.key === "mobile" ? (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {student.mobile || "-"}
                            </div>
                          ) : col.key === "status" ? (
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${
                                student.isActive
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : "bg-red-100 text-red-700 border border-red-200"
                              }`}
                            >
                              {student.isActive ? "Active" : "Inactive"}
                            </span>
                          ) : col.key === "createdAt" ? (
                            new Date(student.createdAt).toLocaleDateString()
                          ) : (
                            (student as any)[col.key] || "-"
                          )}
                        </td>
                      ))}
                    <td
                      className="px-6 py-4 flex items-center justify-center gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to={`/students/edit/${student._id}`}
                        className="p-2 rounded-full bg-yellow-200 text-gray-500 hover:bg-yellow-500 shadow-md transition"
                        title="Edit"
                      >
                        <FiEdit size={18} />
                      </Link>

                      <button
                        onClick={() => handleToggleActive(student._id, student.isActive)}
                        className={`p-2 rounded-full transition ${
                          student.isActive
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                        }`}
                        title={student.isActive ? "Deactivate" : "Activate"}
                      >
                        <Power className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 1}
                    className="text-center py-10 text-gray-500 text-base font-medium"
                  >
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 bg-white border border-gray-200 shadow-md rounded-b-xl mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className={`px-3 py-1 rounded-md text-sm font-medium border shadow-sm ${
              currentPage === 1
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-blue-600 bg-gray-50 hover:bg-blue-100"
            }`}
          >
            Prev
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium border shadow-sm transition ${
                  currentPage === page ? "bg-blue-600 text-white shadow" : "bg-gray-50 text-gray-700 hover:bg-blue-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className={`px-3 py-1 rounded-md text-sm font-medium border shadow-sm ${
              currentPage === totalPages
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-blue-600 bg-gray-50 hover:bg-blue-100"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Students;

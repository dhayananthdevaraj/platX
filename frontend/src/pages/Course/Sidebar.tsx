// // Sidebar.tsx
// import React from "react";
// import axios from "axios";
// import toast from "react-hot-toast";

// const API_BASE = "http://localhost:7071/api";

// const Sidebar = ({ modules, selectedModule, onSelect, refresh, courseId }: any) => {
//   const createModule = async () => {
//     try {
//       const res = await axios.post(`${API_BASE}/module/create`, {
//         courseId,
//         moduleName: "New Module",
//         moduleDescription: "Description...",
//         order: modules.length + 1,
//       });
//       toast.success(res.data.message);
//       refresh();
//     } catch {
//       toast.error("Failed to create module");
//     }
//   };

//   const deleteModule = async (id: string) => {
//     try {
//       await axios.delete(`${API_BASE}/module/${id}`);
//       toast.success("Module deleted");
//       refresh();
//     } catch {
//       toast.error("Failed to delete module");
//     }
//   };

//   return (
//     <div className="w-64 bg-[#2e3359] text-white p-4">
//       <h3 className="font-semibold mb-4">Modules</h3>

//       <div className="space-y-2">
//         {modules.map((m: any, idx: number) => (
//           <div
//             key={m._id}
//             onClick={() => onSelect(m)}
//             className={`flex justify-between items-center p-2 rounded cursor-pointer ${
//               selectedModule?._id === m._id ? "bg-[#ff6600]" : "hover:bg-gray-600"
//             }`}
//           >
//             <span>{m.moduleName}</span>
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 deleteModule(m._id);
//               }}
//               className="text-red-400 hover:text-red-600"
//             >
//               🗑
//             </button>
//           </div>
//         ))}
//       </div>

//       <button
//         onClick={createModule}
//         className="mt-4 w-full bg-white text-black rounded py-2 text-sm"
//       >
//         + Add new Module
//       </button>
//     </div>
//   );
// };

// export default Sidebar;

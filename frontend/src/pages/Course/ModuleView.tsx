// // ModuleView.tsx
// import React from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import SectionRow from "./SectionRow";

// const API_BASE = "http://localhost:7071/api";

// const ModuleView = ({ module, refresh }: any) => {
//   const addSubmodule = async () => {
//     try {
//       const res = await axios.post(`${API_BASE}/section/create`, {
//         moduleId: module._id,
//         sectionName: "New Submodule",
//         sectionDescription: "Submodule description...",
//         order: (module.sections?.length || 0) + 1,
//       });
//       toast.success(res.data.message);
//       refresh();
//     } catch {
//       toast.error("Failed to add submodule");
//     }
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-lg font-semibold mb-4">{module.moduleName}</h2>

//       {/* Table */}
//       <div className="border rounded bg-white">
//         <div className="grid grid-cols-5 p-2 font-semibold bg-gray-100 border-b">
//           <span className="col-span-2">Content Name</span>
//           <span>Content Type</span>
//           <span>Access Key</span>
//           <span>Schedule</span>
//         </div>

//         {module.sections?.map((s: any) => (
//           <SectionRow key={s._id} section={s} refresh={refresh} />
//         ))}
//       </div>

//       <button
//         onClick={addSubmodule}
//         className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
//       >
//         + Add Submodule
//       </button>
//     </div>
//   );
// };

// export default ModuleView;

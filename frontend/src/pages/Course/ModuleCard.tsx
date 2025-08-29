// // ModuleCard.tsx
// import React from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import SectionCard from "./SectionCard";

// const API_BASE = "http://localhost:7071/api";

// interface ModuleCardProps {
//   module: any;
//   userId: string;
//   allTests: { _id: string; name?: string; title?: string }[];
//   loadingTests: boolean;
//   refresh: () => void;
// }

// const ModuleCard: React.FC<ModuleCardProps> = ({
//   module,
//   userId,
//   allTests,
//   loadingTests,
//   refresh,
// }) => {
//   const addSection = async () => {
//     try {
//       const res = await axios.post(`${API_BASE}/section/create`, {
//         moduleId: module._id,
//         sectionName: "New Section",
//         sectionDescription: "Section description...",
//         order: (module.sections?.length || 0) + 1,
//         lastUpdatedBy: userId,
//       });
//       toast.success(res.data.message);
//       refresh();
//     } catch (err: any) {
//       toast.error(err.response?.data?.message || "Failed to add section");
//     }
//   };

//   return (
//     <div className="border rounded-lg p-4 bg-gray-50">
//       <h3 className="text-lg font-semibold">{module.moduleName}</h3>
//       <p className="text-sm text-gray-600">{module.moduleDescription}</p>

//       <button
//         onClick={addSection}
//         className="mt-2 px-3 py-1 bg-green-600 text-white rounded"
//       >
//         + Add Section
//       </button>

//       <div className="mt-3 space-y-2">
//         {module.sections?.map((s: any) => (
//           <SectionCard
//             key={s._id}
//             section={s}
//             userId={userId}
//             allTests={allTests}
//            courseId={module.courseId}   // ✅ added this

//             loadingTests={loadingTests}
//             onChanged={refresh} // ✅ aligned prop name
//           />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ModuleCard;

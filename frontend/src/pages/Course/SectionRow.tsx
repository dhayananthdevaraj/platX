// // SectionRow.tsx
// import React from "react";
// import axios from "axios";
// import toast from "react-hot-toast";

// const API_BASE = "http://localhost:7071/api";

// const SectionRow = ({ section, refresh }: any) => {
//   const deleteSection = async () => {
//     try {
//       await axios.delete(`${API_BASE}/section/${section._id}`);
//       toast.success("Submodule deleted");
//       refresh();
//     } catch {
//       toast.error("Failed to delete submodule");
//     }
//   };

//   return (
//     <div className="grid grid-cols-5 p-2 border-b items-center">
//       <span className="col-span-2">{section.sectionName}</span>
//       <span>{section.contentType || "Manual Assessment Test"}</span>
//       <span>-</span>
//       <span>
//         {section.scheduleStart || "31/03/2023 02:00 PM"} -{" "}
//         {section.scheduleEnd || "30/04/2023 11:59 PM"}
//       </span>
//       <button
//         onClick={deleteSection}
//         className="ml-2 text-red-500 hover:text-red-700"
//       >
//         🗑
//       </button>
//     </div>
//   );
// };

// export default SectionRow;

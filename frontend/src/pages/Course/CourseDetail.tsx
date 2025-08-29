import React, { useState } from "react";
import { useParams } from "react-router-dom";
import CourseEnrollment from "./CourseEnrollment";
import CourseBuilder from "./CourseBuilder";

const tabs = ["Enrollment", "Builder"] as const;
type Tab = typeof tabs[number];

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("Enrollment");

  return (
    <div className="p-6">
      <div className="flex space-x-4 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "Enrollment" && <CourseEnrollment />}
        {activeTab === "Builder" &&courseId && (
                    <CourseBuilder courseId={courseId} />
        )}
      </div>
    </div>
  );
};

export default CourseDetail;

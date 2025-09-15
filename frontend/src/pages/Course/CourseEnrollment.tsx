import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Select from "react-select";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:7071/api";

type Option = { value: string; label: string };

interface Institute {
  _id: string;
  name: string;
}

interface PopulatedInstitute {
  _id: string;
  name: string;
}

interface Batch {
  _id: string;
  name: string;
  // Backend populates batch.instituteId; it may be:
  // - a string (ObjectId)
  // - a populated object { _id, name }
  // - an array of populated objects
  instituteId?:
    | string
    | PopulatedInstitute
    | PopulatedInstitute[];
}

interface Enrollment {
  _id: string;
  courseId: string;
  batchId: Batch;
}

// Simple Tailwind Button
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <button
    className={`px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const CourseEnrollment: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<any>(null);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedInstituteOption, setSelectedInstituteOption] = useState<Option | null>(null);
  const [selectedBatchOption, setSelectedBatchOption] = useState<Option | null>(null);

  // Helpers to derive display-friendly institute name from batch.instituteId (various shapes)
  const getInstituteIdFromBatch = (batch?: Batch): string | undefined => {
    if (!batch || batch.instituteId == null) return undefined;
    if (typeof batch.instituteId === "string") return batch.instituteId;
    if (Array.isArray(batch.instituteId)) return batch.instituteId[0]?._id;
    return batch.instituteId._id;
  };

  const getInstituteNameFromBatch = (batch?: Batch): string | undefined => {
    if (!batch || batch.instituteId == null) return undefined;
    if (typeof batch.instituteId === "string") return undefined; // not populated
    if (Array.isArray(batch.instituteId)) return batch.instituteId[0]?.name;
    return batch.instituteId.name;
  };

  // Build react-select options
  const instituteOptions = useMemo<Option[]>(
    () => institutes.map((i) => ({ value: i._id, label: i.name })),
    [institutes]
  );
  const batchOptions = useMemo<Option[]>(
    () => batches.map((b) => ({ value: b._id, label: b.name })),
    [batches]
  );

  // Initial fetches
  useEffect(() => {
    if (!courseId) return;

    axios
      .get(`${API_BASE}/course/${courseId}`)
      .then((res) => setCourse(res.data))
      .catch(() => toast.error("Failed to load course"));

    fetchEnrollment();
    fetchInstitutes();
  }, [courseId]);

  const fetchEnrollment = async () => {
    if (!courseId) return;
    try {
      const res = await axios.get(`${API_BASE}/enrollments/course/${courseId}`);
      // The backend returns an array (per your function), but just in case handle both
      const data = res.data;
      const first: Enrollment | null = Array.isArray(data) ? (data[0] ?? null) : data ?? null;
      setEnrollment(first);
      // ✅ Store batch ID in localStorage if available
      if (first?.batchId?._id) {
        localStorage.setItem("selectedBatchId", first.batchId._id);
      }
    } catch {
      setEnrollment(null); // none yet
    }
  };

  const fetchInstitutes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/institutes`);
      setInstitutes(res.data.institutes || []);
    } catch {
      toast.error("Failed to load institutes");
    }
  };

  const fetchBatches = async (instituteId: string) => {
    try {
      const res = await axios.get(`${API_BASE}/batch/institute/${instituteId}`);
      setBatches(res.data.batches || []);
    } catch {
      toast.error("Failed to load batches");
    }
  };

  // When user clicks "Edit Enrollment", pre-select institute & batch
  useEffect(() => {
    // Only try to prefill when editing starts and we have enrollment + institutes
    if (!editing || !enrollment || institutes.length === 0) return;

    const inferredInstituteId = getInstituteIdFromBatch(enrollment.batchId);
    if (!inferredInstituteId) {
      // If institute isn't populated on the enrollment's batch, just leave institute unselected
      setSelectedInstituteOption(null);
      setSelectedBatchOption(null);
      return;
    }

    // Find and set preselected institute option
    const inst = institutes.find((i) => i._id === inferredInstituteId);
    const instOption = inst ? { value: inst._id, label: inst.name } : null;
    setSelectedInstituteOption(instOption);

    // Load batches for that institute, then select current batch
    (async () => {
      await fetchBatches(inferredInstituteId);
      const batch = enrollment.batchId;
      if (batch?._id) {
        setSelectedBatchOption({ value: batch._id, label: batch.name });
      }
    })();
  }, [editing, enrollment, institutes]);

  const handleSave = async () => {
    if (!selectedBatchOption || !courseId) {
      toast.error("Please select a batch");
      return;
    }

    setSaving(true);
    try {
      if (enrollment) {
        await axios.put(`${API_BASE}/enrollment/update/${enrollment._id}`, {
          batchId: selectedBatchOption.value,
          courseId,
        });
        toast.success("Enrollment updated!");
      } else {
        await axios.post(`${API_BASE}/enrollment/create`, {
          batchId: selectedBatchOption.value,
          courseId,
        });
        toast.success("Enrollment created!");
      }
      setEditing(false);
      setSelectedBatchOption(null);
      setSelectedInstituteOption(null);
      await fetchEnrollment();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save enrollment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Header with course info */}
      {course && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
          <p className="text-gray-600">Code: {course.courseCode}</p>
        </div>
      )}

      {/* Existing enrollment (read-only) */}
      {enrollment && !editing ? (
        <div className="space-y-4 rounded-lg border p-4 bg-white">
          <div>
            <span className="font-semibold text-gray-700">Institute: </span>
            <span className="text-gray-900">
              {getInstituteNameFromBatch(enrollment.batchId) || "N/A"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Batch: </span>
            <span className="text-gray-900">
              {enrollment.batchId?.name || "N/A"}
            </span>
          </div>
          <Button onClick={() => setEditing(true)}>Edit Enrollment</Button>
        </div>
      ) : (
        // Create/Edit form
        <div className="space-y-4 max-w-lg rounded-lg border p-4 bg-white">
          <div>
            <label className="block mb-1 font-medium text-gray-800">Select Institute</label>
            <Select
              isSearchable
              isClearable
              value={selectedInstituteOption}
              options={instituteOptions}
              placeholder="Search institute..."
              onChange={(opt) => {
                setSelectedInstituteOption(opt as Option | null);
                setSelectedBatchOption(null);
                if (opt?.value) fetchBatches(opt.value);
                else setBatches([]);
              }}
            />
          </div>

          {selectedInstituteOption && (
            <div>
              <label className="block mb-1 font-medium text-gray-800">Select Batch</label>
              <Select
                isSearchable
                isClearable
                value={selectedBatchOption}
                options={batchOptions}
                placeholder="Search batch..."
                onChange={(opt) => setSelectedBatchOption(opt as Option | null)}
              />
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <Button onClick={handleSave} disabled={saving || !selectedBatchOption}>
              {saving ? "Saving..." : enrollment ? "Update Enrollment" : "Save Enrollment"}
            </Button>
            {(enrollment || editing) && (
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
                onClick={() => {
                  setEditing(false);
                  setSelectedInstituteOption(null);
                  setSelectedBatchOption(null);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollment;

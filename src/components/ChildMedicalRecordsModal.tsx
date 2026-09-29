import { useState, useEffect } from "react";
import {
  X,
  Upload,
  FileText,
  Download,
  Trash2,
  Plus,
} from "lucide-react";

interface ChildMedicalRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: {
    id: string;
    full_name: string;
  };
}

interface MedicalRecord {
  id: string;
  record_type: string;
  record_name: string;
  record_url: string;
  record_date: string;
  description?: string;
  file_size?: number;
}

export function ChildMedicalRecordsModal({
  isOpen,
  onClose,
  child,
}: ChildMedicalRecordsModalProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [uploadForm, setUploadForm] = useState({
    record_type: "lab_report",
    record_name: "",
    record_date: new Date().toISOString().split("T")[0],
    description: "",
    file: null as File | null,
  });

  useEffect(() => {
    if (isOpen && child) {
      fetchRecords();
    }
  }, [isOpen, child]);

  // Fetch records from PostgreSQL API
  const fetchRecords = async () => {
    setLoading(true);

    try {

      const res = await fetch(
        `http://localhost:5000/api/medical-records/${child.id}`
      );

      const data = await res.json();

      // ⭐ SAFE CHECK
      if (Array.isArray(data)) {
        setRecords(data);
      } else {
        console.error("Invalid records data:", data);
        setRecords([]);
      }

    } catch (error) {

      console.error("Fetch records error:", error);

      setRecords([]);

    } finally {

      setLoading(false);

    }
  };

  // File select
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10MB");
        return;
      }

      setUploadForm({
        ...uploadForm,
        file,
      });

      setError("");
    }
  };

  // Upload record
  const handleUpload = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!uploadForm.file) {
      setError("Select file");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append(
        "file",
        uploadForm.file
      );

      formData.append(
        "record_type",
        uploadForm.record_type
      );

      formData.append(
        "record_name",
        uploadForm.record_name
      );

      formData.append(
        "record_date",
        uploadForm.record_date
      );

      formData.append(
        "description",
        uploadForm.description
      );

      formData.append(
        "dependent_id",
        child.id
      );

      const res = await fetch(
        "http://localhost:5000/api/medical-records",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Upload failed"
        );
      }

      setShowUploadForm(false);

      setUploadForm({
        record_type: "lab_report",
        record_name: "",
        record_date:
          new Date()
            .toISOString()
            .split("T")[0],
        description: "",
        file: null,
      });

      fetchRecords();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete record
  const handleDelete = async (
    id: string
  ) => {
    if (!confirm("Delete record?")) return;

    await fetch(
      `http://localhost:5000/api/medical-records/${id}`,
      {
        method: "DELETE",
      }
    );

    fetchRecords();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="bg-white rounded-lg max-w-4xl w-full p-6 relative">

        <button
          onClick={onClose}
          className="absolute right-4 top-4"
        >
          <X />
        </button>

        <h2 className="text-2xl font-bold">
          Medical Records
        </h2>

        <p className="text-gray-600 mb-6">
          Managing records for {child.full_name}
        </p>

        {!showUploadForm ? (
          <>
            <button
              onClick={() =>
                setShowUploadForm(true)
              }
              className="flex gap-2 bg-blue-600 text-white px-4 py-2 rounded mb-6"
            >
              <Plus size={16} />
              Add New Record
            </button>

            {records.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="mx-auto text-gray-400 mb-2" />
                No medical records yet
              </div>
            ) : (
              (Array.isArray(records) ? records : []).map((r) => (
                <div
                  key={r.id}
                  className="border p-4 rounded mb-3 flex justify-between"
                >
                  <div>
                    <h3 className="font-semibold">
                      {r.record_name}
                    </h3>

                    <p className="text-sm text-gray-600">
                      {r.record_type} •{" "}
                      {new Date(
                        r.record_date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">

                    <a
                      href={`http://localhost:5000/uploads/${r.record_url}`}
                      target="_blank"
                    >
                      <Download />
                    </a>

                    <button
                      onClick={() =>
                        handleDelete(r.id)
                      }
                    >
                      <Trash2 className="text-red-600" />
                    </button>

                  </div>
                </div>
              ))
            )}
          </>
        ) : (

          <form
            onSubmit={handleUpload}
            className="space-y-4"
          >

            <select
              value={uploadForm.record_type}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  record_type: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            >
              <option value="lab_report">
                Lab Report
              </option>
              <option value="prescription">
                Prescription
              </option>
              <option value="imaging">
                Imaging
              </option>
            </select>

            <input
              type="text"
              placeholder="Record Name"
              value={uploadForm.record_name}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  record_name: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
              required
            />

            <input
              type="date"
              value={uploadForm.record_date}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  record_date: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
              required
            />

            <textarea
              placeholder="Description"
              value={uploadForm.description}
              onChange={(e) =>
                setUploadForm({
                  ...uploadForm,
                  description: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            />

            <input
              type="file"
              onChange={handleFileChange}
              required
            />

            {error && (
              <p className="text-red-600">
                {error}
              </p>
            )}

            <div className="flex gap-3">

              <button
                type="button"
                onClick={() =>
                  setShowUploadForm(false)
                }
                className="flex-1 border p-2 rounded"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white p-2 rounded"
              >
                {uploading
                  ? "Uploading..."
                  : "Upload Record"}
              </button>

            </div>

          </form>

        )}
      </div>
    </div>
  );
}
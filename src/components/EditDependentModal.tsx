import { useState } from "react";
import { X } from "lucide-react";

interface EditDependentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  child: any;
}

export function EditDependentModal({
  isOpen,
  onClose,
  onSuccess,
  child
}: EditDependentModalProps) {

  const [formData, setFormData] = useState({
    full_name: child?.full_name || "",
    date_of_birth: child?.date_of_birth
      ? child.date_of_birth.split("T")[0]
      : "",
    gender: child?.gender || "male",
    relationship: child?.relationship || "",
    blood_group: child?.blood_group || "",
    allergies: child?.allergies || "",
    chronic_conditions: child?.chronic_conditions || "",
    current_medications: child?.current_medications || "",
    notes: child?.notes || "",
    caregiver_name: child?.caregiver_name || "",
    caregiver_relationship: child?.caregiver_relationship || ""
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen || !child) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:5000/update-dependent/${child.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Update failed");
      }

      alert("Dependent updated successfully");

      onSuccess();
      onClose();

    } catch (error) {
      console.error("Update dependent error:", error);
      alert("Failed to update dependent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-4">

          <h2 className="text-xl font-bold">
            Edit Dependent
          </h2>

          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>

        </div>

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            type="text"
            placeholder="Full Name"
            value={formData.full_name}
            onChange={(e) =>
              setFormData({
                ...formData,
                full_name: e.target.value
              })
            }
            className="w-full border p-2 rounded"
            required
          />

          <input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) =>
              setFormData({
                ...formData,
                date_of_birth: e.target.value
              })
            }
            className="w-full border p-2 rounded"
            required
          />

          <select
            value={formData.gender}
            onChange={(e) =>
              setFormData({
                ...formData,
                gender: e.target.value
              })
            }
            className="w-full border p-2 rounded"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>

          <input
            type="text"
            placeholder="Relationship"
            value={formData.relationship}
            onChange={(e) =>
              setFormData({
                ...formData,
                relationship: e.target.value
              })
            }
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Blood Group"
            value={formData.blood_group}
            onChange={(e) =>
              setFormData({
                ...formData,
                blood_group: e.target.value
              })
            }
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Allergies"
            value={formData.allergies}
            onChange={(e) =>
              setFormData({
                ...formData,
                allergies: e.target.value
              })
            }
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Chronic Conditions"
            value={formData.chronic_conditions}
            onChange={(e) =>
              setFormData({
                ...formData,
                chronic_conditions: e.target.value
              })
            }
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Current Medications"
            value={formData.current_medications}
            onChange={(e) =>
              setFormData({
                ...formData,
                current_medications: e.target.value
              })
            }
            className="w-full border p-2 rounded"
          />

          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({
                ...formData,
                notes: e.target.value
              })
            }
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Caregiver Name"
            value={formData.caregiver_name}
            onChange={(e) =>
              setFormData({
                ...formData,
                caregiver_name: e.target.value
              })
            }
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Caregiver Relationship"
            value={formData.caregiver_relationship}
            onChange={(e) =>
              setFormData({
                ...formData,
                caregiver_relationship: e.target.value
              })
            }
            className="w-full border p-2 rounded"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>

        </form>

      </div>

    </div>
  );
}
import { useState } from "react";
import {
  X,
  AlertCircle,
  FileSignature
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

interface AddDependentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddDependentModal({
  isOpen,
  onClose,
  onSuccess
}: AddDependentModalProps) {

  const { user } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "male",
    relationship: "son",
    blood_group: "",
    allergies: "",
    chronic_conditions: "",
    current_medications: "",
    notes: "",
    caregiver_name: "",
    caregiver_relationship: ""
  });

  const [consentAgreed, setConsentAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!user) {
      alert("User not logged in");
      return;
    }

    if (!consentAgreed) {
      alert("Please accept consent");
      return;
    }

    if (!signature) {
      alert("Please provide digital signature");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch(
        "http://localhost:5000/add-dependent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            parent_id: user.id,
            ...formData
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      alert("Dependent added successfully");

      onSuccess();
      onClose();

    } catch (error) {

      console.error(error);
      alert("Failed to add dependent");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-4">

          <h2 className="text-xl font-bold">
            Add Dependent
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

          <input
            type="text"
            placeholder="Digital Signature"
            value={signature}
            onChange={(e) =>
              setSignature(e.target.value)
            }
            className="w-full border p-2 rounded"
            required
          />

          <label className="flex items-center gap-2 text-sm">

            <input
              type="checkbox"
              checked={consentAgreed}
              onChange={(e) =>
                setConsentAgreed(e.target.checked)
              }
            />

            I agree to consent terms

          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >

            {loading
              ? "Adding..."
              : "Add Dependent"}

          </button>

        </form>

      </div>

    </div>

  );

}
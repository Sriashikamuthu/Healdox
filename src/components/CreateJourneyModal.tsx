import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface CreateJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateJourneyModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateJourneyModalProps) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    condition: "",
    symptoms_description: "",
    symptoms_started_date: "",
    diagnosis_date: "",
    current_status: "ongoing",
    outcome_description: "",
    is_anonymous: false,
    country: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          title: formData.title,
          condition: formData.condition,
          symptoms_description: formData.symptoms_description,
          symptoms_started_date: formData.symptoms_started_date || null,
          diagnosis_date: formData.diagnosis_date || null,
          current_status: formData.current_status,
          outcome_description: formData.outcome_description || null,
          country: formData.country || null,
          is_anonymous: formData.is_anonymous,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create journey");
      }

      onSuccess();
      onClose();

      setFormData({
        title: "",
        condition: "",
        symptoms_description: "",
        symptoms_started_date: "",
        diagnosis_date: "",
        current_status: "ongoing",
        outcome_description: "",
        is_anonymous: false,
        country: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to create journey");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">
          Share Your Healthcare Journey
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Brief summary of your journey"
            />
          </div>

          {/* Condition + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Condition *
              </label>
              <input
                type="text"
                required
                value={formData.condition}
                onChange={(e) =>
                  setFormData({ ...formData, condition: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Diabetes, Cancer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Current Status *
              </label>
              <select
                value={formData.current_status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    current_status: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="ongoing">Ongoing</option>
                <option value="resolved">Resolved</option>
                <option value="improved">Improved</option>
                <option value="worsened">Worsened</option>
              </select>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Symptoms Description *
            </label>

            <textarea
              required
              value={formData.symptoms_description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  symptoms_description: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-md min-h-[120px]"
              placeholder="Describe your symptoms and experience..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Symptoms Started Date
              </label>
              <input
                type="date"
                value={formData.symptoms_started_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    symptoms_started_date: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Diagnosis Date
              </label>
              <input
                type="date"
                value={formData.diagnosis_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    diagnosis_date: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Outcome */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Outcome Description
            </label>

            <textarea
              value={formData.outcome_description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  outcome_description: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Share the outcome or current progress..."
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>

            <input
              type="text"
              value={formData.country}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  country: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Your country"
            />
          </div>

          {/* Anonymous */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_anonymous}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  is_anonymous: e.target.checked,
                })
              }
              className="mr-2"
            />
            Post anonymously
          </div>

          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded">{error}</div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border py-2 rounded-md"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md"
            >
              {loading ? "Sharing..." : "Share Journey"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
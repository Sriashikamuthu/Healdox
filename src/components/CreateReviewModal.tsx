import React, { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateReviewModal({
  isOpen,
  onClose,
  onSuccess
}: Props) {

  if (!isOpen) return null;

  // Provider Details
  const [providerName, setProviderName] = useState("");
  const [providerType, setProviderType] = useState("Doctor");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [visitDate, setVisitDate] = useState("");

  // Ratings
  const [overallRating, setOverallRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [expertiseRating, setExpertiseRating] = useState(0);
  const [facilityRating, setFacilityRating] = useState(0);
  const [waitTimeRating, setWaitTimeRating] = useState(0);

  // Review
  const [reviewText, setReviewText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const renderStars = (
    rating: number,
    setRating: (val: number) => void
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(num => (
          <span
            key={num}
            onClick={() => setRating(num)}
            className={`cursor-pointer text-xl ${
              num <= rating
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleSubmit = async () => {

    try {

      const userData = localStorage.getItem("user");

      if (!userData) {
        alert("User not logged in");
        return;
      }

      const user = JSON.parse(userData);

      const reviewData = {

        user_id: anonymous ? null : user.id,

        provider_name: providerName,
        provider_type: providerType,
        specialty,
        city,
        country,
        visit_date: visitDate,

        overall_rating: overallRating,
        communication_rating: communicationRating,
        expertise_rating: expertiseRating,
        facility_rating: facilityRating,
        wait_time_rating: waitTimeRating,

        review_text: reviewText

      };

      const res = await fetch(
        "http://localhost:5000/api/provider-reviews",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(reviewData)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      alert("Review submitted successfully");

      onClose();

      if (onSuccess) onSuccess();

    } catch (err) {

      console.error(err);

      alert("Failed to submit review");

    }

  };

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">

        {/* Header */}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Review Healthcare Provider
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Provider Info */}

        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="text-sm font-medium">
              Provider Name *
            </label>

            <input
              type="text"
              value={providerName}
              onChange={e =>
                setProviderName(e.target.value)
              }
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Provider Type *
            </label>

            <select
              value={providerType}
              onChange={e =>
                setProviderType(e.target.value)
              }
              className="w-full border rounded px-3 py-2 mt-1"
            >
              <option>Doctor</option>
              <option>Clinic</option>
              <option>Hospital</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium">
              Specialty
            </label>

            <input
              type="text"
              value={specialty}
              onChange={e =>
                setSpecialty(e.target.value)
              }
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              City
            </label>

            <input
              value={city}
              onChange={e =>
                setCity(e.target.value)
              }
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Country
            </label>

            <input
              value={country}
              onChange={e =>
                setCountry(e.target.value)
              }
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium">
              Visit Date
            </label>

            <input
              type="date"
              value={visitDate}
              onChange={e =>
                setVisitDate(e.target.value)
              }
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

        </div>

        {/* Ratings */}

        <div className="mt-6 space-y-3">

          <div>
            <p className="font-medium">
              Overall Rating *
            </p>
            {renderStars(
              overallRating,
              setOverallRating
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">

            <div>
              <p>Communication</p>
              {renderStars(
                communicationRating,
                setCommunicationRating
              )}
            </div>

            <div>
              <p>Expertise</p>
              {renderStars(
                expertiseRating,
                setExpertiseRating
              )}
            </div>

            <div>
              <p>Facility</p>
              {renderStars(
                facilityRating,
                setFacilityRating
              )}
            </div>

            <div>
              <p>Wait Time</p>
              {renderStars(
                waitTimeRating,
                setWaitTimeRating
              )}
            </div>

          </div>

        </div>

        {/* Review */}

        <div className="mt-6">

          <label className="font-medium">
            Your Review
          </label>

          <textarea
            value={reviewText}
            onChange={e =>
              setReviewText(e.target.value)
            }
            rows={4}
            className="w-full border rounded px-3 py-2 mt-1"
          />

        </div>

        {/* Anonymous */}

        <div className="mt-3 flex items-center gap-2">

          <input
            type="checkbox"
            checked={anonymous}
            onChange={e =>
              setAnonymous(e.target.checked)
            }
          />

          <label>
            Post anonymously
          </label>

        </div>

        {/* Buttons */}

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Submit Review
          </button>

        </div>

      </div>

    </div>

  );

}
import { MapPin, Calendar, Heart, MessageCircle, Star } from "lucide-react";
import { formatDistanceToNow } from "../utils/date";

interface DoctorReviewCardProps {
  review: any;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  hasLiked?: boolean;
  reviewComments: Record<number, any[]>;
}

export default function DoctorReviewCard({
  review,
  onLike,
  onComment,
  hasLiked,
  reviewComments
}: DoctorReviewCardProps) {

  /* ⭐ Render Stars */

  const renderStars = (rating: number) => {

    return (

      <div className="flex gap-0.5">

        {[1,2,3,4,5].map((star) => (

          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />

        ))}

      </div>

    );

  };

  const displayName =
    review.username ||
    review.email?.split("@")[0] ||
    "User";

  return (

    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">

      {/* HEADER */}

      <div className="flex justify-between items-start">

        <div className="flex gap-4">

          {/* Avatar */}

          <div className="w-12 h-12 bg-green-500 text-white flex items-center justify-center rounded-full font-semibold">

            {displayName[0]?.toUpperCase()}

          </div>

          <div>

            <p className="font-medium text-gray-900">

              {displayName}

            </p>

            <p className="text-sm text-gray-500">

              {formatDistanceToNow(
                review.created_at
              )}

            </p>

            {/* Doctor Name */}

            <h3 className="text-lg font-semibold text-gray-900 mt-2">

              {review.provider_name}

            </h3>

            {/* Tags */}

            <div className="flex gap-2 mt-1">

              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">

                {review.provider_type}

              </span>

              {review.provider_specialty && (

                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">

                  {review.provider_specialty}

                </span>

              )}

            </div>

          </div>

        </div>

        {/* Overall Rating */}

        <div className="text-right">

          {renderStars(
            review.overall_rating
          )}

          <p className="text-sm text-gray-500">

            {review.overall_rating}.0 / 5.0

          </p>

        </div>

      </div>

      {/* Review Text */}

      {review.review_text && (

        <p className="text-gray-700 mt-4">

          {review.review_text}

        </p>

      )}

      {/* Ratings Grid */}

      <div className="grid grid-cols-2 gap-6 mt-4 text-sm">

        {review.communication_rating && (

          <div>

            <p className="text-gray-600">
              Communication
            </p>

            {renderStars(
              review.communication_rating
            )}

          </div>

        )}

        {review.expertise_rating && (

          <div>

            <p className="text-gray-600">
              Expertise
            </p>

            {renderStars(
              review.expertise_rating
            )}

          </div>

        )}

        {review.facility_rating && (

          <div>

            <p className="text-gray-600">
              Facility
            </p>

            {renderStars(
              review.facility_rating
            )}

          </div>

        )}

        {review.wait_time_rating && (

          <div>

            <p className="text-gray-600">
              Wait Time
            </p>

            {renderStars(
              review.wait_time_rating
            )}

          </div>

        )}

      </div>

      {/* Footer Info */}

      <div className="flex items-center gap-6 text-sm text-gray-600 mt-4">

        {review.location_city &&
         review.location_country && (

          <div className="flex items-center gap-1">

            <MapPin size={16} />

            {review.location_city},
            {" "}
            {review.location_country}

          </div>

        )}

        {review.visit_date && (

          <div className="flex items-center gap-1">

            <Calendar size={16} />

            Visited:
            {" "}
            {new Date(
              review.visit_date
            ).toLocaleDateString()}

          </div>

        )}

      </div>

      {/* Actions */}

      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">

        <button
          onClick={() => onLike?.(review.id)}
          className="flex items-center gap-2 hover:text-red-500"
        >
          ❤️ {review.like_count || 0} helpful
        </button>

        <button
          onClick={() => onComment?.(review.id)}
          className="flex items-center gap-2 hover:text-blue-600"
        >
          💬 {(reviewComments?.[review.id] || []).length} comments
        </button>

      </div>

    </div>

  );

}
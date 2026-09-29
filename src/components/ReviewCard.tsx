import { Star, Heart, MapPin, Calendar, MessageCircle } from 'lucide-react';
import { ProviderReview } from '../types/database';
import { formatDistanceToNow } from '../utils/date';

interface ReviewCardProps {
  review: ProviderReview;
  onLike: (reviewId: string) => void;
  onComment?: (reviewId: string) => void;
  hasLiked: boolean;
}

export function ReviewCard({
  review,
  onLike,
  onComment,
  hasLiked
}: ReviewCardProps) {

  const displayName =
        review.full_name ||
        review.username ||
        'Unknown User';

  /* ⭐ Render Stars */

  const renderStars = (rating: number) => {

    return (

      <div className="flex gap-0.5">

        {[1,2,3,4,5].map((star) => (

          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />

        ))}

      </div>

    );

  };

  /* ⭐ Rating Row */

  const RatingRow = ({
    label,
    value
  }: {
    label: string;
    value?: number;
  }) => {

    if (!value) return null;

    return (

      <div className="flex justify-between items-center">

        <span className="text-gray-600 text-sm">
          {label}
        </span>

        {renderStars(value)}

      </div>

    );

  };

  return (

    <article className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">

      {/* HEADER */}

      <div className="flex justify-between items-start mb-4">

        <div className="flex items-center gap-3">

          {/* Avatar */}

          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-lg">

            {displayName[0].toUpperCase()}

          </div>

          <div>

            <p className="font-semibold text-gray-900">

              {displayName}

            </p>

            <p className="text-sm text-gray-500">

              {formatDistanceToNow(
                review.created_at
              )}

            </p>

          </div>

        </div>

        {/* Overall Rating */}

        <div className="text-right">

          {renderStars(
            review.overall_rating
          )}

          <p className="text-sm text-gray-600 mt-1">

            {review.overall_rating}.0 / 5.0

          </p>

        </div>

      </div>

      {/* DOCTOR SECTION */}

      <div className="mb-4">

        <h2 className="text-lg font-bold text-gray-900">

          {review.provider_name}

        </h2>

        <div className="flex items-center gap-2 mt-1">

          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">

            {review.provider_type}

          </span>

          {review.provider_specialty && (

            <span className="text-sm text-gray-600">

              {review.provider_specialty}

            </span>

          )}

        </div>

      </div>

      {/* REVIEW TEXT */}

      {review.review_text && (

        <p className="text-gray-700 mb-4">

          {review.review_text}

        </p>

      )}

      {/* CATEGORY RATINGS */}

      <div className="grid grid-cols-2 gap-4 mb-4">

        <RatingRow
          label="Communication"
          value={review.communication_rating}
        />

        <RatingRow
          label="Expertise"
          value={review.expertise_rating}
        />

        <RatingRow
          label="Facility"
          value={review.facility_rating}
        />

        <RatingRow
          label="Wait Time"
          value={review.wait_time_rating}
        />

      </div>

      {/* LOCATION + DATE */}

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">

        {review.location_city &&
         review.location_country && (

          <div className="flex items-center gap-1">

            <MapPin className="w-4 h-4" />

            <span>

              {review.location_city},
              {review.location_country}

            </span>

          </div>

        )}

        {review.visit_date && (

          <div className="flex items-center gap-1">

            <Calendar className="w-4 h-4" />

            <span>

              Visited:
              {' '}
              {new Date(
                review.visit_date
              ).toLocaleDateString()}

            </span>

          </div>

        )}

      </div>

      {/* ACTION BUTTONS */}

      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">

        <button
          onClick={() =>
            onLike(review.id)
          }
          className={`flex items-center gap-2 transition-colors ${
            hasLiked
              ? 'text-red-500'
              : 'text-gray-600 hover:text-red-500'
          }`}
        >

          <Heart
            className={`w-5 h-5 ${
              hasLiked
                ? 'fill-current'
                : ''
            }`}
          />

          <span className="text-sm font-medium">

            {review.helpful_count} helpful

          </span>

        </button>

        {onComment && (

          <button
            onClick={() =>
              onComment(review.id)
            }
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >

            <MessageCircle className="w-5 h-5" />

            <span className="text-sm font-medium">

              Comment

            </span>

          </button>

        )}

      </div>

    </article>

  );

}
import { Heart, MessageCircle, Calendar, MapPin } from 'lucide-react';
import { PatientJourney } from '../types/database';
import { formatDistanceToNow } from '../utils/date';
import { ConnectButton } from './ConnectButton';

interface JourneyCardProps {
  journey: PatientJourney;
  onLike: (journeyId: string) => void;
  onComment: (journeyId: string) => void;
  hasLiked: boolean;
}

export function JourneyCard({ journey, onLike, onComment, hasLiked }: JourneyCardProps) {
  const displayName = journey.is_anonymous ? 'Anonymous' : journey.profiles?.full_name || journey.profiles?.username || 'Unknown User';

  return (
    <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-semibold text-lg">
          {displayName[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{displayName}</h3>
          <p className="text-sm text-gray-500">{formatDistanceToNow(journey.created_at)}</p>
        </div>
        {!journey.is_anonymous && journey.user_id && (
          <ConnectButton userId={journey.user_id} userName={displayName} />
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{journey.title}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            {journey.condition}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
            {journey.current_status}
          </span>
        </div>
        <p className="text-gray-700 line-clamp-3">{journey.symptoms_description}</p>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        {journey.diagnosis_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>Diagnosed: {new Date(journey.diagnosis_date).toLocaleDateString()}</span>
          </div>
        )}
        {journey.country && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{journey.country}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => onLike(journey.id)}
          className={`flex items-center gap-2 transition-colors ${
            hasLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{journey.helpful_count}</span>
        </button>
        <button
          onClick={() => onComment(journey.id)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Comment</span>
        </button>
      </div>
    </article>
  );
}
